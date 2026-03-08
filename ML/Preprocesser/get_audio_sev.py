from LLM_brain.llm_speech import llm_speech


def get_audio_sev(json_data):
    """
    Expected JSON format:
    {
        "context": "Patient medical history...",
        "audio_file": "BASE64_AUDIO_STRING"
    }
    """

    try:
        result = llm_speech(json_data)
        return result

    except Exception as e:
        return {"error": str(e)}