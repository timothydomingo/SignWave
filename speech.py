"""Turn typed text into speech and save it as output.mp3."""

import os
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

# Documented defaults. Override them with environment variables if you want.
# Voice "George": https://elevenlabs.io/docs/eleven-api/guides/cookbooks/text-to-speech/
DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"
# Model: https://elevenlabs.io/docs/overview/models
DEFAULT_MODEL_ID = "eleven_multilingual_v2"

# Saved in the current working directory (the project folder when you run from there).
OUTPUT_FILE = Path("output.mp3")


def speak_text(text):
    """Generate speech from text and save it as output.mp3."""
    cleaned = text.strip() if isinstance(text, str) else ""
    if not cleaned:
        raise ValueError("Please type some text before generating speech.")

    # Read .env here so importing this file does not need a key.
    load_dotenv()

    api_key = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError(
            "Missing ElevenLabs API key. Open the .env file in the project folder "
            "and set ELEVENLABS_API_KEY= to your key."
        )

    voice_id = (os.getenv("ELEVENLABS_VOICE_ID") or "").strip() or DEFAULT_VOICE_ID
    model_id = (os.getenv("ELEVENLABS_MODEL_ID") or "").strip() or DEFAULT_MODEL_ID

    try:
        client = ElevenLabs(api_key=api_key)
        # convert() returns chunks of audio bytes. Write every chunk to the mp3 file.
        audio = client.text_to_speech.convert(
            text=cleaned,
            voice_id=voice_id,
            model_id=model_id,
            output_format="mp3_44100_128",
        )
        with OUTPUT_FILE.open("wb") as audio_file:
            for chunk in audio:
                if chunk:
                    audio_file.write(chunk)
    except Exception as exc:
        raise RuntimeError(
            f"Speech generation failed ({type(exc).__name__}: {exc}). "
            "Check your internet connection, API key, voice, model, and quota."
        ) from exc

    return OUTPUT_FILE
