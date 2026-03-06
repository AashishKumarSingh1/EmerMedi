from flask import Blueprint, request, jsonify
import os
import boto3
import io
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from PIL import Image

# IMPORT YOUR NEW ROBUST MODULE!
from bedrock.llm_analyzer import analyze_with_llm



image_bp = Blueprint('image_bp', __name__)
load_dotenv()


# Initialize Rekognition Client
rekognition = boto3.client(
    'rekognition',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

@image_bp.route('/predict-image', methods=['POST'])
def predict_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['file']
    print(f"\n[IMAGE RECEIVED] Analyzing: {image_file.filename}")
    
    try:
        image_bytes = image_file.read()

        # Handle large images (> 4.5MB)
        if len(image_bytes) > 4500000:
            print("⚠️ Compressing large image...")
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode != 'RGB': img = img.convert('RGB')
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=80) 
            image_bytes = buffer.getvalue()

        # 1. Ask Rekognition: "What do you see?"
        print("👀 Extracting labels via Rekognition...")
        rek_response = rekognition.detect_labels(
            Image={'Bytes': image_bytes},
            MaxLabels=15,
            MinConfidence=60 
        )
        detected_labels =[label['Name'] for label in rek_response['Labels']]
        print(f"LABELS: {detected_labels}")

        # 2. Define the SYSTEM PROMPT
        # We use {labels_text} as a placeholder. The bedrock module will fill it in.
        prompt_template = """
        You are an AI emergency dispatcher. 
        An image was analyzed and contains the following items: {labels_text}.
        
        Is this a medical or accident emergency? 
        Respond ONLY in valid JSON format with two keys:
        "status" (must be exactly "emergency" or "non-emergency")
        "reason" (a short 1-sentence logical explanation).
        Do not add any conversational text.
        """

        # 3. Call your modularized Bedrock function
        print("🧠 Passing data to Bedrock LLM Analyzer...")
        llm_decision = analyze_with_llm(labels=detected_labels, prompt_template=prompt_template)

        # Console Logging
        print("------------------------------")
        is_emergency = (llm_decision.get('status') == 'emergency')
        if is_emergency:
            print(f"STATUS    : 🚨 EMERGENCY DETECTED")
        else:
            print(f"STATUS    : ✅ SAFE / NORMAL")
        print(f"REASON    : {llm_decision.get('reason')}")
        print("------------------------------")

        # Return JSON to Frontend
        return jsonify({
            'status': llm_decision.get('status'),
            'reason': llm_decision.get('reason'),
            'detected_labels': detected_labels
        }), 200

    except Exception as e:
        print(f"!!! SYSTEM ERROR: {str(e)}")
        return jsonify({'error': str(e)}), 500

