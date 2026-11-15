import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildDemoTranslation } from "@/lib/demoTranslation.server";
import { requireUser } from "@/lib/auth-middleware";

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

export const synthesizeLivePhrase = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({
    text: z.enum(["hello world", "this is test"]),
    voice: z.enum(["female", "male"]),
  }))
  .handler(async ({ data }) => {
    const { secrets } = await import("base44:runtime");
    const endpoint = secrets.get("SIGNWAVE_SPEECH_URL");
    const token = secrets.get("SIGNWAVE_SPEECH_TOKEN");
    if (!endpoint || !token) throw new Error("Live speech is not configured.");
    const url = new URL(endpoint);
    if (url.protocol !== "https:") throw new Error("Live speech requires HTTPS.");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error("Live speech service unavailable.");
    return response.json();
  });
