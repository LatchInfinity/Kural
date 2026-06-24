"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Clock, ExternalLink, Volume2 } from "lucide-react";
import { useNewsStore } from "@/store/news-store";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { getArticleHeadlineText, getArticleDisplayText, getCategoryDisplayText, getArticleContentText } from "@/lib/news-text";
import SafeImage from "@/components/safe-image";
import { getCategoryFallbackImageUrl } from "@/lib/category-images";
import type { NewsItem } from "@/types";
import type { QueueItem } from "@/lib/audio-engine";

function formatDeskTime(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
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

export default function TopStory() {
  const articles = useNewsStore((s) => s.articles);
  const { playNews } = useAppStore();
  const setAudioLanguage = useAudioStore((s) => s.setLanguage);

  const top = useMemo(() => {
    const breaking = articles.filter((n) => n.isBreaking || n.retention === "breaking");
    return (breaking.length > 0 ? breaking : articles).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )[0];
  }, [articles]);

  const handleListen = () => {
    if (!top) return;
    setAudioLanguage("ta");
    const queued = toQueueItem(top);
    playNews(queued, 0, [queued]);
  };

  if (!top) return null;

  const thumbnail = top.aiImageUrl || top.imageUrl || getCategoryFallbackImageUrl(top.category);
  const duration = top.audioDuration;

  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <motion.div
          key={top.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
        >
          <div className="relative aspect-[16/9] lg:aspect-auto lg:h-full min-h-[280px] rounded-lg overflow-hidden bg-surface border border-border">
            <SafeImage
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
              fallback={<div className="w-full h-full flex items-center justify-center text-foreground-secondary/20 text-6xl">📰</div>}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {top.category && (
              <span className="absolute top-3 left-3 inline-flex items-center rounded-sm bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                {getCategoryDisplayText(top.category, "en")}
              </span>
            )}
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground-secondary/60">
              {top.source && <span>{top.source}</span>}
              <span className="w-1 h-1 rounded-full bg-foreground-secondary/30" />
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatDeskTime(top.publishedAt)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-foreground">
              {getArticleHeadlineText(top, "ta")}
            </h1>

            <p className="text-sm leading-7 text-foreground-secondary/80 line-clamp-3">
              {getArticleDisplayText(top, "ta")}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
              <button
                onClick={handleListen}
                className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-red-700 transition-colors"
              >
                <Play size={14} fill="currentColor" />
                Listen Now
              </button>
              <button
                onClick={handleListen}
                className="inline-flex items-center gap-2 rounded-sm border border-border px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-foreground-secondary hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <ExternalLink size={14} />
                Open Article
              </button>
              {duration && (
                <span className="flex items-center gap-1.5 text-[10px] text-foreground-secondary/50">
                  <Volume2 size={12} />
                  {duration}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
