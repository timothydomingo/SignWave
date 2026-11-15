# SignWave

SignWave is a Group B hackathon prototype. Right now you type text and the program speaks it. Sign-language input will come later.

`process_text` in `main.py` is a placeholder. It returns your text unchanged. Later it can clean up and translate text (for example with Gemini). It does not call a language model today.

Speech uses the ElevenLabs Python SDK.

## Prerequisites

Python 3 is installed on this computer. The launcher that worked is `py -3`, and the version is **Python 3.14.5**. `py` and `python` also reported 3.14.5.

## Open the project in Cursor

1. Open Cursor.
2. Choose **File > Open Folder**.
3. Select this folder: `C:\Users\timoe\OneDrive\Desktop\Projects\SignWave`.

## Create the virtual environment

A `.venv` folder is already in the project. If you need to create it again, open **Terminal > New Terminal** in Cursor. That terminal is PowerShell. Then run:

```powershell
py -3 -m venv .venv
```

## Install the requirements

In that same PowerShell terminal, from the project folder, run:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

This installs only `elevenlabs` and `python-dotenv`.

## Run the program

```powershell
.\.venv\Scripts\python.exe main.py
```

Type a sentence and press Enter. The program prints what you typed, then saves speech as `output.mp3` in the project folder (the current working directory). Type `quit` or `Quit` to exit. If you press Enter with no text, it asks again. If speech fails, it prints the error and lets you try again.

## Put your ElevenLabs API key in `.env`

1. Open the local file named `.env` in the project folder. Do not put the key in `.env.example`.
2. Set this line to your key:

```text
ELEVENLABS_API_KEY=
```

There should be no spaces around the key. Example shape only: `ELEVENLABS_API_KEY=your_key_here`.

Do not paste the key into chat. Do not commit `.env`. `.env.example` is only a template and contains no key. `.gitignore` already excludes `.env`.

Create an API key in the ElevenLabs dashboard. The official setup guide is here: https://elevenlabs.io/docs/eleven-api/guides/cookbooks/text-to-speech/

## Optional voice and model

You can add these lines to `.env` if you want a different voice or model. If you leave them out, the program uses the defaults below.

```text
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

- Default voice: **George**, ID `JBFqnCBsd6RMkjVDRZzb`, from the official quickstart: https://elevenlabs.io/docs/eleven-api/guides/cookbooks/text-to-speech/
- Default model: `eleven_multilingual_v2`, from the models page: https://elevenlabs.io/docs/overview/models

ElevenLabs says its older default voices, including George, are only for accounts created before March 2026 and expire on December 31, 2026. The documented replacement for George is **Eldrin - Crisp British Baritone**, ID `6WwXjDDEMyNmFG95zycZ`: https://elevenlabs.io/docs/help-center/product/voices/my-voices/what-are-default-voices

If George does not work on your account, set `ELEVENLABS_VOICE_ID=6WwXjDDEMyNmFG95zycZ` in `.env`.

## Files

- `main.py` — asks you for text in a loop, shows what you typed, runs `process_text`, then speaks it.
- `speech.py` — calls ElevenLabs and writes `output.mp3`.
- `requirements.txt` — the two Python packages to install.
- `.env` — your local API key. Not for sharing.
- `.env.example` — a template that shows the variable names. No secrets.
- `.gitignore` — tells git to skip `.env`, `.venv/`, `__pycache__/`, and mp3 files.
- `.venv/` — the local Python environment. Already created.

`output.mp3` is created in the project folder when speech succeeds.
