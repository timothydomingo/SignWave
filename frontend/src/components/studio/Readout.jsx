const STATUS_TEXT = {
  idle: "Ready",
  processing: "Writing the sentence",
  generating: "Preparing audio",
  speaking: "Speaking",
};

// One line of type between the camera and the controls, held to a fixed height
// so nothing on the screen moves while someone is signing.
export default function Readout({ result, glosses, manualText, status, error }) {
  const sentence = result?.translated ?? "";
  const source = manualText.trim() || glosses.join(" ");
  const shown = sentence || source;

  return (
    <div className="flex min-h-[3.75rem] shrink-0 flex-col items-start pt-3 sm:min-h-[4.5rem] sm:pt-3.5">
      {shown ? (
        <p
          className={`line-clamp-2 text-[1.25rem] leading-[1.5] sm:text-[1.5rem] ${
            sentence ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {shown}
        </p>
      ) : null}

      {error ? (
        <p role="status" className="line-clamp-2 text-sm leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}

      <p role="status" aria-live="polite" className="sr-only">
        {STATUS_TEXT[status] ?? STATUS_TEXT.idle}
      </p>
    </div>
  );
}
