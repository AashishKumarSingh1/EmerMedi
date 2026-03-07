import requests
import json
import os
import sys

# --- CONFIGURATION ---
# Ensure your Flask app is running on this port and the Blueprint is registered
URL = "http://127.0.0.1:5000/generate-transcript"

# This looks for the JSON file in the same folder as this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(SCRIPT_DIR, "test.json")

def test_transcript_generator():
    print("\n" + "="*50)
    print("🎙️ EMERMEDI: TRANSCRIPT GENERATOR API TEST")
    print("="*50)

    # 1. Check if the JSON file exists, if not, create a sample one
    if not os.path.exists(JSON_FILE):
        print(f"⚠️  File not found: {os.path.basename(JSON_FILE)}")
        print("📝 Creating a sample patient JSON for testing...")
        sample_data = {
            "patient_info": {"name": "Unknown Male", "age": 45, "gender": "Male"},
            "current_incident": {
                "chief_complaint": "Severe chest pain, suspected myocardial infarction",
                "vitals": {"bp": "160/95", "heart_rate": 115, "spo2": 92},
                "severity": "Critical"
            },
            "medical_history": {
                "known_conditions": ["Hypertension"],
                "allergies": ["Aspirin"]
            },
            "logistics": {
                "incident_location": "Gandhi Maidan, near Gate 4",
                "ambulance_current_location": "Patna Junction",
                "region": "Patna, Bihar", 
                "preferred_local_language": "Hindi"
            }
        }
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, indent=4)
        print(f"✅ Created: {os.path.basename(JSON_FILE)}")

    # 2. Load the JSON data
    try:
        print(f"📖 Reading input: {os.path.basename(JSON_FILE)}")
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            payload = json.load(f)
    except UnicodeDecodeError:
        print("❌ ERROR: Encoding mismatch. Ensure the file is saved as UTF-8.")
        return
    except json.JSONDecodeError:
        print("❌ ERROR: The file is not a valid JSON. Check for missing commas or brackets.")
        return
    except Exception as e:
        print(f"❌ ERROR: Could not read file: {e}")
        return

    # 3. Send the POST request to the Flask Server
    print(f"📡 Sending request to: {URL}...")
    try:
        response = requests.post(URL, json=payload, timeout=45) # Longer timeout for LLM generation
        
        # 4. Process the Response
        if response.status_code == 200:
            result = response.json()
            print("\n" + "✅" + " SUCCESS: Transcripts Generated " + "✅")
            print("-" * 50)
            
            # Navigate the JSON structure based on the Blueprint output
            data_block = result.get('data', {})
            ambulance_script = data_block.get('ambulance_audio_script', {})
            doctor_script = data_block.get('doctor_audio_script', {})

            if ambulance_script and doctor_script:
                print(f"🚑 AMBULANCE SCRIPT (Language: {ambulance_script.get('language', 'N/A')}):")
                print(f"   \"{ambulance_script.get('transcript', 'No transcript found')}\"\n")
                
                print(f"🏥 DOCTOR SBAR SCRIPT (Language: {doctor_script.get('language', 'N/A')}):")
                print(f"   \"{doctor_script.get('transcript', 'No transcript found')}\"\n")
            else:
                print("⚠️  The API returned success, but the transcripts were missing.")
                print("Full Response:", json.dumps(result, indent=2, ensure_ascii=False))

        else:
            print(f"❌ API ERROR: Server returned Status Code {response.status_code}")
            try:
                print(f"Response Body: {json.dumps(response.json(), indent=2)}")
            except:
                print(f"Response Body: {response.text}")

    except requests.exceptions.ConnectionError:
        print("\n❌ CONNECTION ERROR: Could not reach the Flask server.")
        print("👉 Make sure your Flask app is running at http://127.0.0.1:5000")
    except requests.exceptions.Timeout:
        print("\n❌ TIMEOUT ERROR: The LLM took too long to respond. Try increasing the timeout.")
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")

    print("="*50)
    print("🏁 TEST ENDED")
    print("="*50 + "\n")

if __name__ == "__main__":
    test_transcript_generator()