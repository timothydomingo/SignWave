import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { BRAND_NAME, LOGO_URL } from "@/lib/brand";

export default function WelcomeDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-foreground/25 backdrop-blur-[2px]"
        className="w-[calc(100%-2rem)] max-w-[30rem] gap-0 rounded-lg border-border bg-card p-7 shadow-xl duration-300 sm:rounded-lg sm:p-9"
      >
        <Image
          src={LOGO_URL}
          alt=""
          fittingType="fit"
          className="h-12 w-12 object-contain"
        />
        <DialogTitle className="mt-6 text-2xl font-bold tracking-tight text-foreground">
          Welcome to {BRAND_NAME}
        </DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
          {BRAND_NAME} bridges the communication gap between sign language and spoken
          conversation. Using AI-powered technology, it transforms recognized signs into
          natural-sounding speech, making everyday communication more accessible.
        </DialogDescription>
        <button
          type="button"
          autoFocus
          onClick={() => onOpenChange(false)}
          className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary text-sm font-bold uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get Started
        </button>
      </DialogContent>
    </Dialog>
  );
}