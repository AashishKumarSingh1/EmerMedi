import json
import os
from datetime import datetime
from LLM_brain.llm import llm

def preprocess_data(json_input: dict):
    """
    Enhanced Sorter: Prepares a complete 'Pre-Arrival Notification' for the hospital.
    Includes Medical, Logistical (GPS/Traffic), and Scene data.
    """
    print("data receiver in preprocesss data")
    prompt = """
    You are an Emergency Medical Dispatcher. Your task is to scrape the provided incident data 
    and format a "Pre-Arrival Notification" for the receiving Hospital. 
    
    Extract and return a JSON object with these specific sections:
    1. 'clinical_summary': 
       - severity_level (Critical/Urgent/Stable)
       - patient_condition (Primary injury/complaint)
       - suspected_injuries (List of specific trauma)
       - consciousness_level
    2. 'logistics':
       - coordinates (Latitude/Longitude if present in data, otherwise null)
       - traffic_conditions (If mentioned, e.g., heavy/clear)
       - scene_type (e.g., Highway, Residential, Industrial)
       - estimated_arrival_urgency (Immediate/Standard)
    3. 'hospital_requirements':
       - required_facility_type (e.g., Level 1 Trauma, Cardiac Center)
       - equipment_needed (e.g., Ventilator, Blood Bank, CT Scan, Operating Room)
       - specialist_ready (e.g., Neurosurgeon, Cardiologist)
    4. 'environmental_hazards':
       - fire_smoke_presence (boolean)
       - chemical_biological_risk (boolean)
    
    CRITICAL: 
    - If a field is not present in the input data, set it to null. 
    - Do NOT hallucinate data. 
    - Return ONLY valid JSON.
    """

    # 1. Call LLM
    handover_data = llm(prompt, json_input)

    # 2. Save the data to logs (using the helper logic)
    _save_to_logs(handover_data, "hospital_handover")

    return handover_data

def _save_to_logs(data, prefix):
    """Helper to ensure data is saved locally for auditing."""
    try:
        log_folder = "scraped_data_logs"
        if not os.path.exists(log_folder):
            os.makedirs(log_folder)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(log_folder, f"{prefix}_{timestamp}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"✅ Handover data saved: {filepath}")
    except Exception as e:
        print(f"⚠️ Save failed: {e}")


    