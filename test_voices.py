"""Generate the same SignWave sentence with George and Sarah."""

from speech import speak_text


TEST_SENTENCE = "Hello and welcome to SignWave. It is nice to meet you."


def main():
    failed = False
    for voice, name in (("male", "George"), ("female", "Sarah")):
        output_file = f"{voice}_test.mp3"
        try:
            saved = speak_text(TEST_SENTENCE, voice=voice, output_file=output_file)
        except Exception:
            # Raw API errors can contain request details. Print a safe message.
            print(
                f"Error ({name}): Could not generate {output_file}. "
                "Check your connection, ElevenLabs configuration, and quota."
            )
            failed = True
        else:
            print(f"Success ({name}): Saved {saved}.")

    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())
