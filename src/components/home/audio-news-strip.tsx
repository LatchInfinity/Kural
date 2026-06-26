"use client";

import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Clock, Radio } from "lucide-react";
import { useNewsStore } from "@/store/news-store";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
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
  const { playNews } = useAppStore();
  const setAudioLanguage = useAudioStore((s) => s.setLanguage);
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

  if (recent.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Radio size={16} className="text-red-600" />
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
            Today's Audio News
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
          {recent.map((item) => {
            const isCurrent = currentTrack?.id === item.id;
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
                        setAudioLanguage("ta");
                        const queued = toQueueItem(item);
                        playNews(queued, 0, [queued]);
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
                    {getArticleHeadlineText(item, "ta")}
                  </h3>
                  <p className="text-[9px] text-foreground-secondary/40 truncate">
                    {item.source}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
