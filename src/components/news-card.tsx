"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Share2, BookmarkCheck, Clock, ExternalLink, Play, Languages } from "lucide-react";
import NewsImageSection from "@/components/news-image-section";
import type { NewsItem } from "@/types";
import type { QueueItem } from "@/lib/audio-engine";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { useUserStore } from "@/store/user-store";
import { useNewsStore } from "@/store/news-store";
import { getArticleContentText, getArticleDisplayText, getArticleHeadlineText, getCategoryDisplayText } from "@/lib/news-text";
import { resolveNewsAnimationScene } from "@/lib/news-animation";

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return dateStr;
  }
}

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

export type NewsCardLanguage = "ta" | "en";

export default function NewsCard({
  item,
  index,
  language = "ta",
  renderLanguage,
  onLanguageChange,
  animatedThumbnail = true,
}: {
  item: NewsItem;
  index: number;
  language?: NewsCardLanguage;
  renderLanguage?: NewsCardLanguage;
  onLanguageChange?: (language: NewsCardLanguage) => void;
  animatedThumbnail?: boolean;
}) {
  const playNews = useAppStore((s) => s.playNews);
  const activeNav = useAppStore((s) => s.activeNav);
  const audioArticleId = useAudioStore((s) => s.articleId);
  const audioCurrentTrack = useAudioStore((s) => s.currentTrack);
  const audioIsPlaying = useAudioStore((s) => s.isPlaying);
  const setAudioLanguage = useAudioStore((s) => s.setLanguage);
  const setPopupOpen = useAudioStore((s) => s.setPopupOpen);
  const savedArticles = useAppStore((s) => s.savedArticles);
  const saveArticle = useAppStore((s) => s.saveArticle);
  const unsaveArticle = useAppStore((s) => s.unsaveArticle);
  const addToast = useAppStore((s) => s.addToast);
  const trackReading = useUserStore((s) => s.trackReading);
  const updateDailyTask = useUserStore((s) => s.updateDailyTaskProgress);

  const isCurrentlyPlaying = audioArticleId === item.id && (audioIsPlaying || Boolean(audioCurrentTrack));
  const isSaved = savedArticles.includes(item.id);
  const textLanguage = renderLanguage || language;
  const displayHeadline = getArticleHeadlineText(item, textLanguage);
  const displaySummary = getArticleDisplayText(item, textLanguage);
  const [savedAnimation, setSavedAnimation] = useState({
    id: item.id,
    scene: item.animationScene || "",
  });
  const cachedAnimationScene = savedAnimation.id === item.id ? savedAnimation.scene : item.animationScene || "";

  const animationScene = useMemo(() => {
    return resolveNewsAnimationScene({
      animationScene: cachedAnimationScene || item.animationScene,
      category: item.category,
      title: item.title,
      headline: item.headline,
      summary: item.tamilSummary || item.summary,
      content: item.content,
      source: item.source,
      retention: item.retention,
      isBreaking: item.isBreaking,
    });
  }, [
    cachedAnimationScene,
    item.animationScene,
    item.category,
    item.title,
    item.headline,
    item.tamilSummary,
    item.summary,
    item.content,
    item.source,
    item.retention,
    item.isBreaking,
  ]);

  useEffect(() => {
    if (!animatedThumbnail || cachedAnimationScene || item.animationScene) return;

    const controller = new AbortController();
    void fetch("/api/news/animation-scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newsId: item.id,
        category: item.category,
        title: item.title,
        headline: item.headline,
        summary: item.tamilSummary || item.summary,
        content: item.content,
        source: item.source,
        retention: item.retention,
        isBreaking: item.isBreaking,
      }),
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() as Promise<{ scene?: string }> : null)
      .then((data) => {
        if (data?.scene) {
          setSavedAnimation({
            id: item.id,
            scene: data.scene || cachedAnimationScene,
          });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => controller.abort();
  }, [
    animatedThumbnail,
    cachedAnimationScene,
    item.animationScene,
    item.id,
    item.category,
    item.title,
    item.headline,
    item.tamilSummary,
    item.summary,
    item.content,
    item.source,
    item.retention,
    item.isBreaking,
  ]);

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    trackReading();
    setAudioLanguage(language);
    const playItem = toQueueItem(item);
    const storeArticles = useNewsStore.getState().articles;

    if (activeNav === "audio-news") {
      playNews(playItem, index, storeArticles.map(toQueueItem));
      setPopupOpen(false);
    } else {
      playNews(playItem, 0, [playItem]);
    }
  }, [item, activeNav, index, playNews, setPopupOpen, trackReading, setAudioLanguage, language]);

  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      unsaveArticle(item.id);
      addToast("Article removed from saved");
      return;
    }
    saveArticle(item.id);
    addToast("Article saved ✓");
    updateDailyTask("save-articles", 1);
  }, [isSaved, item.id, unsaveArticle, addToast, saveArticle, updateDailyTask]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    updateDailyTask("share-article", 1);
    const url = item.sourceUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: displayHeadline, text: displaySummary, url });
        return;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      addToast("Link copied ✓");
    } catch {
      addToast("Could not copy link", "error");
    }
  }, [item.sourceUrl, displayHeadline, displaySummary, updateDailyTask, addToast]);

  const handleLanguageToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const next = language === "ta" ? "en" : "ta";
    onLanguageChange?.(next);
    setAudioLanguage(next);
  }, [language, onLanguageChange, setAudioLanguage]);

  const ago = useMemo(() => timeAgo(item.publishedAt), [item.publishedAt]);
  const categoryLabel = getCategoryDisplayText(item.category, textLanguage);
  const languageLabel = language === "ta" ? "Switch voice to English" : "Switch voice to Tamil";

  return (
    <article className="kural-news-card group rounded-[22px] overflow-hidden transition-all duration-200 ease-out bg-surface border border-border">
      <div className="relative">
        <NewsImageSection
          category={item.category}
          headline={displayHeadline}
          summary={displaySummary}
          source={item.source}
          aiVideoUrl={item.aiVideoUrl || ""}
          videoThumbnail={item.videoThumbnail || item.aiImageUrl || item.imageUrl}
          imageUrl={item.imageUrl}
          aiImageUrl={item.aiImageUrl || ""}
          videoDuration={item.videoDuration || 5}
          animationScene={animationScene}
          isCurrentlyPlaying={isCurrentlyPlaying}
          onPlay={handlePlay}
          publishedAt={item.publishedAt}
          variant={animatedThumbnail ? "animated" : "compact"}
        />
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="notranslate flex items-center justify-between gap-3" translate="no">
          <span className="inline-flex max-w-[70%] items-center rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent truncate">
            {categoryLabel}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-foreground-secondary/60 shrink-0">
            <Clock size={10} />
            {ago}
          </span>
        </div>

        <h3
          className="text-[15px] font-extrabold leading-snug text-foreground group-hover:text-accent transition-colors"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {displayHeadline}
        </h3>

        <p
          className="text-xs leading-5 text-foreground-secondary/70 min-h-[40px]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {displaySummary}
        </p>

        <div className="notranslate pt-3 border-t border-border-light" translate="no">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] text-foreground-secondary/40">Source</div>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex max-w-[140px] items-center gap-1 text-[11px] font-bold text-foreground-secondary/80 transition-colors hover:text-accent"
                aria-label={`Open original source: ${item.source || "news source"}`}
              >
                <span className="truncate">{item.source || "Original source"}</span>
                <ExternalLink size={11} className="shrink-0" />
              </a>
            ) : (
              <div className="text-[11px] font-bold text-foreground-secondary/80 truncate max-w-[140px]">{item.source}</div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-1.5">
            <button
              onClick={handleLanguageToggle}
              aria-label={languageLabel}
              title={languageLabel}
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground-secondary/70 hover:text-accent hover:border-accent/20 hover:bg-accent/10 transition-colors cursor-pointer"
            >
              <Languages size={12} />
            </button>
            <button
              onClick={handlePlay}
              aria-label="Listen to this article"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-[11px] font-bold text-white shadow-sm hover:bg-accent-soft transition-colors cursor-pointer"
            >
              <Play size={12} fill="currentColor" />
              Listen
            </button>
            <button
              onClick={handleShare}
              aria-label="Share this article"
              className="p-2 rounded-full text-foreground-secondary/50 hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
            >
              <Share2 size={13} />
            </button>
            <button
              onClick={handleSave}
              aria-label={isSaved ? "Unsave article" : "Save article"}
              className="p-2 rounded-full hover:bg-accent/10 transition-colors cursor-pointer"
              style={{ color: isSaved ? "var(--color-accent)" : "color-mix(in oklab, var(--color-foreground-secondary) 50%, transparent)" }}
            >
              {isSaved ? <BookmarkCheck size={13} style={{ fill: "var(--color-accent)" }} /> : <Bookmark size={13} />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
