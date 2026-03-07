from flask import Blueprint, request, jsonify
# Import the logic functions from their respective modules
from Preprocesser.preprocess_input_json import preprocess_data
from Preprocesser.hospital_finder import hospital_finder

hospital_bp = Blueprint('hospital_bp', __name__)

@hospital_bp.route('/find-hospitals', methods=['POST'])
def find_hospitals_route():
    try:
        triage_data = request.get_json()
        if not triage_data:
            return jsonify({"error": "No triage data provided"}), 400
        print("data receiver in routes")
        # Step 1: Extract/Scrape features using the preprocessing module
        #features = preprocess_data(triage_data)
        features = triage_data
        # Step 2: Find best hospitals using the finder module
        recommendations = hospital_finder(triage_data)

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