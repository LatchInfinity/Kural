"use client";

import { useCallback, useMemo, useRef } from "react";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, ExternalLink, Languages, Pause, Play, Radio, Share2 } from "lucide-react";
import { useNewsStore } from "@/store/news-store";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { useUserStore } from "@/store/user-store";
import { getArticleHeadlineText, getArticleDisplayText, getArticleContentText } from "@/lib/news-text";
import SafeImage from "@/components/safe-image";
import { getCategoryFallbackImageUrl } from "@/lib/category-images";
import type { NewsItem } from "@/types";
import type { QueueItem } from "@/lib/audio-engine";

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

export default function AudioNewsStrip() {
  const articles = useNewsStore((s) => s.articles);
  const scrollRef = useRef<HTMLDivElement>(null);
  const playNews = useAppStore((s) => s.playNews);
  const savedArticles = useAppStore((s) => s.savedArticles);
  const saveArticle = useAppStore((s) => s.saveArticle);
  const unsaveArticle = useAppStore((s) => s.unsaveArticle);
  const addToast = useAppStore((s) => s.addToast);
  const updateDailyTask = useUserStore((s) => s.updateDailyTaskProgress);
  const setAudioLanguage = useAudioStore((s) => s.setLanguage);
  const language = useAudioStore((s) => s.language);
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const toggle = useAudioStore((s) => s.toggle);

  const recent = useMemo(
    () =>
      [...articles]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 20),
    [articles],
  );

  const scroll = (dir: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 350, behavior: "smooth" });
  };

  const shareArticle = useCallback(async (item: NewsItem) => {
    updateDailyTask("share-article", 1);
    const title = getArticleHeadlineText(item, language);
    const text = getArticleDisplayText(item, language);
    const url = item.sourceUrl || (typeof window !== "undefined" ? window.location.href : "");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
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
  }, [addToast, language, updateDailyTask]);

  const toggleSave = useCallback((item: NewsItem) => {
    if (savedArticles.includes(item.id)) {
      unsaveArticle(item.id);
      addToast("Article removed from saved");
      return;
    }

    saveArticle(item.id);
    addToast("Article saved ✓");
    updateDailyTask("save-articles", 1);
  }, [addToast, saveArticle, savedArticles, unsaveArticle, updateDailyTask]);

  if (recent.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Radio size={16} className="text-red-600" />
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
            Today&apos;s Audio News
          </h2>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll(-1)}
              className="p-1 rounded text-foreground-secondary/40 hover:text-foreground hover:bg-surface transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="p-1 rounded text-foreground-secondary/40 hover:text-foreground hover:bg-surface transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-none -mx-4 px-4 pb-2"
        >
          {recent.map((item, itemIndex) => {
            const isCurrent = currentTrack?.id === item.id;
            const isSaved = savedArticles.includes(item.id);
            const languageLabel = language === "ta" ? "Switch voice to English" : "Switch voice to Tamil";
            return (
              <div
                key={item.id}
                className="group w-[260px] shrink-0 rounded-lg border border-border overflow-hidden hover:border-red-600/30 hover:shadow-md transition-all bg-surface"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-secondary">
                  <SafeImage
                    src={item.aiImageUrl}
                    aiSrc={item.imageUrl}
                    fallbackSrc={getCategoryFallbackImageUrl(item.category, true)}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallback={<div className="w-full h-full flex items-center justify-center text-3xl text-foreground-secondary/20">🎧</div>}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <button
                    onClick={() => {
                      if (isCurrent) {
                        toggle();
                      } else {
                        setAudioLanguage(language);
                        const queued = toQueueItem(item);
                        playNews(queued, itemIndex, recent.map(toQueueItem));
                      }
                    }}
                    className="absolute bottom-2 left-2 p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
                    aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause size={14} fill="currentColor" />
                    ) : (
                      <Play size={14} fill="currentColor" />
                    )}
                  </button>
                  {item.audioDuration && (
                    <span className="absolute bottom-2 right-2 text-[9px] font-semibold text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
                      {item.audioDuration}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-bold leading-snug text-foreground line-clamp-2 mb-1">
                    {getArticleHeadlineText(item, language)}
                  </h3>
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-border-light pt-2">
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex min-w-0 items-center gap-1 text-[9px] font-semibold text-foreground-secondary/50 transition-colors hover:text-accent"
                        aria-label={`Open original source: ${item.source || "news source"}`}
                      >
                        <span className="truncate">{item.source || "Source"}</span>
                        <ExternalLink size={10} className="shrink-0" />
                      </a>
                    ) : (
                      <span className="min-w-0 truncate text-[9px] font-semibold text-foreground-secondary/40">{item.source}</span>
                    )}

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAudioLanguage(language === "ta" ? "en" : "ta");
                        }}
                        className="grid h-7 w-7 place-items-center rounded-full text-foreground-secondary/50 transition-colors hover:bg-accent/10 hover:text-accent"
                        aria-label={languageLabel}
                        title={languageLabel}
                      >
                        <Languages size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void shareArticle(item);
                        }}
                        className="grid h-7 w-7 place-items-center rounded-full text-foreground-secondary/50 transition-colors hover:bg-accent/10 hover:text-accent"
                        aria-label="Share article"
                      >
                        <Share2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSave(item);
                        }}
                        className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-accent/10"
                        style={{ color: isSaved ? "var(--color-accent)" : "color-mix(in oklab, var(--color-foreground-secondary) 50%, transparent)" }}
                        aria-label={isSaved ? "Unsave article" : "Save article"}
                      >
                        {isSaved ? <BookmarkCheck size={12} style={{ fill: "var(--color-accent)" }} /> : <Bookmark size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
