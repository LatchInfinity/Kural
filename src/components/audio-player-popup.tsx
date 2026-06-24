"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Bookmark, BookmarkCheck, Clock, ExternalLink, Flame,
  Heart, Languages, Maximize2, Pause, Play, RotateCcw, Share2,
  SkipBack, SkipForward, Star, ThumbsUp, X,
} from "lucide-react";
import SafeImage from "@/components/safe-image";
import RelatedNewsPanel from "@/components/related-news";
import CommentsSection from "@/components/comments-section";
import { useAudioStore } from "@/store/audio-store";
import { useAppStore } from "@/store/app-store";
import { useUserStore } from "@/store/user-store";
import type { ReactionType } from "@/types";

const SPEEDS = [0.85, 1, 1.12, 1.2];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatTimeStr(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((node) => !node.hasAttribute("disabled") && node.offsetParent !== null);
}

const REACTION_CONFIG: { type: ReactionType; icon: React.ReactNode; color: string; label: string }[] = [
  { type: "love", icon: <Heart size={14} />, color: "#e11d48", label: "Love" },
  { type: "trending", icon: <Flame size={14} />, color: "#0f766e", label: "Trending" },
  { type: "celebrate", icon: <Star size={14} />, color: "#d97706", label: "Celebrate" },
  { type: "helpful", icon: <ThumbsUp size={14} />, color: "#64748b", label: "Helpful" },
];

export default function AudioPlayerPopup() {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const isOpen = useAudioStore((s) => s.isPopupOpen);
  const track = useAudioStore((s) => s.currentTrack);
  const title = useAudioStore((s) => s.title);
  const thumbnail = useAudioStore((s) => s.thumbnail);
  const narration = useAudioStore((s) => s.narration);
  const articleText = track?.articleText || "";
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const progress = useAudioStore((s) => s.progress);
  const error = useAudioStore((s) => s.error);
  const language = useAudioStore((s) => s.language);
  const speed = useAudioStore((s) => s.speed);
  const audioProvider = useAudioStore((s) => s.audioProvider);
  const audioNotice = useAudioStore((s) => s.audioNotice);
  const queue = useAudioStore((s) => s.queue);
  const currentIndex = useAudioStore((s) => s.currentIndex);
  const setPopupOpen = useAudioStore((s) => s.setPopupOpen);
  const toggle = useAudioStore((s) => s.toggle);
  const replay = useAudioStore((s) => s.replay);
  const next = useAudioStore((s) => s.next);
  const prev = useAudioStore((s) => s.prev);
  const seek = useAudioStore((s) => s.seek);
  const setLanguage = useAudioStore((s) => s.setLanguage);
  const setSpeed = useAudioStore((s) => s.setSpeed);

  const articleReactions = useAppStore((s) => s.articleReactions);
  const setReaction = useAppStore((s) => s.setReaction);
  const removeReaction = useAppStore((s) => s.removeReaction);
  const savedArticles = useAppStore((s) => s.savedArticles);
  const saveArticle = useAppStore((s) => s.saveArticle);
  const unsaveArticle = useAppStore((s) => s.unsaveArticle);
  const addToast = useAppStore((s) => s.addToast);
  const updateDailyTask = useUserStore((s) => s.updateDailyTaskProgress);
  const currentUser = useUserStore((s) => s.currentUser);

  const [playerHidden, setPlayerHidden] = useState(false);
  const [articleExpanded, setArticleExpanded] = useState(false);

  const articleId = track?.id || "";
  const isSaved = articleId ? savedArticles.includes(articleId) : false;

  const providerLabel = useMemo(() => {
    if (audioProvider === "sarvam") return "Sarvam AI";
    if (audioProvider === "elevenlabs") return "ElevenLabs";
    return "";
  }, [audioProvider]);

  const close = useCallback(() => {
    setPopupOpen(false);
    setPlayerHidden(false);
    setArticleExpanded(false);
  }, [setPopupOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousActive = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => dialogRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTextInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (event.key === " " && !isTextInput) {
        event.preventDefault();
        toggle();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = focusableElements(dialogRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus?.();
    };
  }, [close, isOpen, toggle]);

  const activeReaction = useMemo(() => {
    if (!articleId || !currentUser) return null;
    const reactions = articleReactions[articleId];
    if (!reactions) return null;
    return reactions[currentUser.username] || null;
  }, [articleId, articleReactions, currentUser]);

  const reactionCounts = useMemo(() => {
    if (!articleId) return {} as Record<string, number>;
    const article = articleReactions[articleId] || {};
    const counts: Record<string, number> = {};
    for (const val of Object.values(article)) {
      counts[val as string] = (counts[val as string] || 0) + 1;
    }
    return counts;
  }, [articleId, articleReactions]);

  const handleUserReaction = (reaction: ReactionType) => {
    if (!articleId) return;
    if (activeReaction === reaction) {
      removeReaction(articleId);
    } else {
      setReaction(articleId, reaction);
    }
  };

  const handleShare = async () => {
    if (!track) return;
    updateDailyTask("share-article", 1);
    const url = track.sourceUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: articleText || title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        addToast("Link copied \u2713");
      } catch {
        addToast("Could not copy link", "error");
      }
    }
  };

  const handleSaveClick = () => {
    if (!articleId) return;
    if (isSaved) {
      unsaveArticle(articleId);
      addToast("Article removed from saved");
    } else {
      saveArticle(articleId);
      addToast("Article saved \u2713");
      updateDailyTask("save-articles", 1);
    }
  };

  if (!track) return null;

  const sourceUrlDisplay = track.sourceUrl || "";

  const playerControls = (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={prev}
        disabled={currentIndex <= 0}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white disabled:opacity-30"
        aria-label="Previous article"
      >
        <SkipBack size={16} />
      </button>
      <button
        type="button"
        onClick={replay}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white"
        aria-label="Replay audio"
      >
        <RotateCcw size={16} />
      </button>
      <button
        type="button"
        onClick={toggle}
        className="grid h-12 w-12 place-items-center rounded-full bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/25"
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
      </button>
      <button
        type="button"
        onClick={next}
        disabled={currentIndex >= queue.length - 1}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white disabled:opacity-30"
        aria-label="Next article"
      >
        <SkipForward size={16} />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="popup-modal"
            className="fixed inset-0 z-[80] bg-slate-950/90 backdrop-blur-xl text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Audio player"
              tabIndex={-1}
              className="mx-auto flex h-full max-w-7xl flex-col outline-none"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 shrink-0 border-b border-white/5">
                <div className="min-w-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                    aria-label="Close player"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Kural audio</p>
                    <h2 className="truncate text-sm font-bold sm:text-base">{title}</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                  aria-label="Close player"
                >
                  <X size={16} />
                </button>
              </header>

              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[30%_70%] lg:grid-cols-[25%_50%_25%] gap-0 overflow-hidden">
                <aside className="hidden md:flex flex-col border-r border-white/5 overflow-hidden">
                  <div className="px-4 py-4 flex-1 min-h-0 overflow-y-auto">
                    <RelatedNewsPanel currentId={articleId} category={track.category} language={language} />
                  </div>
                </aside>

                <main className="min-h-0 overflow-y-auto px-4 sm:px-5 py-4">
                  <div className="max-w-3xl mx-auto space-y-4">
                    <h1 className="text-xl sm:text-2xl font-bold leading-tight text-white">{title}</h1>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
                      {track.category && (
                        <span className="inline-flex items-center rounded-full bg-teal-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-teal-300">
                          {track.category.replace("தமிழ்நாடு ", "")}
                        </span>
                      )}
                      {track.source && (
                        <span className="font-medium text-white/50">{track.source}</span>
                      )}
                      {track.publishedAt && (
                        <>
                          <span className="hidden sm:inline text-white/30">·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDate(track.publishedAt)}
                          </span>
                          <span>{formatTimeStr(track.publishedAt)}</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 py-2 border-y border-white/5">
                      {REACTION_CONFIG.map((r) => {
                        const isActive = activeReaction === r.type;
                        const count = reactionCounts[r.type] || 0;
                        return (
                          <button
                            key={r.type}
                            onClick={() => handleUserReaction(r.type)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-colors"
                            style={{
                              color: isActive ? r.color : "rgba(255,255,255,0.6)",
                              background: isActive ? `${r.color}20` : "rgba(255,255,255,0.05)",
                            }}
                          >
                            {r.icon}
                            {count > 0 && <span className="text-[10px] font-medium">{count}</span>}
                          </button>
                        );
                      })}
                      <div className="w-px h-5 bg-white/10 mx-1" />
                      <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Share2 size={12} />
                        Share
                      </button>
                      <button
                        onClick={handleSaveClick}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-colors"
                        style={{
                          color: isSaved ? "#2dd4bf" : "rgba(255,255,255,0.6)",
                          background: isSaved ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.05)",
                        }}
                      >
                        {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                        {isSaved ? "Saved" : "Save"}
                      </button>
                      {sourceUrlDisplay && (
                        <>
                          <div className="w-px h-5 bg-white/10 mx-1" />
                          <a
                            href={sourceUrlDisplay}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-white/60 hover:text-teal-300 hover:bg-teal-500/10 transition-colors"
                          >
                            <ExternalLink size={12} />
                            Source
                          </a>
                        </>
                      )}
                    </div>

                    {thumbnail && (
                      <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-white/5">
                        <SafeImage src={thumbnail} alt="" className="h-full w-full object-cover" />
                        {isLoading && (
                          <div className="absolute inset-0 grid place-items-center bg-slate-950/45">
                            <div className="h-8 w-8 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                          </div>
                        )}
                      </div>
                    )}

                    {!playerHidden && (
                      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <input
                          type="range"
                          min={0}
                          max={duration || 0}
                          step={0.1}
                          value={Math.min(currentTime, duration || currentTime)}
                          onChange={(event) => seek(Number(event.currentTarget.value))}
                          className="w-full accent-teal-400"
                          aria-label="Seek audio"
                        />
                        <div className="mt-1 flex items-center justify-between text-xs tabular-nums text-white/60">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-teal-400" style={{ width: `${progress}%` }} />
                        </div>

                        <div className="mt-3">{playerControls}</div>

                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setLanguage(language === "ta" ? "en" : "ta")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80"
                          >
                            <Languages size={13} />
                            {language === "ta" ? "தமிழ்" : "English"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const index = SPEEDS.indexOf(speed);
                              setSpeed(SPEEDS[(index + 1) % SPEEDS.length]);
                            }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80"
                          >
                            {speed.toFixed(2).replace(/\.00$/, "")}x
                          </button>
                          {providerLabel && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/55">
                              {providerLabel}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setPlayerHidden(true)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            Hide Player
                          </button>
                        </div>
                        {(error || audioNotice) && (
                          <p className={`mt-2 text-center text-xs ${error ? "text-rose-200" : "text-white/45"}`}>
                            {error || audioNotice}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                      <h3 className="text-xs font-semibold text-white/75">Generated narration</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/72">
                        {narration || "Preparing narration..."}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/5" id="article-section">
                      <div
                        className={`p-4 ${articleExpanded ? "max-h-[45vh] overflow-y-auto" : ""}`}
                      >
                        <h3 className="text-xs font-semibold text-white/75 mb-2">Full article</h3>
                        <p
                          className="whitespace-pre-wrap text-sm leading-7 text-white/62"
                          style={
                            articleExpanded
                              ? {}
                              : {
                                  display: "-webkit-box",
                                  WebkitLineClamp: 10,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }
                          }
                        >
                          {articleText || ""}
                        </p>
                      </div>
                      {articleText && (
                        <button
                          onClick={() => setArticleExpanded(!articleExpanded)}
                          className="w-full px-4 py-2.5 text-xs font-semibold text-teal-300 border-t border-white/10 hover:bg-white/5 transition-colors text-center"
                        >
                          {articleExpanded ? "Show Less" : "Show More"}
                        </button>
                      )}
                    </div>

                    <div className="md:hidden space-y-4 pt-2">
                      <RelatedNewsPanel currentId={articleId} category={track.category} language={language} />
                    </div>
                    <div className="lg:hidden space-y-4 pb-4">
                      <CommentsSection newsId={articleId} />
                    </div>
                  </div>
                </main>

                <aside className="hidden lg:flex flex-col border-l border-white/5 overflow-hidden">
                  <div className="px-4 py-4 flex-1 min-h-0 overflow-y-auto">
                    <CommentsSection newsId={articleId} />
                  </div>
                </aside>
              </div>
            </motion.div>
          </motion.div>

          {playerHidden && (
            <motion.div
              key="mini-player"
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-4 left-4 z-[90]"
            >
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl p-3 w-72">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold text-white truncate min-w-0">{title}</p>
                  <span className="text-[10px] text-white/50 tabular-nums shrink-0">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="h-1 rounded-full bg-white/10 mb-2">
                  <div className="h-full rounded-full bg-teal-400" style={{ width: `${progress}%` }} />
                </div>

                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Previous article"
                  >
                    <SkipBack size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(); }}
                    className="p-2 rounded-full bg-teal-400 text-slate-950 shadow-lg"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Next article"
                  >
                    <SkipForward size={14} />
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setPlayerHidden(false); }}
                    className="p-1.5 rounded-lg text-white/60 hover:text-teal-300 hover:bg-white/10 transition-colors"
                    aria-label="Expand player"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
