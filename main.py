"""SignWave: type a sentence, then hear it spoken."""

from speech import speak_text


def process_text(text):
    """Return the text unchanged.

    Later this will clean up and translate text (for example with Gemini).
    It does not call any language model yet.
    """
    return text


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

        print(f"You typed: {text}")
        processed = process_text(text)

        try:
            saved = speak_text(processed)
            print(f"Saved speech to {saved.resolve()}")
        except Exception as exc:
            # One failed request should not stop the program.
            print(exc)
            print("Try again, or type quit to exit.")


if __name__ == "__main__":
    main()
