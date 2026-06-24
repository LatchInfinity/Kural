"use client";
import { useNewsStore } from "@/store/news-store";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { Play } from "lucide-react";
import SafeImage from "@/components/safe-image";
import type { NewsItem } from "@/types";
import type { QueueItem } from "@/lib/audio-engine";
import { getArticleContentText, getArticleDisplayText, getArticleHeadlineText, getCategoryDisplayText, type NewsTextLanguage } from "@/lib/news-text";

export default function RelatedNewsPanel({ currentId, category, language }: { currentId: string; category?: string; language?: NewsTextLanguage }) {
  const articles = useNewsStore((s) => s.articles);
  const playNews = useAppStore((s) => s.playNews);
  const audioLanguage = useAudioStore((s) => s.language);
  const setAudioLanguage = useAudioStore((s) => s.setLanguage);
  const setPopupOpen = useAudioStore((s) => s.setPopupOpen);
  const displayLanguage = language || audioLanguage;

  const related = articles
    .filter((n) => n.id !== currentId && (!category || n.category === category))
    .slice(0, 5);

  if (related.length === 0) return null;

  const toQueueItem = (n: NewsItem): QueueItem => ({
    id: n.id,
    headline: n.headline,
    englishHeadline: n.englishHeadline,
    imageUrl: n.imageUrl,
    aiImageUrl: n.aiImageUrl,
    tamilSummary: getArticleDisplayText(n, "ta"),
    englishSummary: getArticleDisplayText(n, "en"),
    content: getArticleContentText(n, "ta"),
    source: n.source,
    sourceUrl: n.sourceUrl,
    category: n.category,
    publishedAt: n.publishedAt,
  });

  const handlePlay = (item: NewsItem) => {
    const queue = articles.map(toQueueItem);
    const index = Math.max(0, articles.findIndex((n) => n.id === item.id));
    setAudioLanguage(displayLanguage);
    playNews(toQueueItem(item), index, queue);
    setPopupOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <p className="notranslate text-xs font-semibold text-foreground-secondary uppercase tracking-[1px] mb-3" translate="no">Related News</p>
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {related.map((n) => (
          <button
            key={n.id}
            onClick={() => handlePlay(n)}
            className="flex items-start gap-2.5 w-full text-left p-2 rounded-sm hover:bg-surface-highlight transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-sm overflow-hidden shrink-0">
              <SafeImage src={n.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                {getArticleHeadlineText(n, displayLanguage)}
              </p>
              <div className="notranslate flex items-center gap-2 mt-0.5" translate="no">
                <span className="text-[9px] text-foreground-secondary/50">{n.source}</span>
                {n.category && (
                  <span className="text-[8px] px-1 py-0.5 bg-accent/10 text-accent rounded-sm font-medium">{getCategoryDisplayText(n.category, displayLanguage)}</span>
                )}
              </div>
            </div>
            <Play size={10} className="text-foreground-secondary/30 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
