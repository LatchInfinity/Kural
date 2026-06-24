"use client";

import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Clock } from "lucide-react";
import { useNewsStore } from "@/store/news-store";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { getArticleHeadlineText, getArticleDisplayText, getArticleContentText, getCategoryDisplayText } from "@/lib/news-text";
import { NEWS_PER_CATEGORY } from "@/lib/news-config";
import SafeImage from "@/components/safe-image";
import { getCategoryFallbackImageUrl } from "@/lib/category-images";
import type { NewsItem } from "@/types";
import type { QueueItem } from "@/lib/audio-engine";

const CATEGORIES = [
  { key: "தமிழ்நாடு அரசியல்", label: "Politics", icon: "🗳️" },
  { key: "தமிழ்நாடு வானிலை", label: "Weather", icon: "🌤️" },
  { key: "தமிழ்நாடு வேளாண்மை", label: "Agriculture", icon: "🌾" },
  { key: "தமிழ்நாடு வணிகம்", label: "Business", icon: "💼" },
  { key: "தமிழ்நாடு கல்வி", label: "Education", icon: "📚" },
  { key: "தமிழ்நாடு தொழில்நுட்பம்", label: "Technology", icon: "💻" },
  { key: "தமிழ்நாடு விபத்து", label: "Accident", icon: "⚠️" },
  { key: "தமிழ்நாடு குற்றம்", label: "Crime", icon: "🔍" },
  { key: "தமிழ்நாடு அரசு", label: "Government", icon: "🏛️" },
  { key: "தமிழ்நாடு போக்குவரத்து", label: "Transport", icon: "🚆" },
  { key: "தமிழ்நாடு விளையாட்டு", label: "Sports", icon: "🏏" },
  { key: "தமிழ்நாடு உள்ளூர்", label: "Local", icon: "📍" },
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

function CategoryStrip({
  category,
  label,
  icon,
  articles,
}: {
  category: string;
  label: string;
  icon: string;
  articles: NewsItem[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playNews } = useAppStore();
  const setAudioLanguage = useAudioStore((s) => s.setLanguage);

  const scroll = (dir: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  const handleListen = (item: NewsItem) => {
    setAudioLanguage("ta");
    const queued = toQueueItem(item);
    playNews(queued, 0, [queued]);
  };

  if (articles.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">
          {label}
        </h2>
        <span className="text-[9px] text-foreground-secondary/40 font-semibold">
          {category}
        </span>
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
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4"
      >
        {articles.map((item) => {
          const thumbnail = item.aiImageUrl || item.imageUrl || getCategoryFallbackImageUrl(item.category);
          return (
            <div
              key={item.id}
              className="group w-[220px] shrink-0 rounded-lg border border-border overflow-hidden hover:border-accent/20 hover:shadow-sm transition-all bg-surface"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-secondary">
                <SafeImage
                  src={thumbnail}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  fallback={<div className="w-full h-full flex items-center justify-center text-2xl text-foreground-secondary/20">{icon}</div>}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-3">
                <h3 className="text-xs font-bold leading-snug text-foreground line-clamp-2 mb-2">
                  {getArticleHeadlineText(item, "ta")}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] text-foreground-secondary/40 truncate">
                      {item.source}
                    </p>
                    <p className="text-[9px] text-foreground-secondary/30 flex items-center gap-1">
                      <Clock size={8} />
                      {formatDeskTime(item.publishedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleListen(item)}
                    className="shrink-0 p-1.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    aria-label="Play"
                  >
                    <Play size={11} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function CategoryStrips() {
  const articles = useNewsStore((s) => s.articles);

  const grouped = useMemo(() => {
    const result: Record<string, NewsItem[]> = {};
    for (const cat of CATEGORIES) {
      result[cat.key] = articles
        .filter((a) => a.category === cat.key)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, NEWS_PER_CATEGORY);
    }
    return result;
  }, [articles]);

  const hasAny = CATEGORIES.some((cat) => (grouped[cat.key]?.length ?? 0) > 0);
  if (!hasAny) return null;

  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
            News by Category
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        {CATEGORIES.map((cat) => (
          <CategoryStrip
            key={cat.key}
            category={cat.key}
            label={cat.label}
            icon={cat.icon}
            articles={grouped[cat.key] || []}
          />
        ))}
      </div>
    </section>
  );
}
