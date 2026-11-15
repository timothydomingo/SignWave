import { createFileRoute } from "@tanstack/react-router";
import Studio from "@/components/studio/Studio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SignWave — Giving Every Sign a Voice" },
      {
        name: "description",
        content:
          "SignWave turns sign language into clear text and spoken words, so a Deaf signer and a hearing person can talk face to face.",
      },
    ],
  }),
  component: Studio,
});