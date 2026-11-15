"""Local HTTP bridge from recognized phrases to Gemini and ElevenLabs."""

import base64
import hmac
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_BODY = 4096
MAX_TEXT = 200


def render_phrase(payload, clean, audio_chunks):
    """Validate one recognized phrase and return its caption and MP3."""
    if not isinstance(payload, dict):
        raise ValueError("Send a JSON object with a text field.")
    text = payload.get("text")
    voice = payload.get("voice")
    if not isinstance(text, str) or not text.strip() or len(text.strip()) > MAX_TEXT:
        raise ValueError("Text must contain 1 to 200 characters.")
    if voice is not None and voice not in ("male", "female"):
        raise ValueError("Voice must be male or female.")
    text = text.strip()
    caption, _, cleanup_applied = clean(text)
    audio = b"".join(audio_chunks(caption, voice=voice))
    if not audio:
        raise RuntimeError("Speech returned no audio.")
    return {
        "text": caption,
        "cleanupApplied": cleanup_applied,
        "audioBase64": base64.b64encode(audio).decode("ascii"),
        "mimeType": "audio/mpeg",
    }


def build_handler(clean, audio_chunks, allowed_origin=None, api_token=None):
    class Handler(BaseHTTPRequestHandler):
        def reply(self, status, payload):
            body = b"" if payload is None else json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Vary", "Origin")
            if allowed_origin and self.headers.get("Origin") == allowed_origin:
                self.send_header("Access-Control-Allow-Origin", allowed_origin)
            if status == 204:
                self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self):
            if self.path != "/api/phrases":
                return self.reply(404, {"error": "Route not found."})
            if not allowed_origin or self.headers.get("Origin") != allowed_origin:
                return self.reply(403, {"error": "This browser origin is not allowed."})
            self.reply(204, None)

        def do_GET(self):
            if self.path == "/health":
                return self.reply(200, {"ok": True})
            self.reply(404, {"error": "Route not found."})

        def do_POST(self):
            if self.path != "/api/phrases":
                return self.reply(404, {"error": "Route not found."})
            if api_token and not hmac.compare_digest(
                self.headers.get("Authorization", "").encode("utf-8"),
                f"Bearer {api_token}".encode("utf-8"),
            ):
                return self.reply(401, {"error": "Unauthorized."})
            origin = self.headers.get("Origin")
            if origin and origin != allowed_origin:
                return self.reply(403, {"error": "This browser origin is not allowed."})
            if self.headers.get_content_type() != "application/json":
                return self.reply(415, {"error": "Use application/json."})
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                return self.reply(400, {"error": "Invalid request length."})
            if not 0 < length <= MAX_BODY:
                return self.reply(413, {"error": "Use a short JSON body."})
            try:
                payload = json.loads(self.rfile.read(length))
            except (ValueError, UnicodeDecodeError):
                return self.reply(400, {"error": "Invalid JSON."})
            try:
                result = render_phrase(payload, clean, audio_chunks)
            except ValueError as exc:
                return self.reply(400, {"error": str(exc)})
            except Exception:
                return self.reply(502, {"error": "Speech generation failed. Check backend configuration and quota."})
            self.reply(200, result)

    return Handler


if __name__ == "__main__":
    from dotenv import load_dotenv
    from language_processing import clean_text_with_details
    from speech import iter_speech_audio

    load_dotenv()
    host = os.getenv("SIGNWAVE_API_HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8787"))
    api_token = os.getenv("SIGNWAVE_SPEECH_TOKEN")
    if host not in ("127.0.0.1", "localhost") and not api_token:
        raise SystemExit("Configure SIGNWAVE_SPEECH_TOKEN before exposing the speech server.")
    handler = build_handler(
        clean_text_with_details, iter_speech_audio, os.getenv("SIGNWAVE_FRONTEND_ORIGIN"), api_token
    )
    with ThreadingHTTPServer((host, port), handler) as server:
        print(f"SignWave API at http://{host}:{port}", flush=True)
        server.serve_forever()
