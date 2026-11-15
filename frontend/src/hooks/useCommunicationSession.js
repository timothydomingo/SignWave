import { useCallback, useEffect, useRef, useState } from "react";
import { processText } from "@/lib/server-fns";
import { DEMO_SIGN_SEQUENCES } from "@/lib/demoSigns";
import { cancelSpeech, speakText, speechSupported } from "@/lib/speech";

const TOKEN_MS = 780;

export default function useCommunicationSession() {
  const [glosses, setGlosses] = useState([]);
  const [manualText, setManualText] = useState("");
  const [language, setLanguage] = useState("en");
  const [voice, setVoice] = useState("female");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoDone, setDemoDone] = useState(false);

  const queueRef = useRef([]);
  const sequenceRef = useRef(0);
  const lastSpokenRef = useRef("");
  const hasResultRef = useRef(false);

  useEffect(() => {
    hasResultRef.current = Boolean(result);
  }, [result]);

  useEffect(() => () => cancelSpeech(), []);

  const processNow = useCallback(
    async (overrides = {}) => {
      const text = (overrides.manualText ?? manualText).trim();
      const tokens = overrides.glosses ?? glosses;
      const lang = overrides.language ?? language;
      if (!text && tokens.length === 0) return null;

      setStatus("processing");
      setError("");
      try {
        const data = await processText({ data: { glosses: tokens, manualText: text, language: lang } });
        setResult(data);
        setStatus("idle");
        return data;
      } catch {
        setStatus("idle");
        setError("We couldn't process that text just now. Please try again.");
        return null;
      }
    },
    [glosses, manualText, language],
  );

  // Stream one sample sign at a time into the recognition panel.
  useEffect(() => {
    if (!demoRunning) return;
    const queue = DEMO_SIGN_SEQUENCES[sequenceRef.current % DEMO_SIGN_SEQUENCES.length];
    sequenceRef.current += 1;
    queueRef.current = [...queue];
    setGlosses([]);
    setResult(null);
    setError("");
    setManualText("");

    const id = window.setInterval(() => {
      const next = queueRef.current.shift();
      if (!next) {
        window.clearInterval(id);
        setDemoRunning(false);
        setDemoDone(true);
        return;
      }
      setGlosses((prev) => [...prev, next]);
    }, TOKEN_MS);

    return () => window.clearInterval(id);
  }, [demoRunning]);

  useEffect(() => {
    if (!demoDone) return;
    setDemoDone(false);
    processNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoDone]);

  // Re-translate what is already on screen when the language changes.
  useEffect(() => {
    if (hasResultRef.current) processNow({ language });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const toggleDemo = useCallback(() => {
    setDemoRunning((running) => {
      if (running) queueRef.current = [];
      return !running;
    });
  }, []);

  const submitManual = useCallback(async () => {
    if (!manualText.trim()) return null;
    setDemoRunning(false);
    setGlosses([]);
    return processNow({ glosses: [], manualText });
  }, [manualText, processNow]);

  const clearAll = useCallback(() => {
    setDemoRunning(false);
    queueRef.current = [];
    setGlosses([]);
    setManualText("");
    setResult(null);
    setError("");
    setStatus("idle");
    lastSpokenRef.current = "";
    cancelSpeech();
  }, []);

  const speak = useCallback(async () => {
    if (!speechSupported()) {
      setError("This browser can't play speech audio. The sentence stays on screen.");
      return;
    }
    const data = result ?? (await processNow());
    if (!data?.translated) return;

    cancelSpeech();
    lastSpokenRef.current = data.translated;
    setStatus("generating");
    speakText({
      text: data.translated,
      language: data.language,
      voice,
      onStart: () => setStatus("speaking"),
      onEnd: () => setStatus("idle"),
      onError: () => {
        setStatus("idle");
        setError("Audio couldn't play on this device.");
      },
    });
  }, [result, processNow, voice]);

  const replay = useCallback(() => {
    const text = lastSpokenRef.current || result?.translated;
    if (!text || !speechSupported()) return;
    cancelSpeech();
    setStatus("generating");
    speakText({
      text,
      language: result?.language ?? language,
      voice,
      onStart: () => setStatus("speaking"),
      onEnd: () => setStatus("idle"),
      onError: () => {
        setStatus("idle");
        setError("Audio couldn't play on this device.");
      },
    });
  }, [result, language, voice]);

  return {
    glosses,
    manualText,
    setManualText,
    language,
    setLanguage,
    voice,
    setVoice,
    status,
    result,
    error,
    demoRunning,
    toggleDemo,
    submitManual,
    processNow,
    clearAll,
    speak,
    replay,
    canSpeak: Boolean(result?.translated),
  };
}