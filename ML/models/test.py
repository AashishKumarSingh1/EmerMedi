import os
import time
import numpy as np
import librosa
import sounddevice as sd
import wave

# 1. Suppress TensorFlow/oneDNN warnings BEFORE importing
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
from tensorflow.keras.models import load_model

# 2. Dynamic Path Handling (Fixes your FileNotFoundError)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_NAME = 'Emotion_Voice_Detection_Model.h5'
MODEL_PATH = os.path.join(BASE_DIR, MODEL_NAME)

# 3. Emotion & Emergency Mapping
EMOTION_MAP = {
    0: {"label": "neutral",   "status": "NEUTRAL"},
    1: {"label": "calm",      "status": "NEUTRAL"},
    2: {"label": "happy",     "status": "NON-EMERGENCY"},
    3: {"label": "sad",       "status": "NON-EMERGENCY"},
    4: {"label": "angry",     "status": "EMERGENCY"},
    5: {"label": "fearful",   "status": "EMERGENCY"},
    6: {"label": "disgust",   "status": "NON-EMERGENCY"},
    7: {"label": "surprised", "status": "EMERGENCY"} 
}

# Load the model
if os.path.exists(MODEL_PATH):
    print(f"--- Loading Model: {MODEL_NAME} ---")
    model = load_model(MODEL_PATH)
    print("✅ System Ready. Starting Live Monitoring...")
else:
    print(f"❌ ERROR: Could not find model at {MODEL_PATH}")
    exit()

def predict_audio_class(filename):
    """Processes the recorded wav file and returns the emotion index."""
    # Load audio (standardizing sample rate to 16kHz)
    X, sr = librosa.load(filename, sr=16000)
    mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sr, n_mfcc=40).T, axis=0)
    
    # Reshape for model: (1, 40, 1)
    mfccs = np.expand_dims(mfccs, axis=(0, -1))

    # Predict
    predictions = model.predict(mfccs, verbose=0)
    return int(np.argmax(predictions, axis=1)[0])

def record_and_save(duration=5, filename="live_temp.wav"):
    """Records audio and saves it as a temporary WAV file for analysis."""
    print(f"\n[LISTENING] Recording for {duration} seconds...")
    sample_rate = 16000
    recorded_audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='float32')
    sd.wait()
    
    # Save to disk as 16-bit PCM (Standard for Librosa)
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes((recorded_audio * 32767).astype(np.int16))
    return filename

# --- MAIN MONITORING LOOP ---
try:
    print("Press Ctrl+C to stop monitoring.")
    while True:
        # 1. Record 5 seconds of audio
        audio_file = record_and_save(duration=5)

        # 2. Analyze the recorded file
        class_idx = predict_audio_class(audio_file)
        
        # 3. Get Human-readable status
        info = EMOTION_MAP.get(class_idx, {"label": "unknown", "status": "UNKNOWN"})
        emotion = info['label'].upper()
        status = info['status']

        # 4. Clear and Professional Console Output
        print("-" * 40)
        print(f"DETECTED EMOTION : {emotion}")
        print(f"EMERGENCY STATUS : {status}")
        
        if status == "EMERGENCY":
            print("🚨 ALERT: Potential threat detected!")
        elif status == "NON-EMERGENCY":
            print("ℹ️  Info: Voice detected, no threat.")
        else:
            print("ℹ️  Info: Environment is calm.")
        print("-" * 40)

        # Optional delay to prevent CPU overload
        time.sleep(0.5)

except KeyboardInterrupt:
    print("\n--- Stopping Live Monitoring ---")
    if os.path.exists("live_temp.wav"):
        os.remove("live_temp.wav")