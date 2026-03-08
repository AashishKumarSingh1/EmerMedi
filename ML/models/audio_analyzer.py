import boto3
from botocore.config import Config
import json
import os
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID_VOICE", "us.amazon.nova-sonic-v1:0")
MAX_TOKENS = 2048

AUDIO_TRIAGE_PROMPT = """You are a highly specialized AI emergency audio triage system for emergency response. Your analysis may trigger a live 108 emergency call. Be precise, thorough, and conservative.

Analyze the audio for emergency indicators:
1. Emergency keywords (help, emergency, accident, fire, police, ambulance, hurt, pain, bleeding, etc.)
2. Distress indicators in voice tone and speech patterns
3. Urgency level based on content and vocal stress
4. Type of emergency mentioned
5. Background sounds (sirens, crashes, screams, alarms)

CRITICAL: Respond with ONLY valid JSON. No explanatory text before or after. No markdown code blocks. Start with {{ and end with }}.

Return this exact JSON schema:

{{
  "emergency_level": "<critical|urgent|moderate|low|none>",
  "urgency_score": <integer 0-100>,
  "call_ambulance": <true|false>,
  "call_police": <true|false>,
  "call_fire_department": <true|false>,
  "time_critical": <true|false>,
  "audio_type": "<distress_call|panic_voice|pain_sounds|accident_sounds|fire_alarm|normal_conversation|background_noise|unclear|other>",
  "detected_emotions": ["<fear|panic|pain|distress|anger|calm|neutral>"],
  "voice_analysis": {{
    "stress_level": "<high|moderate|low|none>",
    "pain_indicators": <true|false>,
    "panic_detected": <true|false>,
    "breathing_distress": <true|false>,
    "coherence": "<coherent|confused|incoherent|unclear>"
  }},
  "background_sounds": {{
    "sirens": <true|false>,
    "crash_impact": <true|false>,
    "breaking_glass": <true|false>,
    "fire_alarm": <true|false>,
    "screaming": <true|false>,
    "traffic_noise": <true|false>,
    "medical_equipment": <true|false>
  }},
  "spoken_content": {{
    "emergency_keywords": ["<list of emergency-related words heard>"],
    "location_mentioned": "<any location info or 'unknown'>",
    "injury_description": "<what injuries/symptoms were mentioned or 'none'>",
    "help_requested": <true|false>,
    "transcription": "<what was said in the audio>"
  }},
  "scene_assessment": "<2-3 sentence description of what the audio suggests is happening>",
  "immediate_actions": ["<highest priority action>", "<second priority>"],
  "dispatcher_report": "<Complete script to read verbatim to the 108 dispatcher>",
  "hospital_recommendation": "<trauma_center|emergency_room|urgent_care|none>",
  "eta_urgency": "<immediate_108|within_minutes|within_hour|non_urgent>",
  "confidence_score": <float 0.0-1.0>,
  "reasoning": "<2-3 sentence explanation of the assessment>"
}}

Urgency score guide:
- 90-100: Life-threatening emergency (cardiac arrest, severe trauma, active violence)
- 70-89: Serious emergency (major injury, severe distress, accident)
- 50-69: Moderate emergency (injury, medical issue, needs immediate attention)
- 30-49: Minor emergency (needs medical attention, not immediately life-threatening)
- 10-29: Low priority (minor issue, can wait)
- 0-9: No emergency detected

IMPORTANT: Your entire response must be ONLY the JSON object. Start immediately with {{ and end with }}. No other text."""


def analyze_audio_with_nova(audio_bytes: bytes) -> dict:
    """
    Analyze audio using Amazon Bedrock Converse API with audio content blocks.
    Returns comprehensive emergency triage JSON.
    """
    try:
        audio_size_mb = len(audio_bytes) / (1024 * 1024)
        print(f"   -> [BEDROCK AUDIO] Starting audio analysis...")
        print(f"   -> Audio size: {audio_size_mb:.2f} MB")

        # Compress oversized audio to keep under Bedrock's ~25 MB payload limit
        audio_bytes, audio_format = _compress_audio_if_needed(audio_bytes)
        print(f"   -> [BEDROCK AUDIO] Sending format: {audio_format} ({len(audio_bytes)/(1024*1024):.2f} MB)")

        # Increased timeouts + adaptive retries to handle large-file SSL drops
        boto_config = Config(
            read_timeout=300,
            connect_timeout=60,
            retries={
                'max_attempts': 5,
                'mode': 'adaptive'
            }
        )

        # Initialize Bedrock client
        client_kwargs = {
            "service_name": "bedrock-runtime",
            "region_name": AWS_REGION,
            "config": boto_config,
        }

        if os.getenv("AWS_ACCESS_KEY_ID"):
            client_kwargs["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID")
        if os.getenv("AWS_SECRET_ACCESS_KEY"):
            client_kwargs["aws_secret_access_key"] = os.getenv("AWS_SECRET_ACCESS_KEY")
        if os.getenv("AWS_SESSION_TOKEN"):
            client_kwargs["aws_session_token"] = os.getenv("AWS_SESSION_TOKEN")
        
        client = boto3.client(**client_kwargs)

        print(f"   -> [BEDROCK AUDIO] Invoking model: {BEDROCK_MODEL_ID}")
        
        # Use Converse API with audio content block
        response = client.converse(
            modelId=BEDROCK_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "audio": {
                                "format": audio_format,
                                "source": {
                                    "bytes": audio_bytes
                                }
                            }
                        },
                        {
                            "text": AUDIO_TRIAGE_PROMPT
                        }
                    ]
                }
            ],
            system=[
                {
                    "text": "You are an emergency audio triage AI. Analyze the audio and respond only with valid JSON. No markdown, no explanations, just JSON."
                }
            ],
            inferenceConfig={
                "maxTokens": MAX_TOKENS,
                "temperature": 0.7,
                "topP": 0.9
            }
        )
        
        # Extract text from Converse response
        raw = response['output']['message']['content'][0]['text'].strip()
        
        print(f"   Raw response (first 500 chars): {raw[:500]}...")
        
        # Parse JSON response
        result = _parse_json_safely(raw)
        print(f"   Bedrock audio analysis successful!")
        return result
        
    except Exception as e:
        import traceback
        print(f"   !! Audio analysis failed: {e}")
        print(f"   !! Full error: {traceback.format_exc()[:500]}")
        print(f"!!! AUDIO ANALYZER: Using fallback")
        return _fallback_audio_analysis(str(e))


def _detect_audio_format(audio_bytes: bytes) -> str:
    """Detect audio format from magic bytes. Defaults to wav."""
    if audio_bytes[:4] == b'RIFF':
        return "wav"
    elif audio_bytes[:3] == b'ID3' or audio_bytes[:2] == b'\xff\xfb':
        return "mp3"
    elif audio_bytes[:4] == b'OggS':
        return "ogg"
    elif audio_bytes[:4] == b'fLaC':
        return "flac"
    elif audio_bytes[:4] == b'\x1a\x45\xdf\xa3':
        return "webm"
    return "wav"


def _compress_audio_if_needed(audio_bytes: bytes, limit_mb: float = 20.0) -> tuple:
    """
    If audio exceeds limit_mb, compress to MP3 at 64 kbps using pydub.
    Returns (audio_bytes, format_string).
    """
    import io
    detected_format = _detect_audio_format(audio_bytes)
    size_mb = len(audio_bytes) / (1024 * 1024)

    if size_mb <= limit_mb:
        return audio_bytes, detected_format

    print(f"   -> [COMPRESS] Audio is {size_mb:.2f} MB — compressing to MP3 64k to stay under {limit_mb} MB limit")
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
        out_f = io.BytesIO()
        audio.export(out_f, format="mp3", bitrate="64k")
        compressed = out_f.getvalue()
        print(f"   -> [COMPRESS] Compressed: {size_mb:.2f} MB -> {len(compressed)/(1024*1024):.2f} MB")
        return compressed, "mp3"
    except Exception as e:
        print(f"   -> [COMPRESS] Compression failed ({e}), sending original")
        return audio_bytes, detected_format


def _parse_json_safely(text: str) -> dict:
    """Strip markdown fences and parse JSON; degrade gracefully on failure."""
    original_text = text
    text = text.strip()

    # Remove markdown code blocks
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    # Find JSON object
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
        
        # Try to extract emergency indicators from text
        text_lower = original_text.lower()
        
        critical_keywords = ["critical", "severe", "emergency", "help", "accident", "bleeding", "pain", "injury"]
        urgent_keywords = ["urgent", "immediate", "ambulance", "108", "distress", "panic"]
        
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
            "audio_type": "unclear",
            "detected_emotions": ["distress" if has_critical else "neutral"],
            "voice_analysis": {
                "stress_level": "high" if has_critical else "moderate",
                "pain_indicators": "pain" in text_lower,
                "panic_detected": "panic" in text_lower,
                "breathing_distress": False,
                "coherence": "unclear"
            },
            "background_sounds": {
                "sirens": "siren" in text_lower,
                "crash_impact": "crash" in text_lower,
                "breaking_glass": False,
                "fire_alarm": "fire" in text_lower or "alarm" in text_lower,
                "screaming": "scream" in text_lower,
                "traffic_noise": False,
                "medical_equipment": False
            },
            "spoken_content": {
                "emergency_keywords": [kw for kw in critical_keywords + urgent_keywords if kw in text_lower],
                "location_mentioned": "unknown",
                "injury_description": "unclear",
                "help_requested": "help" in text_lower,
                "transcription": original_text[:200]
            },
            "scene_assessment": f"Audio analysis with partial data: {original_text[:100]}",
            "immediate_actions": ["Assess the situation", "Call for help if needed"],
            "dispatcher_report": f"Emergency audio received. {original_text[:100]}",
            "hospital_recommendation": "emergency_room" if has_critical else "urgent_care",
            "eta_urgency": "within_minutes" if has_critical else "within_hour",
            "confidence_score": 0.4,
            "reasoning": f"Fallback parsing due to invalid JSON. Detected keywords suggest {level} priority."
        }


def _fallback_audio_analysis(reason: str = "System unavailable") -> dict:
    """Fallback analysis when processing fails."""
    return {
        "emergency_level": "moderate",
        "urgency_score": 50,
        "call_ambulance": False,
        "call_police": False,
        "call_fire_department": False,
        "time_critical": False,
        "audio_type": "unclear",
        "detected_emotions": ["neutral"],
        "voice_analysis": {
            "stress_level": "moderate",
            "pain_indicators": False,
            "panic_detected": False,
            "breathing_distress": False,
            "coherence": "unclear"
        },
        "background_sounds": {
            "sirens": False,
            "crash_impact": False,
            "breaking_glass": False,
            "fire_alarm": False,
            "screaming": False,
            "traffic_noise": False,
            "medical_equipment": False
        },
        "spoken_content": {
            "emergency_keywords": [],
            "location_mentioned": "unknown",
            "injury_description": "none",
            "help_requested": False,
            "transcription": ""
        },
        "scene_assessment": f"Audio analysis unavailable: {reason}",
        "immediate_actions": ["Verify the situation", "Ask if assistance is needed"],
        "dispatcher_report": f"Audio analysis system issue: {reason}. Manual assessment required.",
        "hospital_recommendation": "none",
        "eta_urgency": "non_urgent",
        "confidence_score": 0.3,
        "reasoning": f"Fallback analysis due to: {reason}"
    }
