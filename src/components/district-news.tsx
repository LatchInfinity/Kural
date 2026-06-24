"use client";
import { useEffect, useState, useMemo } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import NewsCard, { type NewsCardLanguage } from "@/components/news-card";
import type { NewsItem } from "@/types";
import { NEWS_PER_CATEGORY } from "@/lib/news-config";

const DISTRICT_LIST = [
  "Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Erode",
  "Tirunelveli", "Thoothukudi", "Vellore", "Kanyakumari", "Tiruppur",
  "Dindigul", "Kanchipuram", "Nagapattinam", "Cuddalore", "Dharmapuri",
  "Krishnagiri", "Sivagangai", "Ramanathapuram", "Karur", "Namakkal",
  "Virudhunagar", "Ariyalur", "Theni", "Tiruvannamalai", "Viluppuram",
  "Perambalur", "Pudukkottai", "Tenkasi", "Thirupathur", "Kallakurichi",
  "Tiruvallur", "Chengalpattu", "Mayiladuthurai", "Ranipet",
];

export default function DistrictNews({
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
  const [selectedDistrict, setSelectedDistrict] = useState<string>(DISTRICT_LIST[0]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/news?district=${encodeURIComponent(selectedDistrict)}&limit=${NEWS_PER_CATEGORY}&retention=active`)
      .then((r) => r.json())
      .then((data) => {
        if (data.articles) setArticles(data.articles);
      })
      .catch(() => {});
  }, [selectedDistrict]);

  const districtArticles = useMemo(() => {
    const grouped: Record<string, NewsItem[]> = {};
    for (const a of articles) {
      const d = a.district || "Other";
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(a);
    }
    return grouped;
  }, [articles]);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={16} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-sm font-bold tracking-tight text-foreground">Tamil Nadu District News</h2>
        <div className="h-[1px] flex-1" style={{ background: "linear-gradient(90deg, var(--color-accent)30, transparent)" }} />
      </div>

      <div className="relative mb-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold rounded-sm bg-surface border border-border cursor-pointer"
        >
          <MapPin size={12} />
          {selectedDistrict}
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 w-48 max-h-64 overflow-y-auto bg-surface border border-border rounded-sm shadow-lg z-20">
            {DISTRICT_LIST.map((d) => (
              <button
                key={d}
                onClick={() => { setSelectedDistrict(d); setOpen(false); }}
                className="block w-full text-left px-3 py-1.5 text-[11px] hover:bg-surface-highlight transition-colors cursor-pointer"
                style={{
                  color: selectedDistrict === d ? "var(--color-accent)" : "var(--color-foreground-secondary)",
                  background: selectedDistrict === d ? "var(--color-accent-muted)" : "transparent",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {districtArticles[selectedDistrict]?.length > 0 ? (
        <div className="kural-news-grid">
          {districtArticles[selectedDistrict].slice(0, NEWS_PER_CATEGORY).map((item, i) => (
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
      ) : (
        <p className="text-[11px] text-foreground-secondary/40 py-4">No news for {selectedDistrict} district yet</p>
      )}
    </section>
  );
}
