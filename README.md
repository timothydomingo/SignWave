# SignWave

**Accessible sign-to-speech prototype · Hack The Nest 2026**

SignWave is an experimental communication tool that uses a webcam and a trained image-classification model to recognize a small set of supported sign sequences, display the resulting phrase, and speak it aloud. The project combines a React web interface, browser-based recognition, optional Gemini text cleanup, and ElevenLabs text-to-speech.

> **Important scope note:** SignWave is not a complete ASL translator or a certified interpretation system. It recognizes a limited, predefined vocabulary and phrase set. ASL has its own grammar and linguistic structure; recognizing isolated hand poses is not equivalent to understanding continuous ASL. Do not rely on this prototype for medical, legal, emergency, or other high-stakes communication.

## What it does

- **Live camera input:** Requests webcam access in the browser and runs the included Teachable Machine model on video frames.
- **Stable phrase detection:** Requires confident, repeated predictions before accepting a supported sequence, reducing accidental triggers.
- **Captions:** Displays the phrase recognized by the model.
- **Speech output:** The web app can use the browser's built-in speech synthesis. A separate Python service can generate MP3 audio with ElevenLabs for the supported live phrases.
- **Manual text and sample demo:** Lets users test the communication flow without relying on live recognition.
- **Optional text cleanup:** The Python backend can use Gemini to turn already-recognized sign-derived text into more natural English. If cleanup is unavailable or uncertain, it falls back to the original text.

## Project status and current limitations

| Component | Current behavior |
|---|---|
| Web interface | React app built with TanStack Start, Vite, and the Base44 tooling |
| Camera recognition | Loads the committed Teachable Machine model from `frontend/public/recognition-model/` |
| Live phrase vocabulary | The recognizer currently emits `hello world` and `this is test` from supported two-label sequences |
| Web demo/sample mode | Feeds sample glosses into the interface so the UI can be tested without a camera |
| Default web speech | Uses the browser's Web Speech API; available voices depend on the device and browser |
| Hosted live speech | The server function can call the separately hosted Python speech API when Base44 secrets are configured |
| Local speech development | The frontend can call the local Python API when `VITE_SIGNWAVE_LOCAL_SPEECH=true` is set in development |
| Python CLI/API | Provides standalone text cleanup and ElevenLabs speech generation |

The web app's general text-processing/demo flow and the Python backend are separate paths. The Python API does not automatically power every web-app action. In particular, the browser's default speech button uses device speech synthesis, while the live recognized-phrase path can use the Python MP3 service.

## Architecture

```text
                         WEB APPLICATION
 Webcam
   │
   ▼
 Teachable Machine model (TensorFlow.js)
   │ predictions
   ▼
 Stable phrase recognizer
   │ confirmed supported phrase
   ▼
 Caption ────────────────────────────────┐
   │                                     │
   ▼                                     ▼
Live speech request                 Browser speech
   │                                 (default UI path)
   ▼
TanStack server function
   │ authenticated HTTPS request
   ▼
Python phrase API
   │
   ├── Gemini cleanup (optional)
   │
   ▼
ElevenLabs text-to-speech
   │
   ▼
MP3 response → browser audio playback


                         PYTHON TOOLS
 Typed text → Gemini cleanup (optional) → ElevenLabs → output.mp3
                                      └→ Streamlit Voice Studio
```

## Repository layout

```text
SignWave/
├── backend/
│   ├── phrase_api.py              # HTTP API for recognized phrases
│   ├── language_processing.py     # Optional Gemini English cleanup
│   ├── speech.py                  # ElevenLabs audio generation
│   ├── main.py                    # Interactive text-to-speech CLI
│   ├── voice_studio.py            # Streamlit voice settings and preview tool
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/recognition-model/  # Teachable Machine model files
│   ├── src/components/           # Camera, studio, controls, and UI
│   ├── src/hooks/                # Communication and live speech flows
│   ├── src/lib/                  # Recognition, speech, and server functions
│   ├── src/routes/               # TanStack Start routes
│   └── package.json
│
└── README.md
```

## Requirements

- Windows, macOS, or Linux
- Git
- **Python 3.10+** (use a version supported by the installed dependencies)
- **Node.js and npm** for the frontend
- A webcam for live recognition
- An ElevenLabs API key for Python-generated speech
- A Gemini API key for optional backend text cleanup
- Base44 CLI/account access for the Base44-linked frontend workflow

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/timothydomingo/SignWave.git
cd SignWave
```

### 2. Set up the Python backend

From the repository root:

**Windows PowerShell**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and add the keys for the services you intend to use:

```dotenv
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GEMINI_API_KEY=your_gemini_api_key
```

- `ELEVENLABS_API_KEY` is required for ElevenLabs speech generation.
- `GEMINI_API_KEY` is optional. If it is missing or Gemini cleanup fails, the backend uses the original input text.
- `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, and `GEMINI_MODEL` can optionally override defaults. See `backend/.env.example`.

Run the interactive text-to-speech CLI:

```bash
python main.py
```

Choose a voice explicitly if desired:

```bash
python main.py --voice female
```

The CLI saves generated audio as `output.mp3` in the current working directory.

### 3. Run the Python phrase API (optional)

Keep the terminal in `backend/` and run:

```bash
python phrase_api.py
```

By default, the service listens on:

```text
http://127.0.0.1:8787
```

Available endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check whether the service is running |
| `POST` | `/api/phrases` | Generate speech for a recognized phrase |
| `OPTIONS` | `/api/phrases` | Browser CORS preflight |

Example request:

```http
POST /api/phrases
Content-Type: application/json

{
  "text": "hello world",
  "voice": "female"
}
```

The `voice` field is optional and accepts `male` or `female`. The response contains:

- `text`: the final caption text sent to speech
- `cleanupApplied`: whether Gemini cleanup succeeded
- `audioBase64`: MP3 audio encoded as Base64
- `mimeType`: `audio/mpeg`

The API accepts text up to 200 characters. The browser recognizer currently emits only its supported phrases, but the API can accept other short text values.

For local browser development, set the exact frontend origin in the backend `.env`, for example:

```dotenv
SIGNWAVE_FRONTEND_ORIGIN=http://localhost:5173
```

Then enable the local speech path in the frontend's development environment:

```dotenv
VITE_SIGNWAVE_LOCAL_SPEECH=true
```

Restart both development servers after changing environment variables. The local speech option is development-only and calls `http://127.0.0.1:8787/api/phrases`.

**Deployment security:** Do not expose the Python speech service publicly without HTTPS and authentication. When binding it to a non-localhost interface, configure `SIGNWAVE_SPEECH_TOKEN`. The hosted frontend expects `SIGNWAVE_SPEECH_URL` and `SIGNWAVE_SPEECH_TOKEN` to be stored as Base44 server secrets. Use an HTTPS endpoint; never put API keys or the speech token in frontend code.

### 4. Run the web frontend

Open a second terminal:

```bash
cd frontend
npm ci
```

For a Base44-linked development environment, authenticate and link the project:

```bash
base44 login
base44 link
base44 dev
```

Build the frontend:

```bash
npm run build
```

Other available scripts:

```bash
npm run lint
npm run preview
```

The frontend uses React 19, TanStack Start/Router, Vite, and the Base44 Vite plugin. Follow the team's Base44 project setup if the CLI asks you to select or link an application.

### 5. Test live recognition

1. Open the running web app in a browser that supports webcam access.
2. Allow camera permission.
3. Wait for the live recognition status to appear.
4. Present the supported signs in the trained model's expected conditions.
5. The recognizer requires a high-confidence prediction, a margin over the runner-up class, and a stable sequence before accepting a label.
6. The current phrase map recognizes these sequences:
   - `hello` → `world` = **hello world**
   - `this is` → `test` = **this is test**
7. Check the caption first, then verify speech output.

The model files must remain together in `frontend/public/recognition-model/` (including `model.json`, `metadata.json`, and the referenced weight file).

## Python Voice Studio

The backend includes a Streamlit tool for previewing voice settings:

```bash
cd backend
python -m streamlit run voice_studio.py
```

The tool can preview the configured ElevenLabs voice, adjust supported voice settings for the selected model, and save local preferences to `voice_settings.local.json`. That file is intentionally ignored by Git.

## Team integration contract

The frontend's live recognizer currently emits finalized phrase strings. If the recognition vocabulary or event interface changes, coordinate the change across:

- `frontend/src/lib/phrase-recognition.mjs` — supported labels, phrase mapping, and confidence/stability thresholds
- `frontend/src/hooks/useCommunicationSession.js` — routes confirmed phrases into the live speech queue
- `frontend/src/hooks/useLivePhraseSpeech.js` — serializes speech requests and audio playback
- `frontend/src/lib/server-fns.js` — validates the supported live phrases and calls the hosted speech API
- `backend/phrase_api.py` — validates requests and returns caption/audio data

The server function currently validates `hello world` and `this is test`. Add a phrase to both the recognizer and server-function validation before expecting it to work through hosted live speech.

Keep recognition and audio generation decoupled: the camera loop should not wait for an audio request to finish. Queue confirmed phrases, avoid duplicate triggers, and keep the caption visible if speech generation fails.

## Safety, privacy, and responsible use

- Camera access is requested by the browser and can be stopped by the user.
- The camera stream is used for in-browser model prediction; do not assume that this means the whole application has been independently privacy-audited.
- Do not commit `.env`, API keys, access tokens, local virtual environments, generated audio, or personal files.
- Keep secrets on the server. Use Base44 Secrets for hosted speech credentials.
- Do not treat model confidence as proof that a sign was understood correctly.
- Do not describe the project as a full ASL translator. Clearly communicate the limited supported vocabulary and provide a way to correct or confirm recognized text.
- Test with varied lighting, backgrounds, signing speeds, camera positions, and users before making performance claims.

## Troubleshooting

| Issue | What to check |
|---|---|
| Camera does not start | Allow camera permission, use a supported browser, and check that another application is not occupying the camera. |
| Recognition model does not load | Confirm the files exist in `frontend/public/recognition-model/` and that the app is being served from the frontend project. |
| No phrase is detected | Use only trained labels and supported sequences; check lighting, framing, background, and model confidence. |
| Python package import fails | Install dependencies with the Python interpreter from the project's `.venv` and rerun `pip install -r requirements.txt`. |
| Gemini cleanup is skipped | Confirm `GEMINI_API_KEY` is set in `backend/.env`; the backend will fall back to the original text if cleanup fails. |
| ElevenLabs speech fails | Check `ELEVENLABS_API_KEY`, account quota, network access, and configured model/voice settings. |
| Local frontend speech request fails | Start `phrase_api.py`, set `SIGNWAVE_FRONTEND_ORIGIN` to the exact frontend origin, set `VITE_SIGNWAVE_LOCAL_SPEECH=true`, and restart both servers. |
| Hosted live speech is unavailable | Confirm Base44 has `SIGNWAVE_SPEECH_URL` and `SIGNWAVE_SPEECH_TOKEN`, the URL uses HTTPS, and the Python service accepts the matching bearer token. |
| Audio is generated but not heard | Check browser audio permissions/output device and verify playback separately from the call application. |

## Contributing

1. Fetch and pull the latest changes before starting work.
2. Work in the module assigned to you and coordinate changes to shared interfaces.
3. Keep dependencies documented in `requirements.txt` or `package.json`.
4. Run the relevant frontend lint/build checks or backend tests before opening a pull request.
5. Review staged files and confirm no secrets, local settings, or generated artifacts are included.
6. Use a descriptive commit message and explain any changes to supported signs, phrases, or setup steps.

## Acknowledgments

Built for **Hack The Nest 2026**. SignWave brings together browser-based hand-gesture recognition, language processing, and speech synthesis to explore more accessible communication.

---

**Questions or setup issues?** Open an issue in this repository with the command you ran, the relevant error message, and your operating system. Never include API keys, tokens, or your `.env` file.
