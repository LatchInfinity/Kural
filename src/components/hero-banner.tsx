"use client";
import { useMemo } from "react";
import { Play, Clock } from "lucide-react";
import { useNewsStore } from "@/store/news-store";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { getCategoryEmoji } from "@/lib/category-images";
import { getArticleDisplayText, getArticleHeadlineText, getCategoryDisplayText, type NewsTextLanguage } from "@/lib/news-text";

export default function HeroBanner({
  language = "ta",
  renderLanguage,
}: {
  language?: NewsTextLanguage;
  renderLanguage?: NewsTextLanguage;
}) {
  const articles = useNewsStore((s) => s.articles);
  const hero = useMemo(
    () => articles.find((n) => n.isBreaking || n.retention === "breaking"),
    [articles]
  );
  const playNews = useAppStore((s) => s.playNews);
  const setAudioLanguage = useAudioStore((s) => s.setLanguage);
  const textLanguage = renderLanguage || language;
  const displayHeadline = hero ? getArticleHeadlineText(hero, textLanguage) : "";
  const displaySummary = hero ? getArticleDisplayText(hero, textLanguage) : "";
  const displayCategory = hero ? getCategoryDisplayText(hero.category, textLanguage) : "";

  const handlePlay = () => {
    if (!hero) return;
    setAudioLanguage(language);
    playNews({
      id: hero.id, headline: hero.headline, englishHeadline: hero.englishHeadline, imageUrl: hero.imageUrl,
      tamilSummary: hero.tamilSummary, englishSummary: hero.englishSummary,
      content: hero.content,
      source: hero.source, category: hero.category, publishedAt: hero.publishedAt,
    }, 0, [{
      id: hero.id, headline: hero.headline, englishHeadline: hero.englishHeadline, imageUrl: hero.imageUrl,
      tamilSummary: hero.tamilSummary, englishSummary: hero.englishSummary,
      content: hero.content,
      source: hero.source, category: hero.category, publishedAt: hero.publishedAt,
    }]);
  };

  if (!hero) return null;

  return (
    <section className="relative w-full overflow-hidden rounded-none sm:rounded-lg bg-surface border border-border">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-3 relative min-h-[300px] sm:min-h-[400px] lg:min-h-[460px] flex flex-col items-center justify-center" style={{ background: "#0F172A" }}>
          <div className="notranslate flex flex-col items-center gap-3" translate="no">
            <span className="text-6xl leading-none">{getCategoryEmoji(hero.category)}</span>
            <span className="text-xl font-bold text-white/90">{displayCategory}</span>
            <div className="flex items-end gap-[3px] mt-1">
              {[0.3, 0.7, 0.2, 0.9, 0.4].map((h, i) => (
                <div key={i}
                  className="w-[3px] rounded-full animate-eq-bar"
                  style={{
                    height: `${10 + h * 24}px`,
                    background: "#60A5FA",
                    opacity: 0.5,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: "1.4s",
                  }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handlePlay}
            className="notranslate absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all duration-150"
            translate="no"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(96, 165, 250, 0.2)"; e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            <Play size={14} fill="rgba(255,255,255,0.8)" color="rgba(255,255,255,0.8)" />
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Listen</span>
          </button>
        </div>
        <div className="lg:col-span-2 p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
          <div className="notranslate flex items-center gap-2 mb-3" translate="no">
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-breaking text-white text-[10px] font-bold rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-live" />
              BREAKING
            </span>
            <span className="text-[10px] text-foreground-secondary/50">{displayCategory}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight mb-3 text-foreground">
            {displayHeadline}
          </h1>
          <p className="text-sm text-foreground-secondary/80 leading-relaxed mb-4 line-clamp-3">
            {displaySummary}
          </p>
          <div className="notranslate flex items-center gap-3 text-[11px] text-foreground-secondary/50 mt-auto" translate="no">
            <span>{hero.source}</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {hero.publishedAt}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
