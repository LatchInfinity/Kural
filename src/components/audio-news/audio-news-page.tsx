"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  Frown,
  Heart,
  Languages,
  Laugh,
  Maximize2,
  MessageCircle,
  Minimize2,
  Pause,
  Play,
  Reply,
  Send,
  Share2,
  Sparkles,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import SafeImage from "@/components/safe-image";
import { getCategoryFallbackImageUrl } from "@/lib/category-images";
import {
  getArticleContentText,
  getArticleDisplayText,
  getArticleHeadlineText,
  getCategoryDisplayText,
} from "@/lib/news-text";
import { toAudioTrack, type AudioTrack, type QueueItem } from "@/lib/audio-engine";
import type { Comment, NewsItem, ReactionType } from "@/types";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { useNewsStore } from "@/store/news-store";
import { useUserStore } from "@/store/user-store";

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;
const RELATED_BATCH_SIZE = 14;
const COMMENTS_BATCH_SIZE = 12;
const AUDIO_PRELOAD_SPEED = 1.25;
const EMPTY_COMMENTS: Comment[] = [];

type KuralReaction = "love" | "like" | "appreciate" | "interesting" | "funny" | "sad";

const REACTIONS: { id: KuralReaction; label: string; icon: React.ReactNode; tone: string }[] = [
  { id: "love", label: "Love", icon: <Heart size={13} />, tone: "#fb7185" },
  { id: "like", label: "Like", icon: <ThumbsUp size={13} />, tone: "#38bdf8" },
  { id: "appreciate", label: "Appreciate", icon: <Sparkles size={13} />, tone: "#fbbf24" },
  { id: "interesting", label: "Interesting", icon: <Eye size={13} />, tone: "#2dd4bf" },
  { id: "funny", label: "Funny", icon: <Laugh size={13} />, tone: "#a78bfa" },
  { id: "sad", label: "Sad", icon: <Frown size={13} />, tone: "#94a3b8" },
];

function toQueueItem(item: NewsItem): QueueItem {
  return {
    id: item.id,
    headline: item.headline,
    englishHeadline: item.englishHeadline,
    imageUrl: item.imageUrl,
    aiImageUrl: item.aiImageUrl,
    tamilSummary: getArticleDisplayText(item, "ta"),
    englishSummary: getArticleDisplayText(item, "en"),
    content: getArticleContentText(item, "ta"),
    source: item.source,
    sourceUrl: item.sourceUrl,
    category: item.category,
    publishedAt: item.publishedAt,
  };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function newestFirst(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.publishedAt).getTime();
    const bTime = new Date(b.publishedAt).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(value?: string): string {
  if (!value) return "Latest";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Latest";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(value?: string): string {
  if (!value) return "Latest";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Latest";
  const mins = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function estimateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} min read`;
}

function commentTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function articleFromTrack(track: AudioTrack | null, selected: NewsItem | null): QueueItem | null {
  if (track) return track;
  return selected ? toQueueItem(selected) : null;
}

function useCurrentArticle(articles: NewsItem[], currentTrack: AudioTrack | null, selectedId: string | null) {
  return useMemo(() => {
    const trackArticle = currentTrack ? articles.find((item) => item.id === currentTrack.articleId) : null;
    const selectedArticle = selectedId ? articles.find((item) => item.id === selectedId) : null;
    return trackArticle || selectedArticle || articles[0] || null;
  }, [articles, currentTrack, selectedId]);
}

const Waveform = memo(function Waveform({ active }: { active: boolean }) {
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);
  return (
    <div className="flex h-12 items-center justify-center gap-1" aria-hidden="true">
      {bars.map((bar) => (
        <motion.span
          key={bar}
          className="w-1 rounded-full bg-cyan-200/80 shadow-[0_0_18px_rgba(45,212,191,0.25)]"
          initial={{ height: 10 }}
          animate={{ height: active ? [10, 30 + ((bar * 7) % 18), 14 + ((bar * 5) % 24), 10] : 10 }}
          transition={{
            duration: 1.15 + (bar % 4) * 0.08,
            repeat: active ? Infinity : 0,
            ease: "easeInOut",
            delay: (bar % 8) * 0.04,
          }}
        />
      ))}
    </div>
  );
});

const RelatedNewsRail = memo(function RelatedNewsRail({
  items,
  currentId,
  onPlay,
  onClose,
}: {
  items: NewsItem[];
  currentId: string;
  onPlay: (item: NewsItem) => void;
  onClose?: () => void;
}) {
  const [visibleCount, setVisibleCount] = useState(RELATED_BATCH_SIZE);
  const related = useMemo(() => {
    const current = items.find((item) => item.id === currentId);
    const sameCategory = current ? items.filter((item) => item.id !== currentId && item.category === current.category) : [];
    const rest = items.filter((item) => item.id !== currentId && item.category !== current?.category);
    return [...sameCategory, ...rest];
  }, [currentId, items]);
  const visible = related.slice(0, visibleCount);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 96) {
      setVisibleCount((count) => Math.min(related.length, count + RELATED_BATCH_SIZE));
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/10 bg-white/[0.055] shadow-2xl shadow-slate-950/20 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/60">Kural queue</p>
          <h2 className="text-lg font-black text-white">Related News</h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
            aria-label="Close related news"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3" onScroll={handleScroll}>
        <div className="space-y-2">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPlay(item)}
              className="group grid w-full grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-2xl border border-white/0 p-2 text-left transition hover:border-white/10 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <div className="h-16 overflow-hidden rounded-xl bg-slate-900">
                <SafeImage
                  src={item.aiImageUrl || item.imageUrl}
                  aiSrc={item.imageUrl}
                  fallbackSrc={getCategoryFallbackImageUrl(item.category, true)}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 py-0.5">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-white/90 transition group-hover:text-cyan-100">
                  {getArticleHeadlineText(item, "ta")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-white/45">
                  <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-cyan-100/80">
                    {getCategoryDisplayText(item.category, "en")}
                  </span>
                  <span>{timeAgo(item.publishedAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});

function KuralCommentsPanel({ newsId, onClose }: { newsId: string; onClose?: () => void }) {
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [visibleCount, setVisibleCount] = useState(COMMENTS_BATCH_SIZE);
  const comments = useAppStore((s) => s.comments[newsId] || EMPTY_COMMENTS);
  const addComment = useAppStore((s) => s.addComment);
  const addReply = useAppStore((s) => s.addReply);
  const likeComment = useAppStore((s) => s.likeComment);
  const addToast = useAppStore((s) => s.addToast);
  const currentUser = useUserStore((s) => s.currentUser);
  const userAvatar = currentUser?.profileImage || currentUser?.username?.[0]?.toUpperCase() || "?";

  const pinned = useMemo(() => {
    return [...comments]
      .sort((a, b) => ((b.likes || 0) + (b.replies?.length || 0) * 2) - ((a.likes || 0) + (a.replies?.length || 0) * 2))
      .slice(0, Math.min(2, comments.length));
  }, [comments]);

  const newest = useMemo(() => {
    const pinnedIds = new Set(pinned.map((comment) => comment.id));
    return [...comments]
      .filter((comment) => !pinnedIds.has(comment.id))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [comments, pinned]);

  const visibleNewest = newest.slice(0, visibleCount);

  const handleSubmit = () => {
    const value = text.trim();
    if (!value || !currentUser) return;
    const nextComment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      newsId,
      username: currentUser.username,
      avatar: userAvatar,
      text: value,
      timestamp: Date.now(),
      replies: [],
      reactions: [],
      likes: 0,
      likedBy: [],
    };

    if (replyTo) {
      addReply(newsId, replyTo.id, nextComment);
      setReplyTo(null);
    } else {
      addComment(newsId, nextComment);
    }
    setText("");
    addToast("Comment added");
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 96) {
      setVisibleCount((count) => Math.min(newest.length, count + COMMENTS_BATCH_SIZE));
    }
  };

  const renderComment = (comment: Comment, pinnedComment = false) => {
    const isLiked = currentUser ? comment.likedBy?.includes(currentUser.username) : false;
    return (
      <article key={comment.id} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
        <div className="flex gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-200/15 text-xs font-black text-cyan-100">
            {comment.avatar || comment.username[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white/85">{comment.username}</span>
              {pinnedComment && <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[9px] font-bold text-amber-100">Pinned</span>}
              <span className="text-[10px] font-medium text-white/40">{commentTime(comment.timestamp)}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-white/65">{comment.text}</p>
            <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-white/45">
              <button
                type="button"
                onClick={() => currentUser && likeComment(newsId, comment.id, currentUser.username)}
                className="inline-flex items-center gap-1 transition hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                aria-label="Like comment"
              >
                <Heart size={11} fill={isLiked ? "currentColor" : "none"} />
                {comment.likes || 0}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(comment);
                  setText(`@${comment.username} `);
                }}
                className="inline-flex items-center gap-1 transition hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                <Reply size={11} />
                Reply
              </button>
            </div>
            {comment.replies?.length > 0 && (
              <div className="mt-3 space-y-2 border-l border-white/10 pl-3">
                {comment.replies.slice(0, 3).map((reply) => (
                  <div key={reply.id} className="text-xs text-white/60">
                    <span className="font-bold text-white/80">{reply.username}</span> {reply.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/10 bg-white/[0.055] shadow-2xl shadow-slate-950/20 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/60">Reader room</p>
          <h2 className="flex items-center gap-2 text-lg font-black text-white">
            Comments <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/55">{comments.length}</span>
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
            aria-label="Close comments"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3" onScroll={handleScroll}>
        {comments.length === 0 ? (
          <div className="grid h-full min-h-[220px] place-items-center rounded-2xl border border-dashed border-white/10 text-center">
            <div>
              <MessageCircle className="mx-auto text-white/30" size={28} />
              <p className="mt-3 text-sm font-bold text-white/70">No comments yet</p>
              <p className="mt-1 text-xs text-white/40">Start the conversation.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pinned.length > 0 && <div className="space-y-2">{pinned.map((comment) => renderComment(comment, true))}</div>}
            {visibleNewest.length > 0 && <div className="space-y-2">{visibleNewest.map((comment) => renderComment(comment))}</div>}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-white/10 bg-slate-950/70 p-3 backdrop-blur-xl">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/60">
            <span>Replying to {replyTo.username}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-white/80" aria-label="Cancel reply">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.currentTarget.value.slice(0, 500))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Add a comment..."
            className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-white/10 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-300/30"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="grid h-11 w-11 place-items-center rounded-full bg-cyan-200 text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            aria-label="Post comment"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

function MiniAudioDock({
  track,
  isPlaying,
  onToggle,
  onPrev,
  onNext,
  onExpand,
  onClose,
}: {
  track: QueueItem;
  isPlaying: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onExpand: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 12 }}
      drag
      dragMomentum={false}
      dragElastic={0.04}
      className="fixed bottom-5 left-5 z-[140] w-[min(360px,calc(100vw-2rem))] rounded-[24px] border border-white/15 bg-slate-950/[0.88] p-3 text-white shadow-2xl shadow-black/35 backdrop-blur-2xl"
      role="region"
      aria-label="Mini audio player"
    >
      <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-3">
        <div className="h-14 overflow-hidden rounded-2xl bg-slate-900">
          <SafeImage src={track.aiImageUrl || track.imageUrl} aiSrc={track.imageUrl} fallbackSrc={getCategoryFallbackImageUrl(track.category || "", true)} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{track.headline}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-white/45">{track.source || "Kural audio"}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <button type="button" onClick={onPrev} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-white/70 transition hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label="Previous article">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={onToggle} className="grid h-9 w-9 place-items-center rounded-full bg-cyan-200 text-slate-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label={isPlaying ? "Pause audio" : "Play audio"}>
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <button type="button" onClick={onNext} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-white/70 transition hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label="Next article">
              <ChevronRight size={16} />
            </button>
            <button type="button" onClick={onExpand} className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-white/70 transition hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label="Expand player">
              <Maximize2 size={14} />
            </button>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-white/70 transition hover:bg-rose-400/20 hover:text-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300" aria-label="Close mini player">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AudioTransportPanel({
  playSelected,
  toggleMute,
  isMuted,
}: {
  playSelected: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}) {
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const speed = useAudioStore((s) => s.speed);
  const volume = useAudioStore((s) => s.volume);
  const error = useAudioStore((s) => s.error);
  const audioNotice = useAudioStore((s) => s.audioNotice);
  const prev = useAudioStore((s) => s.prev);
  const next = useAudioStore((s) => s.next);
  const seek = useAudioStore((s) => s.seek);
  const setSpeed = useAudioStore((s) => s.setSpeed);
  const setVolume = useAudioStore((s) => s.setVolume);

  return (
    <div className="mx-auto w-full max-w-xl rounded-[20px] border border-white/10 bg-slate-950/45 p-2.5 shadow-lg shadow-black/15">
      <label className="sr-only" htmlFor="audio-progress">Audio progress</label>
      <input id="audio-progress" type="range" min={0} max={duration || 0} step={0.1} value={Math.min(currentTime, duration || currentTime)} onChange={(event) => seek(Number(event.currentTarget.value))} className="w-full accent-cyan-200" aria-label="Audio progress" />
      <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold tabular-nums text-white/50">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2.5">
        <button type="button" onClick={prev} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white/75 transition hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label="Previous article">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={playSelected} className="grid h-11 w-11 place-items-center rounded-full bg-cyan-200 text-slate-950 shadow-xl shadow-cyan-950/25 transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label={isPlaying ? "Pause audio" : "Play audio"}>
          {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
        </button>
        <button type="button" onClick={next} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white/75 transition hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label="Next article">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        {SPEED_OPTIONS.map((option) => {
          const active = Math.abs(speed - option) < 0.01;
          return (
            <button key={option} type="button" onClick={() => setSpeed(option)} className="h-7 rounded-full border px-2 text-[10px] font-black transition focus:outline-none focus:ring-2 focus:ring-cyan-300" style={{ borderColor: active ? "rgba(165,243,252,0.9)" : "rgba(255,255,255,0.1)", background: active ? "rgba(165,243,252,0.16)" : "rgba(255,255,255,0.055)", color: active ? "#cffafe" : "rgba(255,255,255,0.62)" }}>
              {option}x
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center">
        <button type="button" onClick={toggleMute} className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white/70 transition hover:bg-white/[0.12] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
      </div>

      {(error || audioNotice || isLoading) && <p className={`mt-4 text-center text-xs font-semibold ${error ? "text-rose-200" : "text-white/45"}`}>{error || audioNotice || "Preparing audio"}</p>}
    </div>
  );
}

export default function AudioNewsPage() {
  const articles = useNewsStore((s) => s.articles);
  const articleReactions = useAppStore((s) => s.articleReactions);
  const setReaction = useAppStore((s) => s.setReaction);
  const savedArticles = useAppStore((s) => s.savedArticles);
  const saveArticle = useAppStore((s) => s.saveArticle);
  const unsaveArticle = useAppStore((s) => s.unsaveArticle);
  const addToast = useAppStore((s) => s.addToast);
  const currentUser = useUserStore((s) => s.currentUser);

  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const language = useAudioStore((s) => s.language);
  const volume = useAudioStore((s) => s.volume);
  const voiceGender = useAudioStore((s) => s.voiceGender);
  const setLanguage = useAudioStore((s) => s.setLanguage);
  const setVolume = useAudioStore((s) => s.setVolume);
  const toggle = useAudioStore((s) => s.toggle);
  const prev = useAudioStore((s) => s.prev);
  const next = useAudioStore((s) => s.next);
  const resetAudio = useAudioStore((s) => s.reset);
  const setTrack = useAudioStore((s) => s.setTrack);
  const setPopupOpen = useAudioStore((s) => s.setPopupOpen);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [miniDocked, setMiniDocked] = useState(false);
  const [miniClosed, setMiniClosed] = useState(false);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.8);
  const preloadedAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const audioItems = useMemo(() => newestFirst(dedupeById(articles.filter((item) => item.retention !== "archived"))), [articles]);
  const selectedArticle = useCurrentArticle(audioItems, currentTrack, selectedId);
  const displayItem = articleFromTrack(currentTrack, selectedArticle);
  const articleId = currentTrack?.articleId || selectedArticle?.id || "";

  const summary = displayItem ? (language === "en" ? displayItem.englishSummary : displayItem.tamilSummary) : "";
  const fullArticle = displayItem ? (displayItem.content || summary || displayItem.headline) : "";
  const title = displayItem ? getArticleHeadlineText(displayItem, language) : "Audio News";
  const categoryLabel = displayItem?.category ? getCategoryDisplayText(displayItem.category, "en") : "News";
  const sourceUrl = displayItem?.sourceUrl || "";
  const isSaved = articleId ? savedArticles.includes(articleId) : false;
  const isMuted = volume <= 0.01;

  const currentReaction = articleId && currentUser ? articleReactions[articleId]?.[currentUser.username] : null;
  const reactionCounts = useMemo(() => {
    const values = articleId ? Object.values(articleReactions[articleId] || {}) : [];
    return REACTIONS.reduce<Record<KuralReaction, number>>((acc, reaction) => {
      acc[reaction.id] = values.filter((value) => value === reaction.id).length;
      return acc;
    }, {
      love: 0,
      like: 0,
      appreciate: 0,
      interesting: 0,
      funny: 0,
      sad: 0,
    });
  }, [articleId, articleReactions]);

  const playArticle = useCallback((item: NewsItem) => {
    const index = Math.max(0, audioItems.findIndex((article) => article.id === item.id));
    setSelectedId(item.id);
    setMiniClosed(false);
    setPopupOpen(false);
    setTrack(toQueueItem(item), { index, queue: audioItems.map(toQueueItem), language, openPopup: false });
  }, [audioItems, language, setPopupOpen, setTrack]);

  const playSelected = useCallback(() => {
    if (!selectedArticle) return;
    if (currentTrack?.articleId === selectedArticle.id) {
      toggle();
      return;
    }
    playArticle(selectedArticle);
  }, [currentTrack?.articleId, playArticle, selectedArticle, toggle]);

  const handleSave = useCallback(() => {
    if (!articleId) return;
    if (isSaved) {
      unsaveArticle(articleId);
      addToast("Article removed from saved");
    } else {
      saveArticle(articleId);
      addToast("Article saved");
    }
  }, [addToast, articleId, isSaved, saveArticle, unsaveArticle]);

  const copyLink = async () => {
    const link = sourceUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      addToast("Link copied");
    } catch {
      addToast("Could not copy link", "error");
    }
  };

  const shareArticle = async () => {
    const link = sourceUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: summary || title, url: link });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(previousVolume || 0.8);
      return;
    }
    setPreviousVolume(volume || 0.8);
    setVolume(0);
  }, [isMuted, previousVolume, setVolume, volume]);

  useEffect(() => {
    if (!articleId || !isPlaying || audioItems.length < 2) return;

    const currentIndex = audioItems.findIndex((item) => item.id === articleId);
    const nextArticle = currentIndex >= 0 ? audioItems[currentIndex + 1] : null;
    if (!nextArticle) return;

    const preloadKey = `${nextArticle.id}|${language}|${voiceGender}`;
    if (preloadedAudioRef.current.has(preloadKey)) return;

    const controller = new AbortController();
    const nextTrack = toAudioTrack(toQueueItem(nextArticle), language);

    void (async () => {
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newsId: nextTrack.articleId,
            text: nextTrack.script,
            language,
            gender: voiceGender,
            speed: AUDIO_PRELOAD_SPEED,
            forceRegenerate: false,
          }),
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = await response.json().catch(() => null) as { status?: string; audioUrl?: string } | null;
        if (controller.signal.aborted || data?.status !== "ready" || !data.audioUrl) return;

        const audio = new Audio(data.audioUrl);
        audio.preload = "auto";
        audio.load();

        const preloaded = preloadedAudioRef.current;
        preloaded.set(preloadKey, audio);
        if (preloaded.size > 4) {
          const oldestKey = preloaded.keys().next().value;
          if (oldestKey) preloaded.delete(oldestKey);
        }
      } catch {
        if (!controller.signal.aborted) {
          preloadedAudioRef.current.delete(preloadKey);
        }
      }
    })();

    return () => controller.abort();
  }, [articleId, audioItems, isPlaying, language, voiceGender]);

  useEffect(() => {
    setPopupOpen(false);
  }, [setPopupOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTextInput) return;

      if (event.key === " ") {
        event.preventDefault();
        playSelected();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setVolume(Math.min(1, volume + 0.08));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setVolume(Math.max(0, volume - 0.08));
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleMute();
      } else if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, next, playSelected, prev, setVolume, toggleMute, volume]);

  if (!displayItem || !selectedArticle) {
    return (
      <main className="min-h-screen bg-[#08111f] px-4 py-10 text-white">
        <div className="mx-auto grid min-h-[60vh] max-w-4xl place-items-center rounded-[28px] border border-white/10 bg-white/[0.055] text-center">
          <div>
            <Play className="mx-auto text-cyan-200/60" size={42} />
            <h1 className="mt-4 text-2xl font-black">Audio News</h1>
            <p className="mt-2 text-sm text-white/50">No audio stories are available right now.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="notranslate min-h-screen bg-[radial-gradient(circle_at_top_left,#164e63_0,#08111f_34%,#070b14_78%)] px-3 py-4 text-white md:px-5 md:py-6" translate="no">
      <div className="mx-auto grid max-w-[1680px] grid-cols-1 gap-4 md:grid-cols-[minmax(230px,34%)_minmax(0,66%)] lg:h-[calc(100vh-112px)] lg:grid-cols-[minmax(220px,25%)_minmax(420px,50%)_minmax(240px,25%)]">
        <aside className="hidden min-h-0 md:block">
          <RelatedNewsRail items={audioItems} currentId={articleId} onPlay={playArticle} />
        </aside>

        <section className="min-h-0 overflow-hidden rounded-[30px] border border-white/[0.12] bg-white/[0.07] shadow-2xl shadow-slate-950/30 backdrop-blur-2xl">
          {miniDocked ? (
            <div className="grid h-full min-h-[620px] place-items-center p-6 text-center">
              <div className="max-w-sm">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-cyan-200/15 text-cyan-100">
                  <Minimize2 size={26} />
                </div>
                <h1 className="mt-5 text-2xl font-black">Player docked</h1>
                <p className="mt-2 text-sm leading-6 text-white/50">Your audio keeps playing in the floating dock.</p>
                <button type="button" onClick={() => { setMiniDocked(false); setMiniClosed(false); }} className="mt-5 rounded-full bg-cyan-200 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300">
                  Restore Player
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[620px] flex-col overflow-y-auto p-3 pb-8 md:p-4 md:pb-10">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/60">Kural Audio Desk</p>
                  <h1 className="mt-1 text-xl font-black tracking-tight text-white md:text-2xl">Audio News</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setLanguage(language === "ta" ? "en" : "ta")} className="hidden rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-200/20 focus:outline-none focus:ring-2 focus:ring-cyan-300 lg:inline-flex">
                    <Languages size={13} className="mr-1" />
                    {language === "ta" ? "English" : "Tamil"}
                  </button>
                  <button type="button" onClick={() => setRelatedOpen(true)} className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-bold text-white/75 focus:outline-none focus:ring-2 focus:ring-cyan-300 md:hidden">
                    Related
                  </button>
                  <button type="button" onClick={() => setCommentsOpen(true)} className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-bold text-white/75 focus:outline-none focus:ring-2 focus:ring-cyan-300">
                    Comments
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={articleId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }} className="grid gap-3">
                  <div className="relative mx-auto aspect-[16/9] w-full max-w-[300px] overflow-hidden rounded-[22px] border border-white/[0.12] bg-slate-900 shadow-xl shadow-black/25 md:max-w-[330px]">
                    <SafeImage src={displayItem.aiImageUrl || displayItem.imageUrl} aiSrc={displayItem.imageUrl} fallbackSrc={getCategoryFallbackImageUrl(displayItem.category || "", true)} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-white/5" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <Waveform active={isPlaying && !isLoading} />
                    </div>
                  </div>

                  <div className="mx-auto w-full max-w-3xl text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-full bg-cyan-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950">{categoryLabel}</span>
                      <button type="button" onClick={() => setLanguage(language === "ta" ? "en" : "ta")} className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/75 transition hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-cyan-300">
                        {language === "ta" ? "Tamil" : "English"}
                      </button>
                    </div>
                    <h2 className="mt-2 line-clamp-2 text-lg font-black leading-tight tracking-tight md:text-xl xl:text-2xl">{title}</h2>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] font-semibold text-white/48">
                      <span>{formatDate(displayItem.publishedAt)}</span>
                      <span>{formatTime(displayItem.publishedAt)}</span>
                      <span>{displayItem.source || "Kural"}</span>
                      <span>{estimateReadingTime(fullArticle)}</span>
                    </div>
                  </div>

                  <AudioTransportPanel playSelected={playSelected} toggleMute={toggleMute} isMuted={isMuted} />

                  <div className="mx-auto w-full max-w-2xl rounded-[20px] border border-white/10 bg-white/[0.055] p-2">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {REACTIONS.map((reaction) => {
                        const active = currentReaction === reaction.id;
                        return (
                          <button key={reaction.id} type="button" onClick={() => articleId && setReaction(articleId, reaction.id as ReactionType)} className="inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-300" style={{ borderColor: active ? reaction.tone : "rgba(255,255,255,0.1)", background: active ? `${reaction.tone}22` : "rgba(255,255,255,0.045)", color: active ? reaction.tone : "rgba(255,255,255,0.68)" }}>
                            {reaction.icon}
                            {reaction.label}
                            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{reactionCounts[reaction.id]}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      <button type="button" onClick={handleSave} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.07] text-[10px] font-black text-white/75 transition hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-cyan-300">
                        {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                        Save Article
                      </button>
                      <button type="button" onClick={shareArticle} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.07] text-[10px] font-black text-white/75 transition hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-cyan-300">
                        <Share2 size={13} />
                        Share
                      </button>
                      <button type="button" onClick={copyLink} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.07] text-[10px] font-black text-white/75 transition hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-cyan-300">
                        <Copy size={13} />
                        Copy Link
                      </button>
                      {sourceUrl ? (
                        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-cyan-200/20 bg-cyan-200/12 text-[10px] font-black text-cyan-100 transition hover:bg-cyan-200/20 focus:outline-none focus:ring-2 focus:ring-cyan-300">
                          <ExternalLink size={13} />
                          Original Source
                        </a>
                      ) : (
                        <button type="button" disabled className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] font-black text-white/25">
                          <ExternalLink size={13} />
                          Original Source
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </section>

        <aside className="hidden min-h-0 lg:block">
          <KuralCommentsPanel newsId={articleId} />
        </aside>
      </div>

      <AnimatePresence>
        {relatedOpen && (
          <motion.div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="h-full w-[88vw] max-w-sm p-3" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 260, damping: 30 }}>
              <RelatedNewsRail items={audioItems} currentId={articleId} onPlay={(item) => { playArticle(item); setRelatedOpen(false); }} onClose={() => setRelatedOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {commentsOpen && (
          <motion.div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute bottom-0 left-0 right-0 h-[78vh] rounded-t-[30px] p-3" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 260, damping: 30 }}>
              <KuralCommentsPanel newsId={articleId} onClose={() => setCommentsOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {miniDocked && !miniClosed && displayItem && (
          <MiniAudioDock
            track={displayItem}
            isPlaying={isPlaying}
            onToggle={toggle}
            onPrev={prev}
            onNext={next}
            onExpand={() => { setMiniDocked(false); setMiniClosed(false); }}
            onClose={() => { setMiniClosed(true); setMiniDocked(false); resetAudio(); }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
