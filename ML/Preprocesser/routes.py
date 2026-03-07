from flask import Blueprint, request, jsonify
# Import the logic functions from their respective modules
from Preprocesser.preprocess_input_json import preprocess_data
from Preprocesser.hospital_finder import hospital_finder
from Preprocesser.generate_transcript import generate_transcript
hospital_bp = Blueprint('hospital_bp', __name__)

@hospital_bp.route('/find-hospitals', methods=['POST'])
def find_hospitals_route():
    try:
        triage_data = request.get_json()
        if not triage_data:
            return jsonify({"error": "No triage data provided"}), 400
        print("data receiver in routes")
        # Step 1: Extract/Scrape features using the preprocessing module
        features = preprocess_data(triage_data)
        
        # Step 2: Find best hospitals using the finder module
        recommendations = hospital_finder(features)

        return jsonify({
            "status": "success",
            "extracted_features": features,
            "hospital_list": recommendations
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@hospital_bp.route('/generate-transcript', methods=['POST'])
def generate_transcript_route():
    try:
        patient_data = request.get_json()
        if not patient_data:
            return jsonify({"error": "No patient data provided"}), 400
            
        print("Data received in /generate-transcript route")
        
        # Generate the dual-role audio scripts using our LLM module
        transcripts = generate_transcript(patient_data)

        # Check if the LLM module returned an error dictionary
        if "error" in transcripts:
            return jsonify({
                "status": "error",
                "message": transcripts["error"],
                "details": transcripts.get("details", "")
            }), 502 # 502 Bad Gateway (upstream LLM error)

        return jsonify({
            "status": "success",
            "data": transcripts
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500