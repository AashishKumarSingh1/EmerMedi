import sys
import os

# 1. Dynamically find the parent folder (ML) and add it to Python's path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)
import json
from LLM_brain.llm import llm

def generate_transcript(patient_data: dict) -> dict:
    """
    Generates two distinct Text-to-Speech (TTS) ready transcripts based on patient and location data.
    
    EXPECTED INPUT JSON FROM BACKEND (patient_data parameter):
    {
        "patient_info": {"name": "John Doe", "age": 45, "gender": "Male"},
        "current_incident": {
            "chief_complaint": "Severe chest pain radiating to left arm",
            "vitals": {"bp": "160/95", "heart_rate": 115, "spo2": 94},
            "severity": "Critical"
        },
        "medical_history": {
            "known_conditions": ["Hypertension", "Type 2 Diabetes"],
            "allergies": ["Penicillin"]
        },
        "logistics": {
            "incident_location": "Gandhi Maidan, near Gate 4",
            "ambulance_current_location": "Patna Medical College Hospital (PMCH)",
            "region": "Patna, Bihar", 
            "preferred_local_language": "Hindi"
        }
    }
    """
    
    prompt_text = """
    You are an Expert Emergency Medical Dispatch Communicator. 
    Your task is to take the provided JSON data and write three distinct, spoken-word transcripts meant to be read aloud by a Text-to-Speech (TTS) system.

    REQUIREMENTS FOR AMBULANCE TRANSCRIPT:
    - Target Audience: Paramedics/EMTs in the ambulance.
    - Style: Urgent and action-oriented. 
    - Content MUST include: Start with clear routing instructions from their 'ambulance_current_location' to the 'incident_location'. Follow with immediate life threats, vitals, and critical hazards.
    - Language: English. Keep medical terms simple and easily understandable.

    REQUIREMENTS FOR DOCTOR TRANSCRIPT:
    - Target Audience: Emergency Room Physicians preparing for patient arrival.
    - Style: Highly clinical, structured, and professional SBAR format (Situation, Background, Assessment, Recommendation).
    - Content MUST include: Mention the 'incident_location' so the trauma team understands the scene context (e.g., highway vs residential).
    - Language: English (Standard Medical English).

    REQUIREMENTS FOR BYSTANDER / CALLER TRANSCRIPT:
    - Target Audience: The panicked caller or bystander currently with the patient.
    - Style: Calm, reassuring, and highly instructive.
    - Content MUST include: Start by reassuring them that the ambulance is on the way to their location. Then, provide 2 to 3 simple, step-by-step immediate first-aid actions based on the patient's specific 'chief_complaint' (e.g., "apply direct pressure to the wound," "keep them seated upright," or "do not move their neck"). 
    - Language: Plain, non-medical English. Speak in short, easy-to-follow sentences.

    Extract and return ONLY a valid JSON object with this exact schema:
    {
      "ambulance_audio_script": {
        "language": "English",
        "transcript": "The full text meant for the ambulance TTS..."
      },
      "doctor_audio_script": {
        "language": "English",
        "transcript": "The full clinical SBAR text meant for the hospital TTS..."
      },
      "bystander_audio_script": {
        "language": "English",
        "transcript": "The reassuring, step-by-step first aid text meant for the caller on the phone..."
      }
    }
    
    CRITICAL: 
    - Write the transcripts exactly as they should be spoken (e.g., expand abbreviations if necessary for TTS).
    - Respond ONLY with the raw JSON object. No markdown, no conversational filler.
    """

    # Call the robust LLM module
    result = llm(prompt_text=prompt_text, context_data=patient_data)
    
    return result

# --- Quick Test ---
if __name__ == "__main__":
    sample_backend_data = {
        "patient_info": {"name": "Unknown Male", "age": "approx 50", "gender": "Male"},
        "current_incident": {
            "chief_complaint": "Unconscious after blunt force trauma to the head in a traffic accident.",
            "vitals": {"bp": "90/60", "heart_rate": 130, "spo2": 88},
            "severity": "Critical"
        },
        "medical_history": {
            "known_conditions": [],
            "allergies": ["Unknown"]
        },
        "logistics": {
            "incident_location": "Bypass Road, near zero mile",
            "ambulance_current_location": "Kankarbagh Station",
            "region": "Patna, Bihar", 
            "preferred_local_language": "Hindi"
        }
    }
    
    print("Generating location-aware dual-role transcripts...\n")
    transcripts = generate_transcript(sample_backend_data)
    print(json.dumps(transcripts, indent=2, ensure_ascii=False))