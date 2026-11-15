"""SignWave: type a sentence, then hear it spoken."""

from language_processing import clean_text_with_details
from speech import speak_text


def process_text(text: str) -> tuple[str, str | None, bool]:
    """Send recognized text to Gemini to transform it into natural English.

    Returns:
        tuple of (text_to_send, gemini_output, is_successful)
    """
    return clean_text_with_details(text)


def main():
    print("SignWave")
    print("Type a sentence and press Enter to hear it.")
    print("Type quit to exit.")
    print()

    while True:
        text = input("Text: ")
        if text.strip().lower() == "quit":
            print("Goodbye.")
            break
        if not text.strip():
            print("Please type some text, or type quit to exit.")
            continue

        raw_text = text.strip()
        text_to_speak, gemini_output, is_successful = process_text(raw_text)

        print(f"RAW TEXT: {raw_text}")
        print(f"GEMINI OUTPUT: {gemini_output if gemini_output is not None else 'None'}")
        print(f"TEXT SENT TO ELEVENLABS: {text_to_speak}")

        try:
            saved = speak_text(text_to_speak)
            print(f"Saved speech to {saved.resolve()}")
        except Exception as exc:
            # One failed request should not stop the program.
            print(exc)
            print("Try again, or type quit to exit.")


if __name__ == "__main__":
    main()
