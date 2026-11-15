# SignWave

**Hack The Nest 2026 | Accessible sign-to-speech prototype**

SignWave is a hackathon prototype that recognizes a **limited set of supported signs or gestures**, displays the confirmed message as a caption, and converts the message into speech using ElevenLabs. The web demo is designed to play the recognized phrase as audio.

> **Scope:** This is a limited-vocabulary prototype, **not a complete or certified American Sign Language (ASL) interpreter**. Hand tracking and gesture recognition alone do not translate continuous ASL.

## Browser recognition and phrase audio

The browser runs the Teachable Machine TensorFlow.js model on webcam frames.
The trained export is in `frontend/public/recognition-model/`. Keep `model.json`, `metadata.json`, and `weights.bin` together when serving it to the frontend. The
`frontend/src/lib/phrase-recognition.mjs` module accepts the model's prediction array and emits
one phrase after it observes a supported sequence of stable labels. The
current demo sequences are `hello → world` and `this is → test`. Test the
idle camera and ordinary motion before enabling playback, especially if the
model was trained without a background class.

From `backend/`, install the packages in `requirements.txt`, configure `GEMINI_API_KEY` and
`ELEVENLABS_API_KEY` in `.env`, and run `python phrase_api.py` for local
development. The server listens on `127.0.0.1:8787`.

- `GET /health` checks that the server is running.
- `POST /api/phrases` accepts JSON such as `{"text":"hello world"}`.
  Optionally include `"voice":"male"` or `"voice":"female"`.
- The response includes `text`, `cleanupApplied`, `audioBase64`, and
  `mimeType`. The caption is the text actually passed to speech.
- Set `SIGNWAVE_FRONTEND_ORIGIN` to the exact browser origin, including
  scheme and port when applicable, to allow cross-origin requests during local
  development.

Call the endpoint when each phrase is recognized. Keep the recognition loop
running while the request is pending and queue playback in phrase order.
This API returns one finished MP3 per phrase. It does not stream MP3 chunks
over HTTP. Confirm the timing on the demo network before promising that
speech will overlap the next phrase. If Gemini cleanup fails, the existing
language module passes the recognized text through to speech.


## How the project works

```text
Camera → Group A recognition → confirmed text event
                                   ↓
                         [language processing]
                                   ↓
                            ElevenLabs TTS
                                   ↓
                  audio file / playback → call audio
```

Initially, `[language processing]` should be a **pass-through** (it returns the same text). Later, Group B can add optional Gemini cleanup and translation without changing the ElevenLabs module. Do not automatically speak guesses or ambiguous recognition results.

## Team responsibilities

| Team | Responsibility | Initial success criterion |
|---|---|---|
| **Group A — Recognition** | Camera, supported-sign recognition, stable confirmed text events | One intended sign produces one confirmed event; unsupported gestures produce none |
| **Group B — Speech & call** | Captions, ElevenLabs text-to-speech, ordered playback, call audio routing; optional language cleanup/translation later | Typed test text can be heard from a second device |

## Project files

| Path | Contents |
|---|---|
| `frontend/` | Base44 web app, camera UI, recognition logic, and trained model assets. |
| `backend/` | Python phrase API, language cleanup, speech generation, CLI, and example configuration. |
| `README.md` | Project setup and demo instructions. |

Generated `output.mp3` and any other audio files should not be committed unless the team deliberately chooses to include safe example recordings.

## Frontend development

The Base44 export uses React, TanStack Start, and Vite. The app routes live in
`frontend/src/routes/`, including the communication screen at
`frontend/src/routes/communicate.jsx`. The Cloudflare Worker entry is
`frontend/src/server.js`, and the build emits `dist/client` and `dist/server`
within `frontend/`.

From the repository root, run these commands with Node.js, npm, and the Base44
CLI installed:

```powershell
cd frontend
npm ci
base44 login
base44 link
base44 dev
```

Sign in once per machine and link the frontend to SignWave once per local
checkout. Run `npm run build` from `frontend/` for a production build.

### Try live webcam-to-speech

1. For a local test, create `frontend/.env.local` with
   `VITE_SIGNWAVE_LOCAL_SPEECH=true`. In `backend/.env`, set
   `SIGNWAVE_FRONTEND_ORIGIN` to the exact URL printed by the frontend dev
   server. Restart the frontend after changing its environment.
2. Set the Gemini and ElevenLabs keys in `backend/.env` and run
   `python phrase_api.py` from `backend/`. The local frontend uses
   `http://127.0.0.1:8787/api/phrases`.
3. Open the communication screen, turn on the camera, and wait for **Live
   recognition · English**. Sign `hello → world` or `this is → test`, holding
   each sign briefly. The caption appears first and the MP3 plays when ready.
   The runtime loads from jsDelivr, and model inference stays in the browser.

The sample-sign and typed-text paths still use browser speech. The trained
model supports two English demo phrases. Check idle-camera behavior before
presenting because this model export has no background class.

### Configure hosted live speech

Run the Python API behind your host's HTTPS ingress. Set
`SIGNWAVE_API_HOST=0.0.0.0`, use the `PORT` supplied by the host, and configure
`SIGNWAVE_SPEECH_TOKEN`, `GEMINI_API_KEY`, and `ELEVENLABS_API_KEY` on that
service. Apply request rate limits at the ingress before public use.

In Base44 Secrets, set `SIGNWAVE_SPEECH_URL` to the HTTPS URL ending in
`/api/phrases` and `SIGNWAVE_SPEECH_TOKEN` to the same server token.
Sign in to the published SignWave app before using live cloud speech. The
Base44 server function authenticates the caller and forwards completed phrases
with the token. The model and its asset files must be included in the Base44
deployment.

## First-time setup on Windows (for every teammate)

### 1. Get the project

1. Install [GitHub Desktop](https://desktop.github.com/) and sign in.
2. Accept the repository collaboration invitation if it is private.
3. On the repository webpage select **Code → Open with GitHub Desktop**, or in GitHub Desktop use **File → Clone repository**.
4. Choose **any folder you own**. It does **not** need to match the original developer's `C:\Users\...` path.
5. Open the downloaded folder in **Cursor** (**File → Open Folder**).

### 2. Check Python

In Cursor select **Terminal → New Terminal**, then run:

```powershell
python --version
```

If that fails, try `py --version`. Install Python from [python.org](https://www.python.org/downloads/) if neither is available. Ask a teammate if the project requires a particular Python version; use the same supported version across the team where possible.

### 3. Create your own virtual environment

Run these commands **inside the `backend/` folder**:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If `python` is unavailable but `py` works, use `py -m venv .venv` for the first command. Calling `\.venv\Scripts\python.exe` directly avoids PowerShell activation-policy problems.

### 4. Configure ElevenLabs only if you're running speech

1. Sign in to [ElevenLabs](https://elevenlabs.io/) and create an API key in your account's API key settings, using only permissions you need.
2. Copy `.env.example` to a new file named `.env`. You can run:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Open `.env` in Cursor and put your key after the equals sign:

   ```dotenv
   ELEVENLABS_API_KEY=your_key_goes_here
   ```

4. Save the file. **Never post the real key in chat, commit it to GitHub, or share it in screenshots.** Each developer who runs speech needs an authorized key; ask the owner how the team will handle access.
5. If `speech.py` requires other settings (such as a voice ID or model ID), follow `.env.example` or ask Group B for the current values. The available settings depend on the code actually committed.

**Security check before your first commit:** `.gitignore` should include at least:

```gitignore
.env
.venv/
__pycache__/
*.pyc
output.mp3
```

If `.env` was committed before `.gitignore` was added, merely ignoring it later is not enough: remove it from tracking and **revoke/rotate the exposed API key**.

### 5. Run the first test

```powershell
.\.venv\Scripts\python.exe main.py
```

If the current `main.py` accepts typed text, enter a short sample such as `Hello from SignWave!`. Depending on the current implementation, it may produce `output.mp3` rather than automatically playing audio. Confirm the output before moving to live recognition.

**If a package is missing:** first rerun the `pip install -r requirements.txt` command with the `.venv` Python. If a dependency isn't listed in `requirements.txt`, tell the developer who added it to update that file and commit the fix.

## How Group A sends text to Group B

**Agree on this interface before connecting modules.** A sample **Python dictionary** event:

```python
{
    "version": 1,
    "event_id": "session1-0001",
    "label": "ILoveYou",
    "text": "I love you.",
    "score": 0.94,
    "final": True,
}
```

This is sample data, **not an actual recognition result**. Group A should emit an event **only after a supported sign has been recognized consistently**. `score` is an estimated recognition score, not proof of translation accuracy.

- `event_id`: unique per accepted occurrence so duplicates can be ignored.
- `text`: confirmed, approved wording for the caption and voice.
- `final`: only `True` events may be sent to speech.
- `label`: supported recognition category; Group B should not guess the meaning from a label.
- `score`: useful for debugging and evaluation.

**Group A owns** recognition and event creation. **Group B owns** queued playback and the `speak_event(event)` interface (to be added if not present). In the final demo, use a Python `queue.Queue` between recognition and speech so ElevenLabs requests or audio playback do not block the camera loop. Do not play duplicate or overlapping events. Show an error while preserving captions if ElevenLabs is unavailable.

## Adding grammar cleanup and translation later

The intended processing sequence is:

```text
confirmed recognition text
     → cleanup / meaning-to-English (optional)
     → translation to selected language (optional)
     → ElevenLabs voice for that language
```

Start with a function such as `process_text(text)` that returns the input unchanged. Later, Group B can replace its internals with a Gemini API call or a verified fixed mapping. Keep it as a separate module so `speech.py` still receives plain finalized text.

**Meaning safeguards:** ASL is a language with its own grammar. A list of hand labels cannot automatically be turned into a faithful ASL translation. Keep supported vocabulary limited, do not invent missing meaning, flag ambiguity rather than guessing, and allow the user to correct uncertain text. Begin with English speech; add one additional language only after the English pathway works.

## Call audio (later milestone)

For Windows, [VB-CABLE](https://vb-audio.com/Cable/) can route the Python player's **output to `CABLE Input`** into the call app's **microphone set to `CABLE Output`**. Test with another device and headphones to prevent echo. The call platform (Google Meet, Zoom, etc.) is **not selected yet**. Do not assume a generated MP3 is already audible to call participants.

## Collaborating safely with GitHub Desktop

1. **Before editing:** click **Fetch origin**, then **Pull origin** if updates are available.
2. **Work in your assigned module:** Group A on recognition; Group B on speech and language processing. Coordinate edits to `main.py` and `requirements.txt`.
3. **Review your changed files** in GitHub Desktop. Never commit `.env`, `.venv`, generated audio, credentials, or personal files.
4. Write a clear commit summary such as `Add ElevenLabs speech test`, then **Commit** and **Push origin**.
5. Ask teammates to **Pull origin** before trying your update. For simultaneous work on the same files, create separate branches and use pull requests, or coordinate with the team first.

**Cloning recreates shared source files, not local virtual environments or secret keys.** Everyone follows the setup steps above on their own computer.

## Troubleshooting

| Symptom | What to try |
|---|---|
| `ModuleNotFoundError: No module named 'dotenv'` | Install dependencies with `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` and run with that same Python. `python-dotenv` must be listed. |
| `ModuleNotFoundError: No module named 'elevenlabs'` | Same as above; confirm `elevenlabs` is listed in `requirements.txt`. |
| Missing ElevenLabs API key | Confirm `.env` exists next to the project files, has the correct `ELEVENLABS_API_KEY` name, and the code loads it. Don't display the key when debugging. |
| ElevenLabs authorization/quota error | Verify the key has Text-to-Speech access and the account has available usage. Do not upload your key for troubleshooting. |
| MP3 generated but no audio in call | The file output works; next configure playback and the virtual audio device, then test from another device. |
| Changes not showing for a teammate | Verify you committed **and pushed**, and they fetched **and pulled**. |

## Hack The Nest demo checklist

- [ ] Sign recognized reliably from a small, **verified** vocabulary
- [ ] One accepted sign produces one caption and one spoken message
- [ ] Typed text can independently produce ElevenLabs audio
- [ ] Audio reaches a second device (once call routing is ready)
- [ ] No API keys in GitHub
- [ ] All teammates can explain their own code
- [ ] Public GitHub repository ready for final Devpost submission
- [ ] Demo video is **three minutes or less**

**Event schedule (Eastern, Nov 15, 2026):** Draft submission at **12:00 AM**, final Devpost submission at **12:00 PM**, demo judging at **1:15 PM**. Confirm updates in the official event app or Discord.

---

**For teammates:** If setup fails, share the error message, the command you ran, and your Python version. **Never share your `.env` file or API key.**
