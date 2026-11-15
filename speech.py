"""Turn text into speech and save it as an MP3."""

import os
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs import VoiceSettings
from elevenlabs.client import ElevenLabs

VOICE_IDS = {
    "male": "JBFqnCBsd6RMkjVDRZzb",  # George
    "female": "EXAVITQu4vr4xnSDxMaL",  # Sarah
}
DEFAULT_VOICE_ID = VOICE_IDS["male"]
DEFAULT_MODEL_ID = "eleven_v4_turbo"

# Send both settings only for models known to support them.
MODELS_WITH_VOICE_SETTINGS = {
    "eleven_v4_turbo",
    "eleven_v4",
    "eleven_flash_v2_5",
    "eleven_turbo_v2_5",
    "eleven_multilingual_v2",
}

# Saved in the current working directory (the project folder when you run from there).
OUTPUT_FILE = Path("output.mp3")


def speak_text(text, voice=None, *, output_file=OUTPUT_FILE):
    """Save speech using 'male', 'female', or the configured default voice."""
    cleaned = text.strip() if isinstance(text, str) else ""
    if not cleaned:
        raise ValueError("Please type some text before generating speech.")
    if voice is not None and voice not in VOICE_IDS:
        raise ValueError("Choose 'male' (George) or 'female' (Sarah).")

    # Read .env here so importing this file does not need a key.
    load_dotenv()

    api_key = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError(
            "Missing ElevenLabs API key. Open the .env file in the project folder "
            "and set ELEVENLABS_API_KEY= to your key."
        )

    if voice is None:
        voice_id = (os.getenv("ELEVENLABS_VOICE_ID") or "").strip() or DEFAULT_VOICE_ID
    else:
        voice_id = VOICE_IDS[voice]
    model_id = (os.getenv("ELEVENLABS_MODEL_ID") or "").strip() or DEFAULT_MODEL_ID
    output_path = Path(output_file)
    settings = {}
    if model_id in MODELS_WITH_VOICE_SETTINGS:
        settings["voice_settings"] = VoiceSettings(stability=0.5, similarity_boost=0.75)

    try:
        client = ElevenLabs(api_key=api_key)
        # convert() returns chunks of audio bytes. Write every chunk to the mp3 file.
        audio = client.text_to_speech.convert(
            text=cleaned,
            voice_id=voice_id,
            model_id=model_id,
            output_format="mp3_44100_128",
            **settings,
        )
        # Wait for audio before opening the file, so API rejections preserve it.
        first_chunk = next(chunk for chunk in audio if chunk)
        with output_path.open("wb") as audio_file:
            audio_file.write(first_chunk)
            for chunk in audio:
                if chunk:
                    audio_file.write(chunk)
    except Exception as exc:
        raise RuntimeError(
            f"Speech generation failed ({type(exc).__name__}: {exc}). "
            "Check your internet connection, API key, voice, model, and quota."
        ) from exc

    return output_path
