"""Generate ElevenLabs speech for the CLI and local HTTP API."""

import json
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
VOICE_PREFERENCES_FILE = Path(__file__).with_name("voice_settings.local.json")
DEFAULT_VOICE_SETTINGS = {"stability": 0.5, "similarity_boost": 0.75, "speed": 1.0}
VOICE_SETTING_RANGES = {
    "stability": (0.0, 1.0),
    "similarity_boost": (0.0, 1.0),
    "speed": (0.7, 1.2),
}

# Send both settings only for models known to support them.
MODELS_WITH_VOICE_SETTINGS = {
    "eleven_v4_turbo",
    "eleven_v4",
    "eleven_flash_v2_5",
    "eleven_turbo_v2_5",
    "eleven_multilingual_v2",
}
MODELS_WITH_SPEED = {"eleven_flash_v2_5", "eleven_turbo_v2_5", "eleven_multilingual_v2"}

# Saved in the current working directory (the project folder when you run from there).
OUTPUT_FILE = Path("output.mp3")


def get_model_id():
    """Read the model the speech API will use."""
    load_dotenv()
    return (os.getenv("ELEVENLABS_MODEL_ID") or "").strip() or DEFAULT_MODEL_ID


def supported_voice_settings(model_id):
    """Return the adjustable settings confirmed for this model."""
    if model_id not in MODELS_WITH_VOICE_SETTINGS:
        return ()
    if model_id in MODELS_WITH_SPEED:
        return ("stability", "similarity_boost", "speed")
    return ("stability", "similarity_boost")


def load_voice_preferences():
    """Read local Voice Studio choices, falling back to defaults if unreadable."""
    try:
        preferences = json.loads(VOICE_PREFERENCES_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if not isinstance(preferences, dict):
        return {}

    valid = {}
    voice = preferences.get("voice")
    if isinstance(voice, str) and voice in VOICE_IDS:
        valid["voice"] = voice
    for name, (minimum, maximum) in VOICE_SETTING_RANGES.items():
        value = preferences.get(name)
        if type(value) in (float, int) and minimum <= value <= maximum:
            valid[name] = float(value)
    return valid


def iter_speech_audio(text, voice=None, *, voice_settings=None):
    """Yield nonempty MP3 chunks using the configured voice and model."""
    cleaned = text.strip() if isinstance(text, str) else ""
    if not cleaned:
        raise ValueError("Please type some text before generating speech.")
    if voice is not None and voice not in VOICE_IDS:
        raise ValueError("Choose 'male' (George) or 'female' (Sarah).")

    model_id = get_model_id()
    api_key = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError(
            "Missing ElevenLabs API key. Open the .env file in the project folder "
            "and set ELEVENLABS_API_KEY= to your key."
        )

    preferences = load_voice_preferences()
    selected_voice = voice or preferences.get("voice")
    if selected_voice:
        voice_id = VOICE_IDS[selected_voice]
    else:
        voice_id = (os.getenv("ELEVENLABS_VOICE_ID") or "").strip() or DEFAULT_VOICE_ID
    values = {
        "stability": DEFAULT_VOICE_SETTINGS["stability"],
        "similarity_boost": DEFAULT_VOICE_SETTINGS["similarity_boost"],
    }
    values.update(preferences if voice_settings is None else voice_settings)
    supported_values = {
        name: values[name] for name in supported_voice_settings(model_id) if name in values
    }
    settings = {}
    if supported_values:
        settings["voice_settings"] = VoiceSettings(**supported_values)

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
        # Read the first chunk eagerly so an empty response becomes an error.
        first_chunk = next(chunk for chunk in audio if chunk)
        yield first_chunk
        yield from (chunk for chunk in audio if chunk)
    except Exception as exc:
        raise RuntimeError(
            f"Speech generation failed ({type(exc).__name__}: {exc}). "
            "Check your internet connection, API key, voice, model, and quota."
        ) from exc

def speak_text(text, voice=None, *, output_file=OUTPUT_FILE, voice_settings=None):
    """Save speech from the same generator used by the HTTP API."""
    output_path = Path(output_file)
    audio = iter_speech_audio(text, voice, voice_settings=voice_settings)
    # Preserve an existing file when ElevenLabs rejects the request.
    first_chunk = next(audio)
    with output_path.open("wb") as audio_file:
        audio_file.write(first_chunk)
        for chunk in audio:
            audio_file.write(chunk)
    return output_path
