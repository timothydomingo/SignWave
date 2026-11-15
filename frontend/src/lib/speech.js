// Browser speech output. This is the device's own voice, standing in for the
// studio voice service until it is connected on the server. Nothing here calls
// an external API or holds a key.

const FEMALE_HINTS =
  /female|samantha|victoria|karen|moira|tessa|amelie|amélie|audrey|zira|susan|fiona|sara|monica|paulina|helena/i;
const MALE_HINTS =
  /male|daniel|alex|david|fred|george|thomas|jorge|diego|guy|oliver|juan|pablo|thierry/i;

const LANG_TAGS = { en: "en-US", es: "es-ES", fr: "fr-FR" };

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function cancelSpeech() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

function pickVoice(voices, language, gender) {
  const prefix = (LANG_TAGS[language] ?? "en-US").slice(0, 2);
  const matching = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(prefix));
  const pool = matching.length ? matching : voices;
  const hints = gender === "male" ? MALE_HINTS : FEMALE_HINTS;
  return pool.find((voice) => hints.test(voice.name)) ?? pool[0] ?? null;
}

export function speakText({ text, language = "en", voice = "female", onStart, onEnd, onError }) {
  if (!speechSupported() || !text) {
    onError?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_TAGS[language] ?? "en-US";
  utterance.rate = 0.95;

  const gender = voice === "male" ? "male" : "female";
  utterance.pitch = gender === "male" ? 0.85 : 1.05;

  const selected = pickVoice(window.speechSynthesis.getVoices(), language, gender);
  if (selected) utterance.voice = selected;

  let finished = false;
  let started = false;
  let fallbackId;

  const startOnce = () => {
    if (started || finished) return;
    started = true;
    onStart?.();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallbackId);
    onEnd?.();
  };

  const fail = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallbackId);
    onError?.();
  };

  utterance.onstart = startOnce;
  utterance.onend = finish;
  utterance.onerror = fail;

  // Short "generating audio" beat so the status reads clearly before playback.
  window.setTimeout(() => {
    // Some browsers never fire `onend`; release the status once speech should be done.
    fallbackId = window.setTimeout(finish, Math.max(3000, text.length * 110));
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      fail();
      return;
    }
    if (window.speechSynthesis.pending || window.speechSynthesis.speaking) startOnce();
  }, 320);
}