from flask import Blueprint, request, jsonify
# Import the logic functions from their respective modules
from Preprocesser.preprocess_input_json import preprocess_data
from Preprocesser.hospital_finder import hospital_finder
from Preprocesser.generate_transcript import generate_transcript
from Preprocesser.generate_epcr import generate_comprehensive_epcr
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

@hospital_bp.route('/generate-epcr', methods=['POST'])
def generate_epcr_route():
    try:
        final_incident_data = request.get_json()
        if not final_incident_data:
            return jsonify({"error": "No end-of-call data provided"}), 400
            
        print("Data received in /generate-epcr route")
        
        # Generate the comprehensive JSON structured for PDF creation
        epcr_data = generate_comprehensive_epcr(final_incident_data)

        # Check if the LLM module returned an error dictionary
        if "error" in epcr_data:
            return jsonify({
                "status": "error",
                "message": epcr_data["error"],
                "details": epcr_data.get("details", "")
            }), 502 # 502 Bad Gateway (upstream LLM error)

        # Return the structured data. 
        # Your frontend or PDF generator can now map these keys to a document!
        return jsonify({
            "status": "success",
            "message": "ePCR data successfully structured and ready for PDF generation.",
            "data": epcr_data
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500