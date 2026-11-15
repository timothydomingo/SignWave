import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, Play, Square } from "lucide-react";

// The camera is the screen: it takes every pixel the layout can spare. All
// chrome is icon-only so the signing space stays empty.
export default function CameraPreview({ demoRunning, onToggleDemo }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [mode, setMode] = useState("off");
  const [message, setMessage] = useState("");

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMode("blocked");
      setMessage("This browser can't open a camera. Type the message in the panel instead.");
      return;
    }
    setMode("starting");
    setMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setMode("live");
    } catch (error) {
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