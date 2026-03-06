from flask import Blueprint, request, jsonify
import os

# 1. Suppress TensorFlow warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from flask import Flask, request, jsonify
import numpy as np
import librosa
from tensorflow.keras.models import load_model


audio_bp = Blueprint('audio_bp', __name__)


# --- CONFIGURATION & MAPPING ---
# Standard mapping for many Emotion Detection models (Adjust indices if your model differs)
EMOTION_MAP = {
    0: {"label": "neutral",   "status": "Neutral"},
    1: {"label": "calm",      "status": "Neutral"},
    2: {"label": "happy",     "status": "Non-Emergency"},
    3: {"label": "sad",       "status": "Non-Emergency"},
    4: {"label": "angry",     "status": "Emergency"},
    5: {"label": "fearful",   "status": "Emergency"},
    6: {"label": "disgust",   "status": "Non-Emergency"},
    7: {"label": "surprised", "status": "Emergency"} 
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_NAME = 'Emotion_Voice_Detection_Model.h5'
MODEL_PATH = os.path.join(BASE_DIR, MODEL_NAME)



# Load model
if os.path.exists(MODEL_PATH):
    model = load_model(MODEL_PATH)
    print(f"--- Model Loaded: {MODEL_NAME} ---")
else:
    print("ERROR: Model file not found.")
    model = None

def get_category(class_idx):
    """Categorizes the numerical prediction into Emergency levels."""
    info = EMOTION_MAP.get(class_idx, {"label": "unknown", "status": "Neutral"})
    return info["label"], info["status"]

def predict_audio_class(audio_data):
    X, sr = librosa.load(audio_data, sr=16000)
    mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sr, n_mfcc=40).T, axis=0)
    mfccs = np.expand_dims(mfccs, axis=(0, -1)) 

    predictions = model.predict(mfccs, verbose=0)
    return int(np.argmax(predictions, axis=1)[0])

@audio_bp.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    
    try:
        # 1. Get numerical prediction
        class_idx = predict_audio_class(file)
        
        # 2. Map to Label and Emergency Status
        emotion, status = get_category(class_idx)
        
        # 3. Print to console for monitoring
        print(f"Detected Sound: {emotion.upper()} | Category: {status.upper()}")

        return jsonify({
            'detected_emotion': emotion,
            'emergency_category': status,
            'class_index': class_idx
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
