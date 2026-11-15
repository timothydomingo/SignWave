import { useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { BRAND_NAME, LOGO_URL, TAGLINE } from "@/lib/brand";

const DURATION_MS = 3500;

const WAVE_BACK =
  "M0 150C210 60 360 235 575 195C790 155 930 40 1145 95C1290 132 1370 180 1440 140V900H0Z";
const WAVE_FRONT =
  "M0 205C190 120 350 285 560 235C780 182 900 80 1125 130C1290 166 1360 200 1440 165V900H0Z";

export default function SplashIntro({ onComplete }) {
  const [playing, setPlaying] = useState(true);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
      completeRef.current?.();
      return;
    }

    // Plays on every page load — nothing is stored to skip it.
    const id = window.setTimeout(() => {
      setPlaying(false);
      completeRef.current?.();
    }, DURATION_MS);

    return () => window.clearTimeout(id);
  }, []);

  if (!playing) return null;

  return (
    <div aria-hidden="true" className="sw-splash fixed inset-0 z-[60] overflow-hidden bg-background">
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="flex flex-col items-center text-center">
          <Image
            src={LOGO_URL}
            alt=""
            fittingType="fit"
            className="sw-splash-logo h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
          <span className="sw-splash-title mt-7 text-[1.75rem] font-bold tracking-tight text-foreground sm:text-[2rem]">
            {BRAND_NAME}
          </span>
          <span className="sw-splash-tagline mt-2.5 text-sm text-muted-foreground sm:text-base">
            {TAGLINE}
          </span>
        </div>
      </div>

      <div className="sw-splash-wave sw-splash-wave--late absolute inset-x-0 bottom-0 h-full opacity-50">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" className="h-full w-full" focusable="false">
          <path className="fill-primary" d={WAVE_BACK} />
        </svg>
      </div>

      <div className="sw-splash-wave absolute inset-x-0 bottom-0 h-full">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" className="h-full w-full" focusable="false">
          <path className="fill-primary" d={WAVE_FRONT} />
        </svg>
      </div>
    </div>
  );
}