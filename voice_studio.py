"""Preview and save SignWave voice settings in Streamlit."""

import json
from pathlib import Path
from tempfile import TemporaryDirectory

import streamlit as st

from speech import (
    DEFAULT_VOICE_SETTINGS,
    VOICE_PREFERENCES_FILE,
    VOICE_SETTING_RANGES,
    get_model_id,
    load_voice_preferences,
    speak_text,
    supported_voice_settings,
)

VOICE_LABELS = {"male": "George (male)", "female": "Sarah (female)"}
SLIDERS = {
    "stability": ("Stability", "Higher values make the delivery more consistent."),
    "similarity_boost": ("Similarity", "Higher values sound closer to the original voice."),
    "speed": ("Speaking speed", "1.0 is normal speed."),
}


def reset_settings():
    st.session_state.update(voice="male", **DEFAULT_VOICE_SETTINGS)
    st.session_state.pop("preview_mp3", None)


def save_preferences(voice, settings):
    data = json.dumps({"voice": voice, **settings}, indent=2)
    with TemporaryDirectory(dir=VOICE_PREFERENCES_FILE.parent) as folder:
        pending = Path(folder) / VOICE_PREFERENCES_FILE.name
        pending.write_text(data + "\n", encoding="utf-8")
        pending.replace(VOICE_PREFERENCES_FILE)


def main():
    st.set_page_config(page_title="SignWave Voice Settings")
    st.title("Voice Settings")

    supported = supported_voice_settings(get_model_id())
    saved = load_voice_preferences()
    st.session_state.setdefault("voice", saved.get("voice", "male"))
    voice = st.selectbox("Voice", tuple(VOICE_LABELS), format_func=VOICE_LABELS.get, key="voice")

    settings = {}
    for name, (label, help_text) in SLIDERS.items():
        if name not in supported and name != "speed":
            continue
        minimum, maximum = VOICE_SETTING_RANGES[name]
        enabled = name in supported
        initial = saved.get(name, DEFAULT_VOICE_SETTINGS[name]) if enabled else DEFAULT_VOICE_SETTINGS[name]
        st.session_state.setdefault(name, initial)
        value = st.slider(label, minimum, maximum, step=0.05, key=name, help=help_text, disabled=not enabled)
        if enabled:
            settings[name] = value
    if "speed" not in supported:
        st.caption("Speaking speed is unavailable for your current ElevenLabs model.")

    sentence = st.text_area("Test sentence", value="Hello and welcome to SignWave. It is nice to meet you.")
    generate = st.button("Generate and Preview", type="primary")
    if generate:
        st.session_state.pop("preview_mp3", None)
        if not sentence.strip():
            st.warning("Enter a test sentence first.")
        else:
            try:
                with st.spinner("Generating speech…"), TemporaryDirectory() as folder:
                    output = speak_text(
                        sentence, voice=voice, voice_settings=settings,
                        output_file=Path(folder) / "preview.mp3",
                    )
                    st.session_state.preview_mp3 = output.read_bytes()
            except (RuntimeError, OSError, ValueError):
                st.error("Could not generate speech. Check your connection and ElevenLabs setup, then try again.")
    if "preview_mp3" in st.session_state:
        st.audio(st.session_state.preview_mp3, format="audio/mpeg", autoplay=generate)

    save_column, reset_column = st.columns(2)
    with save_column:
        if st.button("Save for SignWave"):
            try:
                save_preferences(voice, settings)
            except OSError:
                st.error("Could not save settings. Check that the SignWave folder is writable.")
            else:
                st.success("Saved. SignWave will use these settings the next time it generates speech.")
    reset_column.button("Reset Settings", on_click=reset_settings)
    st.caption("Reset restores the controls. Click Save for SignWave to apply them to the main app.")


if __name__ == "__main__":
    main()
