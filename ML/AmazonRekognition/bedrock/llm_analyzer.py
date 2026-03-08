import boto3
from botocore.config import Config
import json
import os
import io
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

AWS_REGION      = os.getenv("AWS_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.getenv(
    "BEDROCK_MODEL_ID",
    "us.amazon.nova-2-lite-v1:0"
)
MAX_TOKENS = 2048

TRIAGE_PROMPT_TEMPLATE = """You are a highly specialized AI medical emergency triage system embedded in an emergency-response application. Your analysis may trigger a live 108 call. Be precise, thorough, and conservative (when in doubt, escalate severity).

You have been given:
1. The actual image for direct visual analysis
2. Supporting data from AWS Rekognition: {rekognition_summary}

CRITICAL: Respond with ONLY valid JSON. No explanatory text before or after. No markdown code blocks. Start with {{ and end with }}.

Perform a full emergency assessment and return this exact JSON schema:

{{
  "emergency_level": "<critical|urgent|moderate|low|none>",
  "urgency_score": <integer 0-100>,
  "call_ambulance": <true|false>,
  "call_police": <true|false>,
  "call_fire_department": <true|false>,
  "time_critical": <true|false>,
  "scene_type": "<traffic_accident|fall_injury|cardiac_event|stroke|fire_hazard|violence_assault|drowning|burns|medical_emergency|overdose_poisoning|mental_health_crisis|normal|other>",
  "patient_status": {{
    "estimated_victims": <integer>,
    "consciousness_level": "<conscious_alert|conscious_confused|unconscious|normal>",
    "breathing_status": "<normal|labored_distressed|not_breathing|normal>",
    "injury_severity": "<life_threatening|serious|moderate|minor|none>"
  }},
  "detected_injuries": [
    {{
      "type": "<e.g. laceration, fracture, burn, head_trauma, chest_injury, spinal_injury, bruising>",
      "body_location": "<e.g. head, neck, chest, abdomen, left_arm, right_leg>",
      "severity": "<critical|serious|moderate|minor>",
      "visible_signs": "<what you observed in the image>"
    }}
  ],
  "medical_flags": {{
    "active_bleeding": <true|false>,
    "severe_bleeding": <true|false>,
    "burn_injuries": <true|false>,
    "suspected_fractures": <true|false>,
    "head_trauma": <true|false>,
    "spinal_injury_risk": <true|false>,
    "cardiac_event_suspected": <true|false>,
    "stroke_suspected": <true|false>,
    "airway_compromised": <true|false>,
    "shock_indicators": <true|false>,
    "loss_of_consciousness": <true|false>
  }},
  "environmental_hazards": {{
    "fire_present": <true|false>,
    "smoke_present": <true|false>,
    "chemical_hazard": <true|false>,
    "structural_instability": <true|false>,
    "traffic_hazard": <true|false>,
    "weapon_present": <true|false>
  }},
  "scene_description": "<2-3 sentence detailed visual description of exactly what is visible>",
  "immediate_actions": ["<highest priority action>", "<second priority>"],
  "do_not_actions": ["<dangerous action to avoid>"],
  "first_aid_steps": ["<step 1>", "<step 2>"],
  "dispatcher_report": "<Complete script to read verbatim to the 108 dispatcher>",
  "hospital_recommendation": "<trauma_center|emergency_room|urgent_care|none>",
  "eta_urgency": "<immediate_108|within_minutes|within_hour|non_urgent>",
  "confidence_score": <float 0.0-1.0>,
  "reasoning": "<2-3 sentence chain-of-thought explaining the assessment>"
}}

Urgency score guide:
- 90-100: Cardiac arrest, severe hemorrhage, multiple victims, airway obstruction → CALL 108 NOW
- 70-89 : Major trauma, serious accident, severe burns, altered consciousness
- 50-69 : Significant injury, moderate bleeding, possible fractures, chest pain
- 30-49 : Minor injury needing medical attention, not immediately life-threatening
- 10-29 : Minor wounds / sprains → urgent care appropriate
- 0-9   : Normal scene — no emergency

IMPORTANT: Your entire response must be ONLY the JSON object. Start immediately with {{ and end with }}. No other text."""


def analyze_image_with_llm(image_bytes: bytes, rekognition_data: dict) -> dict:
    """
    Main function. Sends the raw image + Rekognition context to Bedrock
    and returns a comprehensive triage JSON dict.
    """
    image_bytes, img_format = _normalize_image(image_bytes)
    rekognition_summary     = _build_rekognition_summary(rekognition_data)
    prompt_text             = TRIAGE_PROMPT_TEMPLATE.format(
        rekognition_summary=rekognition_summary
    )

    try:
        print(f"   -> [IAM] Invoking Amazon Nova Bedrock (region: {AWS_REGION}, model: {BEDROCK_MODEL_ID})…")
        result = _invoke_via_iam(image_bytes, img_format, prompt_text)
        
        if "detected_labels" not in result:
            result["detected_labels"] = rekognition_data.get("labels", [])
        print(f"   ✓ Bedrock analysis successful!")
        return result
    except Exception as iam_exc:
        import traceback
        print(f"   !! IAM invocation failed: {iam_exc}")
        print(f"   !! Full error: {traceback.format_exc()[:500]}")

    print(f"!!! LLM ANALYZER: Bedrock failed — using rule-based fallback")
    return _fallback_analysis(rekognition_data)


def _invoke_via_iam(image_bytes: bytes, img_format: str, prompt_text: str) -> dict:
    """Invoke Bedrock Converse via standard IAM credentials (boto3)."""
    client_kwargs = {
        "service_name": "bedrock-runtime",
        "region_name": AWS_REGION,
        "config": Config(read_timeout=3600, connect_timeout=60),
    }

    if os.getenv("AWS_ACCESS_KEY_ID"):
        client_kwargs["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID")
    if os.getenv("AWS_SECRET_ACCESS_KEY"):
        client_kwargs["aws_secret_access_key"] = os.getenv("AWS_SECRET_ACCESS_KEY")
    if os.getenv("AWS_SESSION_TOKEN"):
        client_kwargs["aws_session_token"] = os.getenv("AWS_SESSION_TOKEN")
    
    client = boto3.client(**client_kwargs)

    response = client.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "image": {
                            "format": img_format,
                            "source": {"bytes": image_bytes},
                        }
                    },
                    {"text": prompt_text},
                ],
            }
        ],
        system=[{"text": "You are a medical triage AI. Respond only with valid JSON. No markdown, no explanations, just JSON."}],
        inferenceConfig={
            "maxTokens": MAX_TOKENS,
            "temperature": 0.7,
            "topP": 0.9,
        },
        additionalModelRequestFields={
            "inferenceConfig": {
                "topK": 50,
            }
        },
    )

    raw = response["output"]["message"]["content"][0]["text"].strip()
    print(f"   📄 LLM Response (first 500 chars): {raw[:500]}...")
    return _parse_json_safely(raw)


def _normalize_image(image_bytes: bytes) -> tuple[bytes, str]:
    """
    Ensure the image is in a Bedrock-supported format (jpeg/png/webp/gif)
    and compress it to ≤ 4.5 MB.
    """
    img = Image.open(io.BytesIO(image_bytes))
    raw_format = (img.format or "JPEG").lower()
    allowed    = {"jpeg", "jpg", "png", "webp", "gif"}

    if raw_format not in allowed or len(image_bytes) > 4_500_000:
        if img.mode != "RGB":
            img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=82)
        image_bytes = buf.getvalue()
        raw_format  = "jpeg"

    bedrock_format = "jpeg" if raw_format == "jpg" else raw_format
    return image_bytes, bedrock_format


def _build_rekognition_summary(data: dict) -> str:
    """Build a human-readable summary of all Rekognition findings."""
    parts = []

    labels = data.get("labels", [])
    if labels:
        label_lines = [
            f"  • {l['name']} ({l['confidence']:.1f}%)"
            + (f" [parents: {', '.join(l.get('parents', []))}]" if l.get("parents") else "")
            for l in labels
        ]
        parts.append("Detected labels:\n" + "\n".join(label_lines))

    faces = data.get("faces", [])
    if faces:
        face_lines = []
        for i, f in enumerate(faces, 1):
            age  = f.get("age_range", {})
            emos = sorted(f.get("emotions", []), key=lambda e: -e["confidence"])
            top_emo = emos[0]["type"] if emos else "unknown"
            face_lines.append(
                f"  Face {i}: age {age.get('low','?')}-{age.get('high','?')}, "
                f"top emotion: {top_emo} ({emos[0]['confidence']:.1f}%)" if emos
                else f"  Face {i}: age {age.get('low','?')}-{age.get('high','?')}"
            )
        parts.append("Detected faces:\n" + "\n".join(face_lines))

    moderation = data.get("moderation_labels", [])
    if moderation:
        mod_lines = [f"  • {m['name']} ({m['confidence']:.1f}%)" for m in moderation]
        parts.append("Content moderation flags:\n" + "\n".join(mod_lines))

    texts = data.get("detected_text", [])
    if texts:
        parts.append("Text visible in image: " + " | ".join(texts[:8]))

    return "\n\n".join(parts) if parts else "No additional Rekognition data available."


_CRITICAL_KEYWORDS = {
    "blood", "bleeding", "hemorrhage", "wound", "laceration",
    "cardiac arrest", "heart attack", "unconscious", "not breathing",
    "fracture", "broken bone", "head trauma", "spinal",
    "fire", "smoke", "explosion", "weapon", "gun", "knife",
    "crash", "collision", "accident",
}
_URGENT_KEYWORDS = {
    "injury", "fall", "fallen", "ambulance", "emergency",
    "burn", "overdose", "seizure", "stroke",
}


def _fallback_analysis(rekognition_data: dict) -> dict:
    """Rule-based triage when the LLM call fails."""
    labels = [l["name"].lower() for l in rekognition_data.get("labels", [])]
    mod    = [m["name"].lower() for m in rekognition_data.get("moderation_labels", [])]
    all_tokens = labels + mod

    matched_critical = [k for k in _CRITICAL_KEYWORDS if any(k in t for t in all_tokens)]
    matched_urgent   = [k for k in _URGENT_KEYWORDS   if any(k in t for t in all_tokens)]

    if matched_critical:
        level, score, ambulance = "critical", 85, True
        reason = f"Critical keyword(s) detected: {', '.join(matched_critical)}"
    elif matched_urgent:
        level, score, ambulance = "urgent", 60, True
        reason = f"Urgent keyword(s) detected: {', '.join(matched_urgent)}"
    else:
        level, score, ambulance = "none", 5, False
        reason = "No emergency indicators found in fallback rule check."

    return {
        "emergency_level": level,
        "urgency_score": score,
        "call_ambulance": ambulance,
        "call_police": False,
        "call_fire_department": False,
        "time_critical": score >= 80,
        "scene_type": "other" if score > 9 else "normal",
        "patient_status": {
            "estimated_victims": 0,
            "consciousness_level": "normal",
            "breathing_status": "normal",
            "injury_severity": level if level != "none" else "none",
        },
        "detected_injuries": [],
        "medical_flags": {k: False for k in [
            "active_bleeding", "severe_bleeding", "burn_injuries",
            "suspected_fractures", "head_trauma", "spinal_injury_risk",
            "cardiac_event_suspected", "stroke_suspected",
            "airway_compromised", "shock_indicators", "loss_of_consciousness",
        ]},
        "environmental_hazards": {k: False for k in [
            "fire_present", "smoke_present", "chemical_hazard",
            "structural_instability", "traffic_hazard", "weapon_present",
        ]},
        "scene_description": "Fallback analysis — LLM unavailable.",
        "immediate_actions": ["Call 108 if unsure"] if ambulance else ["Monitor the situation"],
        "do_not_actions": [],
        "first_aid_steps": [],
        "dispatcher_report": reason,
        "hospital_recommendation": "emergency_room" if ambulance else "none",
        "eta_urgency": "immediate_108" if ambulance else "non_urgent",
        "confidence_score": 0.4,
        "reasoning": reason,
        "detected_labels": [l["name"] for l in rekognition_data.get("labels", [])],
    }


def _parse_json_safely(text: str) -> dict:
    """Strip markdown fences and parse JSON; degrade gracefully on failure."""
    original_text = text
    text = text.strip()

    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    if not text.startswith("{"):
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            text = text[start_idx:end_idx+1]
    
    try:
        parsed = json.loads(text)
        print(f"   ✓ Successfully parsed JSON response")
        return parsed
    except json.JSONDecodeError as e:
        print(f"   ⚠️  JSON parse failed: {e}")
        print(f"   ⚠️  Attempted to parse: {text[:300]}...")

        text_lower = original_text.lower()

        critical_keywords = ["critical", "severe", "bleeding", "fracture", "injury", "trauma", "wound"]
        urgent_keywords = ["urgent", "immediate", "ambulance", "108"]

        has_critical = any(kw in text_lower for kw in critical_keywords)
        has_urgent = any(kw in text_lower for kw in urgent_keywords)

        if has_critical or has_urgent:
            level = "urgent" if has_urgent or has_critical else "moderate"
            score = 75 if has_critical else 60
        else:
            level = "low"
            score = 20
        
        return {
            "emergency_level": level,
            "urgency_score": score,
            "call_ambulance": has_critical,
            "call_police": False,
            "call_fire_department": False,
            "time_critical": has_critical,
            "scene_type": "medical_emergency" if has_critical else "other",
            "patient_status": {
                "estimated_victims": 1,
                "consciousness_level": "normal",
                "breathing_status": "normal",
                "injury_severity": "serious" if has_critical else "moderate"
            },
            "detected_injuries": [],
            "medical_flags": {
                "active_bleeding": "bleed" in text_lower,
                "severe_bleeding": False,
                "burn_injuries": "burn" in text_lower,
                "suspected_fractures": "fracture" in text_lower,
                "head_trauma": "head" in text_lower,
                "spinal_injury_risk": False,
                "cardiac_event_suspected": False,
                "stroke_suspected": False,
                "airway_compromised": False,
                "shock_indicators": False,
                "loss_of_consciousness": False
            },
            "environmental_hazards": {
                "fire_present": False,
                "smoke_present": False,
                "chemical_hazard": False,
                "structural_instability": False,
                "traffic_hazard": False,
                "weapon_present": False
            },
            "scene_description": original_text[:200],
            "immediate_actions": ["Assess the situation", "Call for medical help if needed"],
            "do_not_actions": ["Do not move the patient unnecessarily"],
            "first_aid_steps": ["Check for consciousness", "Check breathing"],
            "dispatcher_report": f"Medical emergency reported. {original_text[:100]}",
            "hospital_recommendation": "emergency_room" if has_critical else "urgent_care",
            "eta_urgency": "within_minutes" if has_critical else "within_hour",
            "confidence_score": 0.3,
            "reasoning": f"Fallback parsing due to invalid JSON. Detected keywords suggest {level} priority."
        }


def analyze_with_llm(labels: list[str], prompt_template: str) -> dict:
    """
    Backward-compatible wrapper used by any code that still calls the old API.
    Delegates to _fallback_analysis since no image bytes are available.
    """
    _ = prompt_template
    rekognition_data = {"labels": [{"name": l, "confidence": 80.0} for l in labels]}
    return _fallback_analysis(rekognition_data)
