"""Try Gemini cleanup on a few sentences. Does not call ElevenLabs."""

from language_processing import clean_text

SAMPLES = (
    "I need help.",
    "Thank you.",
    "you me store",
)


def main():
    for text in SAMPLES:
        result = clean_text(text)
        print(f"Original: {text}")
        print(f"Result:   {result}")
        print()


if __name__ == "__main__":
    main()
