// Pass the array returned by model.predict() to push() on each webcam frame.
const PHRASES = new Map([
  ["hello|world", "hello world"],
  ["this is|test", "this is test"],
]);
const FIRST_LABELS = new Set(["hello", "this is"]);

export function createPhraseRecognizer({
  threshold = 0.9, margin = 0.2, holdMs = 350, releaseMs = 250, maxGapMs = 4000,
} = {}) {
  let candidate;
  let candidateSince;
  let frames = 0;
  let accepted;
  let quietSince;
  let first;
  let firstAt;

  return {
    push(predictions, now = performance.now()) {
      const [best, runnerUp] = [...predictions].sort((a, b) => b.probability - a.probability);
      const label = best?.probability >= threshold && best.probability - (runnerUp?.probability ?? 0) >= margin
        ? best.className.trim().toLowerCase()
        : undefined;

      if (first && now - firstAt > maxGapMs) first = undefined;
      if (!label || label === "no sign") {
        quietSince ??= now;
        if (now - quietSince >= releaseMs) accepted = undefined;
        candidate = undefined;
        frames = 0;
        return null;
      }

      quietSince = undefined;
      if (label !== candidate) {
        candidate = label;
        candidateSince = now;
        frames = 0;
      }
      frames += 1;
      if (label === accepted || frames < 3 || now - candidateSince < holdMs) return null;

      accepted = label;
      const phrase = first ? PHRASES.get(`${first}|${label}`) : undefined;
      first = FIRST_LABELS.has(label) ? label : undefined;
      firstAt = now;
      return phrase ?? null;
    },
  };
}
