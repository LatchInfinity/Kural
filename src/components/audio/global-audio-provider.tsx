"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useAudioStore } from "@/store/audio-store";
import type { AudioProvider, AudioTrack } from "@/lib/audio-engine";

interface GlobalAudioProviderProps {
  children: ReactNode;
}

const MEDIA_ERR_ABORTED = 1;
const AUDIO_PROBE_TIMEOUT_MS = 10000;
const AUDIO_READY_TIMEOUT_MS = 30000;

interface TtsReadyResponse {
  status?: string;
  audioUrl?: string;
  provider?: AudioProvider;
  contentType?: string;
  voiceName?: string;
  cache?: string;
  cacheKey?: string;
}

function providerFromValue(value: string | null | undefined): AudioProvider {
  if (value === "sarvam" || value === "elevenlabs" || value === "browser") return value;
  return "none";
}

function isSupportedAudioType(value: string | null | undefined): boolean {
  const contentType = (value || "").split(";")[0].trim().toLowerCase();
  return contentType === "audio/mpeg"
    || contentType === "audio/mp3"
    || contentType === "audio/wav"
    || contentType === "audio/x-wav"
    || contentType === "audio/wave";
}

function audioErrorDetails(audio: HTMLAudioElement): Record<string, unknown> {
  const code = audio.error?.code || 0;
  const messages: Record<number, string> = {
    1: "Media loading was aborted",
    2: "Network error while loading audio",
    3: "Audio decoding failed",
    4: "Audio source is not supported",
  };

  return {
    code,
    message: messages[code] || "Unknown audio error",
    src: audio.currentSrc || audio.src || "",
    networkState: audio.networkState,
    readyState: audio.readyState,
  };
}

function mediaErrorMessage(audio: HTMLAudioElement): string {
  const details = audioErrorDetails(audio);
  return typeof details.message === "string" ? details.message : "Audio playback failed";
}

function resolveAudioUrl(value: string | undefined): string {
  if (!value) throw new Error("Audio API did not return an audio URL");
  const rawUrl = value.trim();
  if (rawUrl.startsWith("/api/tts/audio/")) return rawUrl;

  const url = new URL(rawUrl, window.location.href);
  if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/tts/audio/")) {
    throw new Error("Audio API returned an invalid audio URL");
  }
  return url.href;
}

function abortError(): DOMException {
  return new DOMException("Audio request was aborted", "AbortError");
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

async function probeAudioUrl(audioUrl: string, signal: AbortSignal): Promise<void> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), AUDIO_PROBE_TIMEOUT_MS);
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });

  try {
    const response = await fetch(audioUrl, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type");

    console.log("[AUDIO HTTP STATUS]", {
      url: audioUrl,
      status: response.status,
      contentType,
      ok: response.ok,
    });

    if (!response.ok) {
      throw new Error(`Audio URL returned HTTP ${response.status}`);
    }
    if (!isSupportedAudioType(contentType)) {
      throw new Error(`Audio URL returned invalid content-type: ${contentType || "unknown"}`);
    }
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

async function requestTtsAudio(
  track: AudioTrack,
  narration: string,
  language: string,
  voiceGender: string,
  speed: number,
  forceRegenerate: boolean,
  signal: AbortSignal,
): Promise<TtsReadyResponse & { audioUrl: string }> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newsId: track.articleId,
      text: narration,
      language,
      gender: voiceGender,
      speed,
      forceRegenerate,
    }),
    signal,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({})) as TtsReadyResponse & { error?: string; message?: string }
    : {} as TtsReadyResponse & { error?: string; message?: string };

  console.log("[AUDIO API RESPONSE]", {
    status: response.status,
    ok: response.ok,
    audioStatus: data.status || "error",
    cache: data.cache || null,
    cacheKey: data.cacheKey || null,
    contentType: data.contentType || contentType || null,
    forceRegenerate,
  });

  if (!response.ok) {
    throw new Error(data.error || data.message || response.statusText || "Audio request failed");
  }
  if (data.status !== "ready") {
    throw new Error(`Audio API returned status=${data.status || "unknown"}`);
  }

  const audioUrl = resolveAudioUrl(data.audioUrl);
  if (!isSupportedAudioType(data.contentType)) {
    throw new Error(`Audio API returned invalid content-type: ${data.contentType || "unknown"}`);
  }

  console.log("[AUDIO URL]", {
    url: audioUrl,
    cacheKey: data.cacheKey || null,
    provider: data.provider || "none",
  });

  return {
    ...data,
    audioUrl,
  };
}

function waitForAudioCanPlay(audio: HTMLAudioElement, signal: AbortSignal): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Audio timed out before it could play"));
    }, AUDIO_READY_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      signal.removeEventListener("abort", handleAbort);
    };
    const handleCanPlay = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error(mediaErrorMessage(audio)));
    };
    const handleAbort = () => {
      cleanup();
      reject(abortError());
    };

    audio.addEventListener("canplay", handleCanPlay, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

export default function GlobalAudioProvider({ children }: GlobalAudioProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
    const logLoaded = (event: string) => {
      console.log("[AUDIO LOADED]", {
        event,
        url: audio.currentSrc || audio.src || "",
        duration: Number.isFinite(audio.duration) ? audio.duration : null,
        readyState: audio.readyState,
        networkState: audio.networkState,
      });
    };
    const resumeIfUnexpectedlyPaused = () => {
      const state = useAudioStore.getState();
      if (!state.isPlaying || state.isLoading || !audio.src || audio.ended) return;

      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (duration > 0 && audio.currentTime >= duration - 0.35) return;

      void audio.play().catch(() => undefined);
    };
    const handleReady = () => {
      logLoaded("canplay");
      useAudioStore.getState().setAudioLoading(false);
      handleProgress();
    };
    const handleLoadedMetadata = () => {
      logLoaded("loadedmetadata");
      handleProgress();
    };
    const handlePlaying = () => {
      console.log("[AUDIO PLAYING]", {
        url: audio.currentSrc || audio.src || "",
        currentTime: audio.currentTime || 0,
        duration: Number.isFinite(audio.duration) ? audio.duration : null,
      });
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
      console.error("[AUDIO ERROR]", audioErrorDetails(audio));
      useAudioStore.getState().setError("Audio playback failed. Please try again.");
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleProgress);
    audio.addEventListener("timeupdate", handleProgress);
    audio.addEventListener("canplay", handleReady);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", resumeIfUnexpectedlyPaused);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleProgress);
      audio.removeEventListener("timeupdate", handleProgress);
      audio.removeEventListener("canplay", handleReady);
      audio.removeEventListener("playing", handlePlaying);
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
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    const loadAudio = async () => {
      setAudioLoading(true);
      setError(null);

      try {
        const narration = language === "ta"
          ? await createTamilNarration(currentTrack, controller.signal)
          : (currentTrack.script || currentTrack.articleText || currentTrack.title).trim();

        if (controller.signal.aborted) return;

        let lastError: unknown = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const forceRegenerate = attempt === 1;
          try {
            console.log("[AUDIO START]", {
              articleId: currentTrack.articleId,
              attempt: attempt + 1,
              forceRegenerate,
            });

            const ready = await requestTtsAudio(
              currentTrack,
              narration,
              language,
              voiceGender,
              speed,
              forceRegenerate,
              controller.signal,
            );

            await probeAudioUrl(ready.audioUrl, controller.signal);
            if (controller.signal.aborted) return;

            console.log("[AUDIO URL]", {
              url: ready.audioUrl,
              attempt: attempt + 1,
            });

            audio.preload = "auto";
            audio.src = ready.audioUrl;
            audio.load();
            await waitForAudioCanPlay(audio, controller.signal);
            if (controller.signal.aborted) return;

            const provider = providerFromValue(ready.provider);
            const notice = ready.voiceName ? `Voice: ${ready.voiceName}` : null;
            setAudioReady(ready.audioUrl, narration, provider, notice);

            if (useAudioStore.getState().isPlaying) {
              try {
                await audio.play();
              } catch (err) {
                const name = err instanceof DOMException ? err.name : "";
                if (name === "NotAllowedError") {
                  setError("Tap play to start audio.");
                  return;
                }
                throw err;
              }
            }

            return;
          } catch (err) {
            if (controller.signal.aborted) return;
            lastError = err;
            console.error("[AUDIO ERROR]", {
              articleId: currentTrack.articleId,
              attempt: attempt + 1,
              retrying: attempt === 0,
              message: err instanceof Error ? err.message : String(err),
            });
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
          }
        }

        throw lastError instanceof Error ? lastError : new Error("Unable to generate audio.");
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

    console.log("[AUDIO START]", {
      action: "resume",
      url: audioUrl,
    });
    console.log("[AUDIO URL]", {
      url: audioUrl,
    });
    void audio.play().catch((err) => {
      const name = err instanceof DOMException ? err.name : "";
      console.error("[AUDIO ERROR]", {
        action: "resume",
        url: audioUrl,
        message: err instanceof Error ? err.message : String(err),
      });
      setError(name === "NotAllowedError" ? "Tap play to start audio." : "Audio playback could not start.");
    });
  }, [audioUrl, currentTrack, isPlaying, setAudioLoading, setError]);

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  return (
    <>
      {children}
      <audio ref={audioRef} preload="auto" aria-hidden="true" />
    </>
  );
}
