"use client";

import { useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import SafeImage from "@/components/safe-image";
import { useAudioStore } from "@/store/audio-store";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function NewspaperMiniPlayer() {
  const track = useAudioStore((s) => s.currentTrack);
  const title = useAudioStore((s) => s.title);
  const thumbnail = useAudioStore((s) => s.thumbnail);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const isPopupOpen = useAudioStore((s) => s.isPopupOpen);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const progress = useAudioStore((s) => s.progress);
  const toggle = useAudioStore((s) => s.toggle);
  const replay = useAudioStore((s) => s.replay);
  const setPopupOpen = useAudioStore((s) => s.setPopupOpen);

  const openPopup = useCallback(() => setPopupOpen(true), [setPopupOpen]);

  if (!track) return null;

  return (
    <AnimatePresence>
      {!isPopupOpen && (
        <motion.div
          role="button"
          tabIndex={0}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={openPopup}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPopup();
            }
          }}
          className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl items-center gap-3 rounded-lg border border-slate-200/20 bg-slate-950/92 p-2.5 text-left text-white shadow-2xl shadow-black/35 backdrop-blur-xl sm:bottom-5 sm:p-3"
          aria-label="Open audio player"
        >
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white/10 sm:h-14 sm:w-14">
            <SafeImage
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-5">{title}</span>
            <span className="mt-1 flex items-center gap-2 text-[11px] tabular-nums text-white/55">
              <span>{isLoading ? "Loading" : isPlaying ? "Playing" : "Paused"}</span>
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </span>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-teal-400" style={{ width: `${progress}%` }} />
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                replay();
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/75"
              aria-label="Replay audio"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggle();
              }}
              className="grid h-11 w-11 place-items-center rounded-full bg-teal-400 text-slate-950"
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-slate-950/25 border-t-slate-950 animate-spin" />
              ) : isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" />
              )}
            </button>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
