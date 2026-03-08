import json
import base64
import io
from faster_whisper import WhisperModel
from LLM_brain.llm import llm   # fixed import

# Load Whisper once
print("Loading local Whisper model...")
whisper_model = WhisperModel("base", device="cpu", compute_type="int8")


def get_audio_text(audio_stream):
    """Transcribes audio directly from a memory stream (no hard drive used)."""
    
    try:
        segments, info = whisper_model.transcribe(audio_stream, beam_size=5)
        text = " ".join([segment.text for segment in segments]).strip()
        return text
    
    except Exception as e:
        return f"Transcription Error: {str(e)}"


def llm_speech(json_input):
    """Processes Base64 audio and context directly from memory."""

    try:
        # 1. Parse JSON payload
        if isinstance(json_input, str):
            data = json.loads(json_input)
        else:
            data = json_input

        context = data.get("context", "No context provided.")
        base64_audio_string = data.get("audio_file")

        if not base64_audio_string:
            return "Error: JSON must contain an 'audio_file' base64 string."

        # 2. Decode Base64 → raw audio bytes
        raw_audio_bytes = base64.b64decode(base64_audio_string)

        # 3. Create in-memory audio stream
        audio_memory_stream = io.BytesIO(raw_audio_bytes)

        # 4. Transcribe audio
        print("Transcribing audio directly from RAM...")
        audio_text = get_audio_text(audio_memory_stream)

        # 5. Build prompt for LLM
        prompt = (
            "Analyse the following transcribed text using the provided medical context."
        )

        final_input = f"""
{prompt}

Patient Context:
{context}

Transcribed Audio:
{audio_text}
"""

        print("\n--- Final LLM Payload ---")
        print(final_input)

        # 6. Send to LLM
        response = llm(prompt, final_input)
        return response

    except Exception as e:
        return f"Processing Error: {str(e)}"


# --- Test it out ---
if __name__ == "__main__":

    # Example mock payload
    mock_api_payload = {
        "audio_file": "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
        "context": "Patient has a history of high blood pressure and asthma."
    }

    result = llm_speech(mock_api_payload)

    print("\n--- LLM Response ---")
    print(result)