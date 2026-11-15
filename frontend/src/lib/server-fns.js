import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildDemoTranslation } from "@/lib/demoTranslation.server";

// The app's only text-processing entry point.
//
// The browser never talks to a language or voice provider directly: it sends
// recognized signs (or typed text) here, and this handler is where the secure
// Gemini call will replace the demo library. API keys stay on the server.
export const processText = createServerFn({ method: "POST" })
  .validator(
    z.object({
      glosses: z.array(z.string().max(40)).max(60).optional(),
      manualText: z.string().max(500).optional(),
      language: z.enum(["en", "es", "fr"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    return buildDemoTranslation({
      glosses: data.glosses ?? [],
      manualText: data.manualText ?? "",
      language: data.language ?? "en",
    });
  });