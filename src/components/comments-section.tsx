"use client";
import { useState, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { useUserStore } from "@/store/user-store";
import { Heart } from "lucide-react";

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function computeEngagementScore(c: { likes?: number; replies?: unknown[]; timestamp: number }): number {
  const likeScore = (c.likes ?? 0) * 3;
  const replyScore = (c.replies?.length ?? 0) * 4;
  const hoursAge = (Date.now() - c.timestamp) / 3600000;
  const recencyBoost = Math.max(0, 24 - hoursAge) * 0.5;
  return likeScore + replyScore + recencyBoost;
}

export default function CommentsSection({ newsId }: { newsId: string }) {
  const [commentText, setCommentText] = useState("");
  const currentUser = useUserStore((s) => s.currentUser);
  const charLimit = 500;
  const storeComments = useAppStore((s) => s.comments);
  const addStoreComment = useAppStore((s) => s.addComment);
  const addToast = useAppStore((s) => s.addToast);
  const likeComment = useAppStore((s) => s.likeComment);
  const newsComments = useMemo(() => storeComments[newsId] || [], [storeComments, newsId]);

  const { topComments, regularComments } = useMemo(() => {
    if (newsComments.length <= 3) {
      return { topComments: newsComments, regularComments: [] as typeof newsComments };
    }
    const scored = [...newsComments].map((c) => ({ comment: c, score: computeEngagementScore(c) }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3).map((s) => s.comment);
    const topIds = new Set(top.map((t) => t.id));
    const regular = newsComments.filter((c) => !topIds.has(c.id));
    return { topComments: top, regularComments: regular };
  }, [newsComments]);

  const userAvatar = currentUser?.profileImage || currentUser?.username[0].toUpperCase() || "?";

  const handleSubmit = useCallback(() => {
    const text = commentText.trim();
    if (!text || !currentUser) return;
    addStoreComment(newsId, {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      newsId,
      username: currentUser.username,
      avatar: userAvatar,
      text,
      timestamp: Date.now(),
      replies: [],
      reactions: [],
      likes: 0,
      likedBy: [],
    });
    setCommentText("");
    addToast("Comment added ✓");
  }, [commentText, currentUser, newsId, userAvatar, addStoreComment, addToast]);

  const handleLike = useCallback((commentId: string) => {
    if (!currentUser) return;
    likeComment(newsId, commentId, currentUser.username);
  }, [currentUser, newsId, likeComment]);

  const renderComment = (c: { id: string; username: string; avatar: string; text: string; timestamp: number; likes?: number; likedBy?: string[] }) => {
    const likedBy = c.likedBy ?? [];
    const likes = c.likes ?? 0;
    const isLiked = currentUser ? likedBy.includes(currentUser.username) : false;
    return (
      <div key={c.id} className="flex gap-2.5">
        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
          {c.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground-secondary/80">{c.username}</span>
            <span className="text-[9px] text-foreground-secondary/40">{formatRelativeTime(c.timestamp)}</span>
          </div>
          <p className="text-xs text-foreground-secondary/70 mt-0.5">{c.text}</p>
          <button
            onClick={() => handleLike(c.id)}
            className="flex items-center gap-1 mt-1 text-[10px] transition-colors cursor-pointer"
            style={{ color: isLiked ? "var(--color-accent)" : "var(--color-foreground-secondary)" }}
          >
            <Heart size={10} style={{ fill: isLiked ? "var(--color-accent)" : "none" }} />
            <span>{likes}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="notranslate flex flex-col h-full" translate="no">
      <p className="text-xs font-semibold text-foreground-secondary mb-3">
        Comments {newsComments.length > 0 && `(${newsComments.length})`}
      </p>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
        {newsComments.length === 0 && (
          <p className="text-xs text-foreground-secondary/40 text-center py-8">No comments yet. Be the first!</p>
        )}

        {topComments.length > 0 && (
          <div className="mb-4">
            {topComments.map((c) => (
              <div key={c.id} className="mb-3">{renderComment(c)}</div>
            ))}
          </div>
        )}

        {regularComments.length > 0 && (
          <div>
            {regularComments.map((c) => (
              <div key={c.id} className="mb-3">{renderComment(c)}</div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-border mt-3 shrink-0">
        <input
          value={commentText}
          onChange={(e) => { if (e.target.value.length <= charLimit) setCommentText(e.target.value); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Add a comment..."
          className="flex-1 bg-surface-highlight border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder-foreground-secondary/40 outline-none focus:border-accent/50 transition-colors"
        />
        <button
          onClick={handleSubmit}
          className="px-3 py-2 rounded-sm text-xs font-semibold text-white bg-accent hover:bg-accent-soft transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!commentText.trim()}
        >
          Post
        </button>
      </div>
    </div>
  );
}
