


import json
from LLM_brain.llm import llm  
from Preprocesser.preprocess_input_json import preprocess_data # Assuming the class name from previous step

def hospital_finder(triage_json_data: dict):
    """
    Takes the raw Triage JSON, simplifies it using the preprocessor,
    and asks the LLM to recommend the top 5 most suitable hospital types/names.
    """
    print("data receiver in hf")
    
    # 2. Define the prompt for hospital selection
    # Note: Since the LLM doesn't have your GPS, we ask it to find the BEST 
    # types of facilities based on the specific injuries detected.
    prompt = """
    You are a Strategic Medical Dispatcher. Based on the emergency incident data, 
    identify the top 5 most suitable medical facilities or specialized departments.

    

    Return ONLY a JSON object with a 'recommended_hospitals' array. 
    Each object must follow this backend-friendly schema:
    {
      "facility_name": "Name or Facility Type",
      "category": "Standardized Category (e.g., TRAUMA_CENTER)",
      "suitability_score": 0-100,
      "priority_level": "CRITICAL | HIGH | MEDIUM",
      "required_capabilities": ["List", "of", "needed", "services", "e.g.", "ICU", "Blood Bank"],
      "justification": "Clinical reasoning for this selection",
      "dispatch_notes": "Logistical notes (e.g., 'Use sirens, bypass Highway 4 due to traffic')",
      "eta_impact": "How location/traffic affects this choice (e.g., 'Closest but heavy traffic')",
      "handover_dept": "Which specific hospital department should be alerted"
    }
    """
    
    # 3. Call your modular LLM function
    # It sends the task (prompt) and the context (simplified_data)
    result = llm(prompt, triage_json_data)
    
    return result

