"use client";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import NewsCard, { type NewsCardLanguage } from "@/components/news-card";
import type { NewsItem } from "@/types";

export default function TrendingSection({
  language = "ta",
  renderLanguage,
  onLanguageChange,
  animatedThumbnail = false,
}: {
  language?: NewsCardLanguage;
  renderLanguage?: NewsCardLanguage;
  onLanguageChange?: (language: NewsCardLanguage) => void;
  animatedThumbnail?: boolean;
}) {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news/trending?limit=6")
      .then((r) => r.json())
      .then((data) => {
        if (data.articles) setArticles(data.articles);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (articles.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} style={{ color: "var(--color-breaking)" }} />
        <h2 className="text-sm font-bold tracking-tight text-foreground">Trending Tamil Nadu</h2>
        <div className="h-[1px] flex-1" style={{ background: "linear-gradient(90deg, var(--color-breaking-glow), transparent)" }} />
      </div>
      <div className="kural-news-grid">
        {articles.map((item, i) => (
          <NewsCard
            key={item.id}
            item={item}
            index={i}
            language={language}
            renderLanguage={renderLanguage}
            onLanguageChange={onLanguageChange}
            animatedThumbnail={animatedThumbnail}
          />
        ))}
      </div>
    </section>
  );
}
