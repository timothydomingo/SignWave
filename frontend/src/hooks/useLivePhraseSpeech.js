import { useCallback, useEffect, useRef } from "react";
import { synthesizeLivePhrase } from "@/lib/server-fns";

async function requestSpeech(text, voice, signal) {
  if (import.meta.env.DEV && import.meta.env.VITE_SIGNWAVE_LOCAL_SPEECH === "true") {
    const response = await fetch("http://127.0.0.1:8787/api/phrases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
    });
    if (!response.ok) throw new Error("Local speech service unavailable.");
    return response.json();
  }
  return synthesizeLivePhrase({ data: { text, voice }, signal });
}

export default function useLivePhraseSpeech({ voice, onCaption, setStatus, setError }) {
  const audio = useRef(null);
  const player = useRef(null);
  const saved = useRef(null);
  const work = useRef(null);

  const unlock = useCallback(() => {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      audio.current ??= new AudioContext();
      if (audio.current.state === "suspended") {
        void audio.current.resume().catch(() => {});
      }
    } catch {
      return;
    }
  }, []);

  const reset = useCallback(() => {
    work.current?.controller.abort();
    work.current = null;
    saved.current = null;
    player.current?.stop();
  }, []);

  useEffect(() => () => {
    reset();
    void audio.current?.close().catch(() => {});
    audio.current = null;
  }, [reset]);

  const play = useCallback(async (buffer) => {
    const context = audio.current;
    if (!context || context.state !== "running") throw new Error("Audio is blocked.");
    if (player.current) player.current.stop();
    const source = context.createBufferSource();
    player.current = source;
    source.buffer = buffer;
    source.connect(context.destination);
    setStatus("speaking");
    try {
      await new Promise((resolve) => {
        source.onended = resolve;
        source.start();
      });
    } finally {
      source.disconnect();
      if (player.current === source) player.current = null;
    }
  }, [setStatus]);

  const enqueue = useCallback((text) => {
    work.current ??= { controller: new AbortController(), tail: Promise.resolve(), pending: 0 };
    const state = work.current;
    if (state.pending >= 4) return;
    state.pending += 1;
    const { signal } = state.controller;
    state.tail = state.tail.then(async () => {
      if (signal.aborted) return;
      saved.current = { originalText: text, buffer: null };
      onCaption(text);
      setError("");
      setStatus("generating");
      try {
        const result = await requestSpeech(text, voice, signal);
        if (signal.aborted) return;
        const caption = result.text;
        onCaption(caption);
        if (!audio.current) throw new Error("Audio is unavailable.");
        const bytes = Uint8Array.from(atob(result.audioBase64), (character) => character.charCodeAt(0));
        const buffer = await audio.current.decodeAudioData(bytes.buffer);
        if (signal.aborted) return;
        saved.current = { originalText: text, buffer };
        await play(buffer);
      } catch (error) {
        if (!signal.aborted) {
          setError(error?.code === "UNAUTHORIZED" || error?.status === 401 || error?.message === "Unauthorized"
            ? "Sign in to use the live speech service."
            : "Live speech is unavailable. Your caption is still on screen.");
        }
      } finally {
        if (!signal.aborted) setStatus("idle");
      }
    }).finally(() => {
      state.pending -= 1;
    });
  }, [onCaption, play, setError, setStatus, voice]);

  const replay = useCallback(() => {
    const state = work.current;
    const phrase = saved.current;
    if (!phrase) return false;
    if (state?.pending) return true;
    unlock();
    if (!phrase.buffer) {
      enqueue(phrase.originalText);
    } else {
      state.pending += 1;
      state.tail = state.tail.then(async () => {
        try {
          if (work.current !== state) return;
          setError("");
          await play(phrase.buffer);
        } catch {
          if (work.current === state) setError("Audio couldn't play on this device.");
        } finally {
          if (work.current === state) setStatus("idle");
          state.pending -= 1;
        }
      });
    }
    return true;
  }, [enqueue, play, setError, setStatus, unlock]);

  return { enqueue, replay, reset, unlock };
}
