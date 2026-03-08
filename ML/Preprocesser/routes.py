from flask import Blueprint, request, jsonify
# Import the logic functions from their respective modules
from Preprocesser.preprocess_input_json import preprocess_data
from Preprocesser.hospital_finder import hospital_finder
from Preprocesser.generate_transcript import generate_transcript
from Preprocesser.generate_epcr import generate_comprehensive_epcr
from Preprocesser.get_audio_sev import get_audio_sev
from Preprocesser.update_data_from_image import update_data_from_image
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

        # If the LLM preprocessor returned an error dictionary
        if isinstance(features, dict) and "error" in features:
            return jsonify({
                "status": "error",
                "message": features["error"],
                "details": features.get("details", "")
            }), 502
        
        # Step 2: Find best hospitals using the finder module
        # We pass candidate hospitals from the frontend (Google/static) so the model can
        # pick real facilities with place_id + lat/lng instead of inventing names.
        recommendations = hospital_finder({
            "extracted_features": features,
            "candidate_hospitals": triage_data.get("candidate_hospitals", []),
            "origin": (triage_data.get("logistics", {}) or {}).get("coordinates")
        })

        if isinstance(recommendations, dict) and "error" in recommendations:
            return jsonify({
                "status": "error",
                "message": recommendations["error"],
                "details": recommendations.get("details", "")
            }), 502

        # Compatibility: ensure latitude/longitude fields exist for UI mapping.
        # We keep the canonical location: {lat, lng} and also duplicate fields.
        if isinstance(recommendations, dict):
            recs = recommendations.get("recommended_hospitals")
            if isinstance(recs, list):
                for h in recs:
                    if not isinstance(h, dict):
                        continue

                    loc = h.get("location")
                    if isinstance(loc, dict):
                        lat = loc.get("lat")
                        lng = loc.get("lng")
                        if "latitude" not in h and lat is not None:
                            h["latitude"] = lat
                        if "longitude" not in h and lng is not None:
                            h["longitude"] = lng
                    else:
                        # If model returned latitude/longitude only, synthesize location.
                        lat = h.get("latitude")
                        lng = h.get("longitude")
                        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
                            h["location"] = {"lat": float(lat), "lng": float(lng)}

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

@hospital_bp.route('/audio/analyze', methods=['POST'])
def analyze_audio_route():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        context = data.get("context")
        audio_file = data.get("audio_file")

        if not audio_file:
            return jsonify({"error": "audio_file is required"}), 400

        result = get_audio_sev(data)

        if isinstance(result, dict) and "error" in result:
            return jsonify({
                "status": "error",
                "message": result["error"]
            }), 500

        return jsonify({
            "status": "success",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@hospital_bp.route('/scan-document', methods=['POST'])
def scan_document_route():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No document image provided"}), 400

        image_file = request.files["file"]

        print("Document received for patient history update")

        result = update_data_from_image(image_file)

        if "error" in result:
            return jsonify({
                "status": "error",
                "message": result["error"]
            }), 500

        return jsonify({
            "status": "success",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500