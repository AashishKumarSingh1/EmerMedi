
import sys
import os


current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)


from LLM_brain.llm import llm

def hospital_finder(triage_json_data: dict):
    """
    Takes the raw Triage JSON, simplifies it using the preprocessor,
    and asks the LLM to recommend the top 5 most suitable hospital types/names.
    """
    print("data receiver in hf")
    
    # 2. Define the prompt for hospital selection
    # IMPORTANT: We pass a candidate list from Google Places (or a static stub).
    # The model MUST select only from that list so we return real place_id + lat/lng.
    prompt = """
    You are a Strategic Medical Dispatcher.

    You are given:
    - extracted_features: a structured clinical + logistics summary
    - candidate_hospitals: a list of real nearby hospitals with place_id, address, and lat/lng
    - origin: the incident coordinates (may be null)

    TASK:
    1) Choose the top up to 5 best hospitals from candidate_hospitals for this patient.
    2) You MUST ONLY pick hospitals that appear in candidate_hospitals.
       - Do NOT invent hospital names.
       - facility_name MUST exactly match the candidate's name.
       - place_id, address, and location MUST be copied from the candidate.

    Return ONLY a JSON object with a 'recommended_hospitals' array (0 to 5 items).
    Each item must follow this schema:
    {
      "facility_name": "string (exact match from candidate)",
      "place_id": "string (from candidate)",
      "address": "string (from candidate)",
      "location": { "lat": number, "lng": number },
      "category": "Standardized Category (e.g., TRAUMA_CENTER | CARDIAC_CENTER | GENERAL_HOSPITAL)",
      "suitability_score": 0-100,
      "priority_level": "CRITICAL | HIGH | MEDIUM",
      "required_capabilities": ["ICU", "Blood Bank"],
      "justification": "Clinical reasoning for this selection",
      "dispatch_notes": "Logistical notes (keep short)",
      "handover_dept": "Which specific hospital department should be alerted"
    }

    CRITICAL:
    - If candidate_hospitals is empty, return {"recommended_hospitals": []}.
    """
    
    # 3. Call your modular LLM function
    # It sends the task (prompt) and the context (simplified_data)
    result = llm(prompt, triage_json_data)
    
    return result


# =====================================================================
# TEST BLOCK: Demonstrating the API Input & Output for the Backend Team
# =====================================================================
if __name__ == "__main__":
    print("\n" + "="*50)
    print("🏥 TESTING HOSPITAL FINDER API FOR BACKEND INTEGRATION")
    print("="*50)

    # 1. Mock Input: What the frontend/triage system will send to this function
    mock_incoming_triage_data = {
        "incident_id": "EMERG-9942",
        "emergency_type": "MEDICAL",
        "patient_status": "CRITICAL",
        "detected_symptoms":["Severe chest pain", "Shortness of breath", "Left arm numbness"],
        "vitals_estimated": {"heart_rate": "130 bpm", "condition": "diaphoretic"},
        "location": "Downtown Business District",
        "emotion_detected": "Highly Distressed/Panicked"
    }

    print("\n[INPUT] Data received from Triage/Preprocessor:")
    print(json.dumps(mock_incoming_triage_data, indent=2))
    
    print("\n[PROCESSING] LLM is determining the best facilities (Please wait...)...\n")

    try:
        # 2. Call the API function
        api_response = hospital_finder(mock_incoming_triage_data)
        
        # 3. Display the exact JSON Output for the backend team
        print("\n" + "="*50)
        print("✅ [FINAL API OUTPUT] Backend will receive this exact JSON:")
        print("="*50)
        print(json.dumps(api_response, indent=4))
        
    except Exception as e:
        print(f"\n❌ [ERROR] LLM Call Failed: {e}")
        print("\n[FALLBACK MOCK OUTPUT] If successful, the backend receives this structure:")
        
        # Fallback dummy data just so the backend team can see the schema even if the API key fails during the test
        dummy_backend_response = {
            "recommended_hospitals":[
                {
                    "facility_name": "City General Cardiology Center",
                    "category": "CARDIAC_CENTER",
                    "suitability_score": 98,
                    "priority_level": "CRITICAL",
                    "required_capabilities": ["Cardiac Cath Lab", "Cardiac ICU", "24/7 Cardiologist"],
                    "justification": "Symptoms heavily indicate an acute myocardial infarction (heart attack) requiring immediate catheterization.",
                    "dispatch_notes": "Use sirens, notify hospital for Code STEMI activation prior to arrival.",
                    "eta_impact": "Closest facility with an active Cath Lab. Traffic is heavy; use bus lanes.",
                    "handover_dept": "Emergency Resuscitation Bay / Cardiology Team"
                }
            ]
        }
        print(json.dumps(dummy_backend_response, indent=4))