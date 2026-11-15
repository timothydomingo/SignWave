import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, Play, Square } from "lucide-react";
import { createPhraseRecognizer } from "@/lib/phrase-recognition.mjs";
import { loadSignModel } from "@/lib/sign-model";

const PREDICTION_INTERVAL = 100;

// The camera is the screen: it takes every pixel the layout can spare. All
// chrome is icon-only so the signing space stays empty.
export default function CameraPreview({ demoRunning, onToggleDemo, onCameraStart, onPhrase }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraRequest = useRef(0);
  const phraseHandler = useRef(onPhrase);
  const [mode, setMode] = useState("off");
  const [message, setMessage] = useState("");
  const [recognitionStatus, setRecognitionStatus] = useState("");

  useEffect(() => {
    phraseHandler.current = onPhrase;
  }, [onPhrase]);

  useEffect(
    () => () => {
      cameraRequest.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  useEffect(() => {
    if (mode !== "live" || demoRunning) return;
    let stopped = false;
    let timer;
    const recognizer = createPhraseRecognizer();

    setRecognitionStatus("Loading sign recognition…");
    loadSignModel().then((model) => {
      if (stopped) return;
      setRecognitionStatus("Live recognition · English");
      const predict = async () => {
        const video = videoRef.current;
        try {
          if (video?.readyState >= 2 && video.videoWidth) {
            const predictions = await model.predict(video, true);
            if (stopped) return;
            const phrase = recognizer.push(predictions);
            if (phrase) phraseHandler.current(phrase);
          }
          if (!stopped) timer = window.setTimeout(predict, PREDICTION_INTERVAL);
        } catch {
          if (!stopped) setRecognitionStatus("Recognition stopped. Turn the camera off and on to retry.");
        }
      };
      void predict();
    }).catch(() => {
      if (!stopped) setRecognitionStatus("The sign model could not load. Turn the camera off and on to retry.");
    });

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [mode, demoRunning]);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMode("blocked");
      setMessage("This browser can't open a camera. Type the message in the panel instead.");
      return;
    }
    setMode("starting");
    setMessage("");
    onCameraStart();
    const request = ++cameraRequest.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (request !== cameraRequest.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      if (request === cameraRequest.current) setMode("live");
    } catch (error) {
      if (request !== cameraRequest.current) return;
      setMode("blocked");
      setMessage(
        error?.name === "NotAllowedError"
          ? "Camera access is blocked. Allow it in your browser, or type the message in the panel."
          : "No camera found on this device. You can type the message in the panel.",
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setMode("off");
  }

  return (
    <section
      aria-label="Camera"
      className="relative min-h-[42vh] flex-1 overflow-hidden rounded-lg border border-border bg-secondary sm:min-h-[46vh]"
    >
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label="Live camera preview"
        className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover transition-opacity duration-500 ${
          mode === "live" ? "opacity-100" : "opacity-0"
        }`}
      />

      {mode === "live" && !demoRunning && recognitionStatus && (
        <p role="status" className="absolute bottom-2.5 left-2.5 rounded-md bg-background/95 px-2.5 py-1.5 text-xs text-foreground">
          {recognitionStatus}
        </p>
      )}

      {mode !== "live" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center">
          {mode === "starting" ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary/70" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={startCamera}
              className="flex h-16 w-16 items-center justify-center rounded-md border border-primary/25 bg-background text-primary transition-colors hover:border-primary"
            >
              <Camera className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Turn on camera</span>
            </button>
          )}

          {message ? (
            <p role="status" className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {message}
            </p>
          ) : null}
        </div>
      )}

      <div className="absolute right-2.5 top-2.5 flex gap-2">
        <button
          type="button"
          onClick={onToggleDemo}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background/95 text-primary transition-colors hover:border-primary"
        >
          {demoRunning ? (
            <Square className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">{demoRunning ? "Stop sample signs" : "Play sample signs"}</span>
        </button>

        {mode === "live" && (
          <button
            type="button"
            onClick={stopCamera}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background/95 text-primary transition-colors hover:border-primary"
          >
            <CameraOff className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Turn off camera</span>
          </button>
        )}
      </div>
    </section>
  );
}
