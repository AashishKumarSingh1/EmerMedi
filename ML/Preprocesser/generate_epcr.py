import sys
import os
import json

# Ensure Python can find the LLM_brain folder
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from LLM_brain.llm import llm

def generate_comprehensive_epcr(final_incident_data: dict) -> dict:
    """
    Generates a massive, deeply structured Electronic Patient Care Report (ePCR).
    This output is specifically designed to be easily parsed by a backend PDF generator
    to create formal medical documents with tables and narratives.
    """
    
    prompt_text = """
    You are an Expert Paramedic and Medical Documentation Specialist.
    Your task is to take the provided raw, messy end-of-call data and generate a highly detailed, comprehensive Electronic Patient Care Report (ePCR).

    REQUIREMENTS:
    - Tone: Highly professional, objective, and clinical.
    - Structure: Break the data down into strict categories so the backend can render it into a PDF.
    - Missing Data: If something is not provided (e.g., patient name is unknown), output "Unknown" or "Not Recorded". Do NOT hallucinate data.
    - Calculations: Calculate total scene time and transport time if timestamps are provided.

    Extract and return ONLY a valid JSON object with this exact schema:
    {
      "epcr_document": {
        "incident_details": {
          "incident_id": "string",
          "date": "string",
          "dispatch_reason": "string",
          "total_call_time_minutes": "integer or string"
        },
        "patient_demographics": {
          "name": "string",
          "age": "string",
          "gender": "string"
        },
        "medical_history": {
          "chief_complaint": "string",
          "past_medical_history": ["list", "of", "conditions"],
          "known_allergies": ["list", "of", "allergies"],
          "daily_medications": ["list", "of", "medications"]
        },
        "scene_assessment": {
          "initial_presentation": "Clinical description of how the patient was found",
          "mechanism_of_injury_or_illness": "string"
        },
        "vitals_flowsheet": [
          {
            "time": "string",
            "blood_pressure": "string",
            "heart_rate": "string",
            "spo2": "string",
            "respiratory_rate": "string or 'Not Recorded'"
          }
        ],
        "interventions_and_medications": [
          {
            "time": "string (estimate if missing)",
            "action_type": "Medication | Procedure",
            "description": "e.g., 'Aspirin 324mg PO' or 'IV established 18g Left AC'",
            "patient_response": "Improved, Unchanged, or Deteriorated"
          }
        ],
        "clinical_narrative": {
          "dispatch_and_scene": "Chronological paragraph of arrival and scene size-up.",
          "assessment_and_treatment": "Paragraph detailing the physical exam and interventions.",
          "transport_and_handover": "Paragraph detailing the ride to the hospital and handover."
        },
        "handover_details": {
          "receiving_facility": "string",
          "receiving_department": "string",
          "receiving_physician": "string"
        }
      }
    }
    
    CRITICAL: 
    - Respond ONLY with the raw JSON object. No markdown, no conversational filler.
    """

    print("Generating Comprehensive post-incident ePCR for PDF rendering...")
    result = llm(prompt_text=prompt_text, context_data=final_incident_data)
    
    return result

# --- Quick Test ---
if __name__ == "__main__":
    # This is the messy data the paramedics/app collected during the run
    raw_field_data = {
        "call_info": {"id": "EMER-8055", "date": "2026-03-08", "reason": "Traffic Accident - Pedestrian Struck"},
        "times": {
            "dispatched": "08:15", "arrived_scene": "08:22", "left_scene": "08:35", "arrived_hospital": "08:50"
        },
        "patient": {"name": "Amit Sharma", "age": 34, "gender": "M"},
        "history": {"allergies": "Sulfa drugs", "meds": "None", "pmh": "Asthma"},
        "scene_notes": "Pt struck by car at approx 40km/h. Found lying on road. Right leg obvious deformity. Conscious but confused.",
        "vitals_taken": [
            {"time": "08:24", "bp": "110/70", "hr": 125, "o2": 97},
            {"time": "08:40", "bp": "105/65", "hr": 130, "o2": 96}
        ],
        "treatments": [
            "08:25 - Placed C-collar and backboard",
            "08:28 - Splinted right leg",
            "08:30 - IV access right hand, started normal saline",
            "08:32 - Fentanyl 50mcg IV for pain"
        ],
        "destination": "PMCH Trauma Center, handed to Dr. Verma"
    }
    
    epcr_result = generate_comprehensive_epcr(raw_field_data)
    print("\n--- FINAL MASTER ePCR JSON ---")
    print(json.dumps(epcr_result, indent=2))