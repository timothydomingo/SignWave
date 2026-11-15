import { createFileRoute } from "@tanstack/react-router";
import Studio from "@/components/studio/Studio";

export const Route = createFileRoute("/communicate")({
  head: () => ({
    meta: [
      { title: "Translator — SignWave" },
      {
        name: "description",
        content:
          "Point the camera at the person signing, read the sentence, and let SignWave speak it aloud.",
      },
    ],
  }),
  component: Studio,
});