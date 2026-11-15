"""Clean already-confirmed recognized text into natural English.

This module does not translate and does not call ElevenLabs.
"""

import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

# Override with GEMINI_MODEL in .env if you need a different model.
DEFAULT_MODEL = "gemini-3.5-flash-lite"

SYSTEM_INSTRUCTION = """
You convert recognized sign-language-derived text and phrases into natural, grammatically correct English.

Rules:
- Transform sign-derived words, glosses, or phrases into natural, grammatically complete English sentences.
- Do not add new information, outside facts, or extra details not implied by the input.
- Do not change the original intended meaning.
- If the input is already natural and grammatical English, return it unchanged.
- Never translate to another language. The result must stay in English.
- If the meaning is completely ambiguous or unclear, return the original text unchanged.
- Return only the final corrected English text with no quotes, Markdown formatting, or explanation.
""".strip()


def clean_text_with_details(text: str) -> tuple[str, str | None, bool]:
    """Clean already-confirmed recognized text into natural English using Gemini.

    Returns:
        (text_to_use, gemini_output, is_successful)
        - text_to_use: the corrected English text if successful, or original text if cleanup failed or was invalid.
        - gemini_output: the raw text returned by Gemini, or None if no valid response was returned.
        - is_successful: True if Gemini provided a complete and valid correction, False otherwise.
    """
    original = text if isinstance(text, str) else ""
    if not original.strip():
        print("Warning: nothing to clean. Returning the original text.")
        return original, None, False

    load_dotenv()
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not api_key:
        print(
            "Warning: GEMINI_API_KEY is missing in .env. "
            "Returning the original text."
        )
        return original, None, False

    model = (os.getenv("GEMINI_MODEL") or "").strip() or DEFAULT_MODEL
    prompt = (
        "Convert this recognized sign-language-derived text into grammatically natural English "
        "without adding information or changing the meaning.\n"
        "If it is already grammatical English, return it unchanged.\n"
        "If the meaning is unclear, return the original text exactly.\n\n"
        f"Recognized text: {original}"
    )

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
            ),
        )
    except Exception as exc:
        print(
            "Warning: Gemini cleanup failed "
            f"({_safe_error(exc, api_key)}). Returning the original text."
        )
        return original, None, False

    # Prevent incomplete or invalid Gemini responses from being treated as successful corrections.
    if not response or not response.candidates:
        print("Warning: Gemini returned no candidates. Returning the original text.")
        return original, None, False

    candidate = response.candidates[0]
    finish_reason = getattr(candidate, "finish_reason", None)
    finish_reason_str = str(finish_reason).upper()

    # FinishReason must be STOP (not MAX_TOKENS, SAFETY, RECITATION, etc.)
    if finish_reason is not None and finish_reason != types.FinishReason.STOP and "STOP" not in finish_reason_str:
        raw_text = (response.text or "").strip()
        print(
            f"Warning: Gemini response was incomplete or interrupted (finish_reason: {finish_reason}). "
            "It will not be treated as a successful correction."
        )
        return original, (f"{raw_text} [INCOMPLETE: {finish_reason}]" if raw_text else None), False

    raw_text = (response.text or "").strip()
    if not raw_text:
        print("Warning: Gemini returned empty text. Returning the original text.")
        return original, None, False

    cleaned = raw_text
    # Drop one pair of wrapping quotes if the model added them.
    if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in "\"'":
        cleaned = cleaned[1:-1].strip()

    if not cleaned:
        print("Warning: Gemini response was empty after stripping quotes. Returning the original text.")
        return original, raw_text, False

    return cleaned, raw_text, True


def clean_text(text: str) -> str:
    """Return grammatical English, or the original text if cleanup is unsafe."""
    text_to_use, _, _ = clean_text_with_details(text)
    return text_to_use


def _safe_error(exc: Exception, api_key: str) -> str:
    """Describe an error without revealing the API key."""
    message = str(exc)
    if api_key:
        message = message.replace(api_key, "[redacted]")
    return f"{type(exc).__name__}: {message}"
