import { useState } from "react";
import { ArrowRight, Keyboard } from "lucide-react";

export default function ManualInput({ value, onChange, onSubmit, disabled }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
      >
        <Keyboard className="h-4 w-4" aria-hidden="true" />
        Type instead of signing
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-md border border-border bg-card px-4 pb-3 pt-4"
    >
      <label
        htmlFor="manual-text"
        className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
      >
        Type the message
      </label>
      <textarea
        id="manual-text"
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        maxLength={280}
        placeholder="For example: Can you show me where the elevator is?"
        className="mt-2 w-full resize-none border-0 border-b border-input bg-transparent pb-2 text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-10 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Close
        </button>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          Use this text
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}