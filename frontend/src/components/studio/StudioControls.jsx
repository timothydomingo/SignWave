import { Loader2, RotateCcw, Volume2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, VOICES } from "@/lib/languages";

const triggerClass =
  "h-12 w-full rounded-lg border-input bg-background px-3.5 text-sm font-medium text-foreground shadow-none transition-colors hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary focus:ring-offset-0";

export default function StudioControls({
  language,
  onLanguageChange,
  voice,
  onVoiceChange,
  onSpeak,
  onReplay,
  canSpeak,
  status,
}) {
  const busy = status === "processing" || status === "generating";

  return (
    <div className="shrink-0 border-t border-border pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <div className="sm:w-[9.5rem]">
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger aria-label="Language" className={triggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-border shadow-lg">
                {LANGUAGES.map((item) => (
                  <SelectItem key={item.code} value={item.code} className="rounded-lg py-2">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:w-[7.5rem]">
            <Select value={voice} onValueChange={onVoiceChange}>
              <SelectTrigger aria-label="Voice" className={triggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-border shadow-lg">
                {VOICES.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="rounded-lg py-2">
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={onReplay}
            disabled={!canSpeak || busy}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-35 disabled:hover:border-input disabled:hover:text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Replay last sentence</span>
          </button>

          <button
            type="button"
            onClick={onSpeak}
            disabled={busy}
            className="flex h-12 flex-1 items-center justify-center gap-2.5 rounded-md bg-primary px-8 text-sm font-bold uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70 sm:flex-none sm:min-w-[11rem]"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            )}
            Speak
          </button>
        </div>
      </div>
    </div>
  );
}