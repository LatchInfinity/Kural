"use client";

import { useMemo, useState, useEffect } from "react";
import { Clock, Play } from "lucide-react";
import { useNewsStore } from "@/store/news-store";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { getArticleHeadlineText, getArticleDisplayText, getCategoryDisplayText, getArticleContentText } from "@/lib/news-text";
import type { NewsItem } from "@/types";
import type { QueueItem } from "@/lib/audio-engine";

function relativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins === 1) return "1 min ago";
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } catch {
    return "";
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

export default function JustNowFeed() {
  const articles = useNewsStore((s) => s.articles);
  const { playNews } = useAppStore();
  const setAudioLanguage = useAudioStore((s) => s.setLanguage);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const sorted = useMemo(
    () =>
      [...articles]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 20),
    [articles],
  );

  const handleListen = (item: NewsItem) => {
    setAudioLanguage("ta");
    const queued = toQueueItem(item);
    playNews(queued, 0, [queued]);
  };

  if (sorted.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
            Just Now
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sorted.map((item, i) => {
            const time = relativeTime(item.publishedAt);
            const isRecent = time.includes("min") || time === "Just now";
            return (
              <div
                key={item.id}
                className="group flex items-start gap-3 p-3 rounded-lg border border-border hover:border-accent/20 hover:bg-surface transition-all"
              >
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRecent ? "bg-emerald-500" : "bg-foreground-secondary/20"
                    }`}
                  />
                  <div className="w-px h-full min-h-[2rem] bg-border" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {item.category && (
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-foreground-secondary/50">
                        {getCategoryDisplayText(item.category, "en")}
                      </span>
                    )}
                    <span className="text-[9px] text-foreground-secondary/30">·</span>
                    <span className="text-[9px] text-foreground-secondary/40">{time}</span>
                  </div>
                  <h3 className="text-xs font-semibold leading-snug text-foreground group-hover:text-red-600 transition-colors line-clamp-2">
                    {getArticleHeadlineText(item, "ta")}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-foreground-secondary/40 truncate">
                      {item.source}
                    </span>
                    <button
                      onClick={() => handleListen(item)}
                      className="ml-auto shrink-0 p-1 rounded text-foreground-secondary/40 hover:text-accent hover:bg-accent/10 transition-colors"
                      aria-label="Listen"
                    >
                      <Play size={11} fill="currentColor" />
                    </button>
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
