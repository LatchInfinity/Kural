"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Maximize2 } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";

export default function MiniAudioController() {
  const activeNav = useAppStore((s) => s.activeNav);
  const currentItem = useAudioStore((s) => s.currentTrack);
  const isPopupOpen = useAudioStore((s) => s.isPopupOpen);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const pauseAudio = useAudioStore((s) => s.pause);
  const playAudio = useAudioStore((s) => s.play);
  const nextAudio = useAudioStore((s) => s.next);
  const prevAudio = useAudioStore((s) => s.prev);
  const setPopupOpen = useAudioStore((s) => s.setPopupOpen);

  const isAudioActive = isPlaying || isLoading || Boolean(currentItem);

  const visible = !isPopupOpen && activeNav === "audio-news" && isAudioActive && !!currentItem;

  const handleExpand = () => {
    setPopupOpen(true);
  };

  const togglePlay = () => {
    if (isPlaying) pauseAudio();
    else playAudio();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-4 right-4 z-[200]"
        >
          <div className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-md bg-surface border border-border shadow-md">
            <div className="min-w-0 max-w-[160px]">
              <p className="text-[11px] font-semibold leading-tight truncate text-foreground">
                {currentItem.title}
              </p>
              <p className="text-[8px] text-foreground-secondary/60 mt-0.5">
                {isLoading ? "Loading..." : isPlaying ? "Now Playing" : "Paused"}
              </p>
            </div>

            <div className="flex items-center gap-0.5">
              <button onClick={(e) => { e.stopPropagation(); prevAudio(); }}
                className="p-1 rounded-sm text-foreground-secondary/50 hover:text-foreground transition-colors cursor-pointer"
                aria-label="Previous article">
                <SkipBack size={12} />
              </button>

              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="p-1.5 rounded-sm bg-accent text-white hover:bg-accent-soft transition-colors cursor-pointer"
                aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" />}
              </button>

              <button onClick={(e) => { e.stopPropagation(); nextAudio(); }}
                className="p-1 rounded-sm text-foreground-secondary/50 hover:text-foreground transition-colors cursor-pointer"
                aria-label="Next article">
                <SkipForward size={12} />
              </button>

              <div className="w-px h-5 bg-border-light mx-1" />

              <button onClick={(e) => { e.stopPropagation(); handleExpand(); }}
                className="p-1 rounded-sm text-foreground-secondary/50 hover:text-accent transition-colors cursor-pointer"
                aria-label="Expand full player">
                <Maximize2 size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
