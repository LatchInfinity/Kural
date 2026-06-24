"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import SafeImage from "@/components/safe-image";

export default function NowPlaying() {
  const isNewspaperAudioMode = useAppStore((s) => s.isNewspaperAudioMode);
  const activeNav = useAppStore((s) => s.activeNav);
  const currentItem = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const pauseAudio = useAudioStore((s) => s.pause);
  const playAudio = useAudioStore((s) => s.play);
  const nextAudio = useAudioStore((s) => s.next);
  const prevAudio = useAudioStore((s) => s.prev);

  const isActive = (isPlaying || isLoading || Boolean(currentItem)) && !isNewspaperAudioMode && activeNav !== "audio-news";

  if (!isActive || !currentItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150]"
      >
          <div className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-md bg-surface border border-border shadow-md">
          <div className="w-9 h-9 overflow-hidden rounded-sm shrink-0">
            <SafeImage src={currentItem.imageUrl} aiSrc={currentItem.aiImageUrl} alt="" className="w-full h-full object-cover" />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-sm">
                <div className="w-3 h-3 border-2 border-white/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0 max-w-[120px]">
            <p className="text-[11px] font-semibold leading-tight truncate text-foreground">
              {currentItem.title}
            </p>
            <p className="text-[8px] text-foreground-secondary/60 mt-0.5">
              {isLoading ? "Loading..." : isPlaying ? "Now Playing" : "Paused"}
            </p>
          </div>

          <div className="flex items-center gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); prevAudio(); }}
              className="p-1 rounded-sm text-foreground-secondary/50 hover:text-foreground transition-colors cursor-pointer">
              <SkipBack size={12} />
            </button>

            {isPlaying ? (
              <button onClick={(e) => { e.stopPropagation(); pauseAudio(); }}
                className="p-1.5 rounded-sm bg-accent text-white hover:bg-accent-soft transition-colors cursor-pointer">
                <Pause size={12} fill="white" />
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); playAudio(); }}
                className="p-1.5 rounded-sm bg-accent text-white hover:bg-accent-soft transition-colors cursor-pointer">
                <Play size={12} fill="white" />
              </button>
            )}

            <button onClick={(e) => { e.stopPropagation(); nextAudio(); }}
              className="p-1 rounded-sm text-foreground-secondary/50 hover:text-foreground transition-colors cursor-pointer">
              <SkipForward size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
