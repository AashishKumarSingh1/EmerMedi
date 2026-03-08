from flask import Blueprint, request, jsonify
import os
import tempfile
import uuid
from models.audio_analyzer import analyze_audio_with_nova

audio_bp = Blueprint('audio_bp', __name__)

print("--- Audio Analysis: Using Amazon Bedrock Converse API ---")

@audio_bp.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        print("ERROR: No file uploaded")
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    
    # Create unique temp file for this request
    unique_id = str(uuid.uuid4())
    temp_dir = tempfile.gettempdir()
    input_path = os.path.join(temp_dir, f'audio_{unique_id}.wav')
    
    try:
        print(f"📁 Processing audio file: {file.filename}")
        
        # Save uploaded file
        file.save(input_path)
        print(f"✓ Saved audio file: {os.path.basename(input_path)}")
        
        # Read audio bytes
        with open(input_path, 'rb') as f:
            audio_bytes = f.read()
        
        print(f"🎵 Audio size: {len(audio_bytes)} bytes")
        
        # Analyze with Nova Sonic
        print(f"🤖 Analyzing with Amazon Bedrock Converse...")
        result = analyze_audio_with_nova(audio_bytes)
        
        # Determine if it's an emergency
        is_emergency = (
            result.get('emergency_level') in ['critical', 'urgent'] or
            result.get('call_ambulance') == True or
            result.get('urgency_score', 0) >= 70
        )
        
        print(f"✓ Analysis complete!")
        print(f"   Emergency Level: {result.get('emergency_level', 'unknown').upper()}")
        print(f"   Urgency Score: {result.get('urgency_score', 0)}")
        print(f"   Is Emergency: {is_emergency}")

        # Return in format expected by Next.js API
        return jsonify({
            'detected_emotion': result.get('detected_emotions', ['neutral'])[0] if result.get('detected_emotions') else 'neutral',
            'emergency_category': 'Emergency' if is_emergency else 'Non-Emergency',
            'emergency_level': result.get('emergency_level'),
            'urgency_score': result.get('urgency_score'),
            'call_ambulance': result.get('call_ambulance'),
            'call_police': result.get('call_police'),
            'call_fire_department': result.get('call_fire_department'),
            'audio_type': result.get('audio_type'),
            'voice_analysis': result.get('voice_analysis'),
            'background_sounds': result.get('background_sounds'),
            'spoken_content': result.get('spoken_content'),
            'scene_assessment': result.get('scene_assessment'),
            'immediate_actions': result.get('immediate_actions'),
            'dispatcher_report': result.get('dispatcher_report'),
            'reasoning': result.get('reasoning'),
            'confidence_score': result.get('confidence_score'),
            'full_analysis': result
        }), 200

    except Exception as e:
        print(f"❌ ERROR in audio prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up temp file
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
                print(f"🗑️ Cleaned up temp file")
            except Exception as e:
                print(f"⚠️ Failed to clean up {input_path}: {e}")
