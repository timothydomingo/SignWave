import { SlidersHorizontal } from "lucide-react";
import { Image } from "@/components/ui/image";
import { BRAND_NAME, LOGO_URL } from "@/lib/brand";

export default function StudioHeader({ onOpenPanel }) {
  return (
    <header className="shrink-0 border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Image
            src={LOGO_URL}
            alt=""
            fittingType="fit"
            className="h-7 w-7 object-contain"
          />
          <span className="text-[1.05rem] font-bold tracking-tight text-foreground">
            {BRAND_NAME}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenPanel}
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary hover:text-primary"
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
          <span className="sr-only">Settings and help</span>
        </button>
      </div>
    </header>
  );
}