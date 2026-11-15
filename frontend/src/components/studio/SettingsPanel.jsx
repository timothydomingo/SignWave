import * as Dialog from "@radix-ui/react-dialog";
import { Play, Square, Trash2, X } from "lucide-react";
import ManualInput from "@/components/communicate/ManualInput";

const actionClass =
  "inline-flex min-h-10 items-center gap-2 rounded-md border border-input px-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-35 disabled:hover:border-input disabled:hover:text-foreground";

// Everything wordy lives here: help, sample signs, typing, reset, about.
export default function SettingsPanel({
  open,
  onOpenChange,
  demoRunning,
  onToggleDemo,
  onClear,
  canClear,
  manualText,
  onManualChange,
  onManualSubmit,
  busy,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-primary/20 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[24rem] flex-col overflow-y-auto border-l border-border bg-background px-6 py-6 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-sm font-bold uppercase tracking-[0.24em] text-foreground">
              Settings
            </Dialog.Title>
            <Dialog.Close className="-mr-2 inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
            <Dialog.Description className="sr-only">
              Help, sample signs, typing and reset.
            </Dialog.Description>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Point the camera at the person signing. The sentence appears under the camera and your
            device speaks it.
          </p>

          <div className="mt-7 space-y-7">
            <section className="border-t border-border pt-5">
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-foreground">
                Sample signs
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Live recognition is simulated in this build.
              </p>
              <button type="button" onClick={onToggleDemo} className={`mt-3 ${actionClass}`}>
                {demoRunning ? (
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {demoRunning ? "Stop" : "Play"}
              </button>
            </section>

            <section className="border-t border-border pt-5">
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-foreground">
                Type instead
              </h3>
              <div className="mt-3">
                <ManualInput
                  value={manualText}
                  onChange={onManualChange}
                  onSubmit={onManualSubmit}
                  disabled={busy}
                />
              </div>
            </section>

            <section className="border-t border-border pt-5">
              <button type="button" onClick={onClear} disabled={!canClear} className={actionClass}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear conversation
              </button>
            </section>

            <section className="border-t border-border pt-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                SignWave — Giving Every Sign a Voice. Nothing is recorded; speech uses your device&rsquo;s
                voice.
              </p>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}