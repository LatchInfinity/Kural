"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useAudioStore } from "@/store/audio-store";
import type { AudioProvider, AudioTrack } from "@/lib/audio-engine";

interface GlobalAudioProviderProps {
  children: ReactNode;
}

const MEDIA_ERR_ABORTED = 1;

function providerFromHeader(value: string | null): AudioProvider {
  if (value === "sarvam" || value === "elevenlabs" || value === "browser") return value;
  return "none";
}

async function responseError(response: Response): Promise<string> {
  try {
    const json = await response.json() as { error?: string; message?: string };
    return json.error || json.message || response.statusText;
  } catch {
    return response.statusText || "Audio request failed";
  }
}

async function createTamilNarration(track: AudioTrack, signal: AbortSignal): Promise<string> {
  const response = await fetch("/api/tts/narration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: track.title,
      summary: track.tamilSummary || track.englishSummary || track.script,
      content: track.articleText || track.content || track.script,
      category: track.category || "",
      source: track.source || "",
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await responseError(response));
  }

  const data = await response.json() as { narration?: string };
  return (data.narration || track.script).trim();
}

export default function GlobalAudioProvider({ children }: GlobalAudioProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string>("");

  const currentTrack = useAudioStore((s) => s.currentTrack);
  const language = useAudioStore((s) => s.language);
  const voiceGender = useAudioStore((s) => s.voiceGender);
  const speed = useAudioStore((s) => s.speed);
  const volume = useAudioStore((s) => s.volume);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const audioUrl = useAudioStore((s) => s.audioUrl);
  const requestedSeek = useAudioStore((s) => s.requestedSeek);
  const setAudioLoading = useAudioStore((s) => s.setAudioLoading);
  const setAudioReady = useAudioStore((s) => s.setAudioReady);
  const setError = useAudioStore((s) => s.setError);
  const updateProgress = useAudioStore((s) => s.updateProgress);
  const clearRequestedSeek = useAudioStore((s) => s.clearRequestedSeek);

  const trackKey = useMemo(() => {
    if (!currentTrack) return "";
    return [
      currentTrack.articleId,
      currentTrack.title,
      language,
      voiceGender,
      speed,
    ].join("|");
  }, [currentTrack, language, speed, voiceGender]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleProgress = () => updateProgress(audio.currentTime || 0, audio.duration || 0);
    const resumeIfUnexpectedlyPaused = () => {
      const state = useAudioStore.getState();
      if (!state.isPlaying || state.isLoading || !audio.src || audio.ended) return;

      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (duration > 0 && audio.currentTime >= duration - 0.35) return;

      void audio.play().catch(() => undefined);
    };
    const handleReady = () => {
      useAudioStore.getState().setAudioLoading(false);
      handleProgress();
    };
    const handleEnded = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (duration > 0 && audio.currentTime < duration - 0.5 && useAudioStore.getState().isPlaying) {
        resumeIfUnexpectedlyPaused();
        return;
      }

      handleProgress();
      const state = useAudioStore.getState();
      if (state.currentIndex < state.queue.length - 1) {
        state.next();
      } else {
        state.finishTrack();
      }
    };
    const handleError = () => {
      if (!audio.src) return;
      if (audio.error?.code === MEDIA_ERR_ABORTED) return;
      useAudioStore.getState().setError("Audio playback failed. Please try again.");
    };

    audio.addEventListener("loadedmetadata", handleProgress);
    audio.addEventListener("durationchange", handleProgress);
    audio.addEventListener("timeupdate", handleProgress);
    audio.addEventListener("canplay", handleReady);
    audio.addEventListener("playing", handleReady);
    audio.addEventListener("pause", resumeIfUnexpectedlyPaused);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleProgress);
      audio.removeEventListener("durationchange", handleProgress);
      audio.removeEventListener("timeupdate", handleProgress);
      audio.removeEventListener("canplay", handleReady);
      audio.removeEventListener("playing", handleReady);
      audio.removeEventListener("pause", resumeIfUnexpectedlyPaused);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [updateProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || requestedSeek === null) return;

    const target = Math.max(0, Math.min(requestedSeek, Number.isFinite(audio.duration) ? audio.duration : requestedSeek));
    audio.currentTime = target;
    updateProgress(target, audio.duration || undefined);
    clearRequestedSeek();
  }, [clearRequestedSeek, requestedSeek, updateProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    abortRef.current?.abort();

    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    const loadAudio = async () => {
      setAudioLoading(true);
      setError(null);

      try {
        const narration = language === "ta"
          ? await createTamilNarration(currentTrack, controller.signal)
          : (currentTrack.script || currentTrack.articleText || currentTrack.title).trim();

        if (controller.signal.aborted) return;

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newsId: currentTrack.articleId,
            text: narration,
            language,
            gender: voiceGender,
            speed,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(await responseError(response));
        }

        const blob = await response.blob();
        if (controller.signal.aborted) return;

        const nextUrl = URL.createObjectURL(blob);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = nextUrl;
        audio.preload = "auto";
        audio.src = nextUrl;
        audio.load();

        const provider = providerFromHeader(response.headers.get("X-Kural-TTS"));
        const voiceName = response.headers.get("X-Kural-Voice-Name");
        const notice = voiceName ? `Voice: ${voiceName}` : null;
        setAudioReady(nextUrl, narration, provider, notice);

        if (useAudioStore.getState().isPlaying) {
          try {
            await audio.play();
          } catch (err) {
            if (!controller.signal.aborted) {
              const name = err instanceof DOMException ? err.name : "";
              setError(name === "NotAllowedError" ? "Tap play to start audio." : "Audio playback could not start.");
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to generate audio.");
      }
    };

    void loadAudio();

    return () => controller.abort();
  }, [currentTrack, language, setAudioLoading, setAudioReady, setError, speed, trackKey, voiceGender]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }

    if (!audioUrl) {
      setAudioLoading(true);
      return;
    }

    void audio.play().catch((err) => {
      const name = err instanceof DOMException ? err.name : "";
      setError(name === "NotAllowedError" ? "Tap play to start audio." : "Audio playback could not start.");
    });
  }, [audioUrl, currentTrack, isPlaying, setAudioLoading, setError]);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  return (
    <>
      {children}
      <audio ref={audioRef} preload="auto" aria-hidden="true" />
    </>
  );
}
