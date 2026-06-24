"use client";
import Image from "next/image";
import { useState, useMemo, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { useNewsStore } from "@/store/news-store";
import { useUserStore } from "@/store/user-store";
import { getCategoryEmoji } from "@/lib/category-images";
import {
  Home, Headphones, Newspaper, Flame, User,
  Search, Bell, Play, Pause, Clock, Bookmark, Share2,
  SkipBack, SkipForward, Volume2, X, ChevronUp, ChevronDown, Award, Star, Target, Check,
  BookmarkCheck, RotateCcw, Languages, Mic, RefreshCw,
  Heart, TrendingUp, ThumbsUp,
} from "lucide-react";
import CommentsSection from "@/components/comments-section";
import RelatedNewsPanel from "@/components/related-news";
import { AudioEngine, type QueueItem, type VoiceInfo } from "@/lib/audio-engine";
import { getArticleContentText, getArticleHeadlineText } from "@/lib/news-text";
import type { DailyTask, NewsItem, ReactionType, StreakData, UserProfile } from "@/types";

const CATEGORIES = [
  { key: "Politics", label: "அரசியல்", emoji: "🏛" },
  { key: "Accident", label: "விபத்து", emoji: "⚠" },
  { key: "Crime", label: "குற்றம்", emoji: "🛡" },
  { key: "Agriculture", label: "வேளாண்மை", emoji: "🌾" },
  { key: "Weather", label: "வானிலை", emoji: "🌧" },
  { key: "Government", label: "அரசு", emoji: "🏢" },
  { key: "Technology", label: "டெக்", emoji: "🧠" },
  { key: "Health", label: "சுகாதாரம்", emoji: "🏥" },
  { key: "Sports", label: "விளையாட்டு", emoji: "🏏" },
  { key: "Business", label: "வணிகம்", emoji: "📈" },
  { key: "Railway", label: "போக்குவரத்து", emoji: "🚆" },
  { key: "Education", label: "கல்வி", emoji: "🎓" },
  { key: "Court", label: "நீதிமன்றம்", emoji: "⚖" },
];

const CATEGORY_MATCHES: Record<string, string[]> = {
  Politics: ["தமிழ்நாடு அரசியல்", "அரசியல்", "Politics"],
  Government: ["தமிழ்நாடு அரசு", "அரசு", "Government"],
  Accident: ["தமிழ்நாடு விபத்து", "விபத்து", "Accident", "Factory Accident", "Gas Leak", "Ammonia"],
  Crime: ["தமிழ்நாடு குற்றம்", "குற்றம்", "Crime", "Police", "Court"],
  Agriculture: ["தமிழ்நாடு வேளாண்மை", "வேளாண்மை", "Agriculture", "Farmers"],
  Weather: ["தமிழ்நாடு வானிலை", "வானிலை", "Weather", "Rain"],
  Technology: ["தமிழ்நாடு தொழில்நுட்பம்", "தொழில்நுட்பம்", "Technology", "AI"],
  Health: ["சுகாதாரம்", "Health", "மருத்துவ"],
  Sports: ["தமிழ்நாடு விளையாட்டு", "விளையாட்டு", "Sports", "Cricket"],
  Business: ["தமிழ்நாடு வணிகம்", "வணிகம்", "Business"],
  Education: ["தமிழ்நாடு கல்வி", "கல்வி", "Education"],
  Railway: ["தமிழ்நாடு போக்குவரத்து", "போக்குவரத்து", "Railway", "Train", "Metro"],
  Court: ["நீதிமன்றம்", "Court"],
};

const HORIZONTAL_SECTIONS: { id: string; label: string; icon: string; categoryFilter?: string }[] = [
  { id: "trending", label: "இப்போது டிரெண்டிங்", icon: "🔥" },
  { id: "tamilnadu", label: "தமிழ்நாடு மட்டும்", icon: "🏛", categoryFilter: "தமிழ்நாடு" },
  { id: "politics", label: "அரசியல்", icon: "🗳", categoryFilter: "தமிழ்நாடு அரசியல்" },
  { id: "sports", label: "விளையாட்டு", icon: "🏏", categoryFilter: "தமிழ்நாடு விளையாட்டு" },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatArticleDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  "listen-articles": <Headphones size={16} />,
  "listen-duration": <Clock size={16} />,
  "listen-categories": <Target size={16} />,
  "save-articles": <Bookmark size={16} />,
  "share-article": <Share2 size={16} />,
};

export default function MobileHome() {
  const { activeNav, setActiveNav } = useAppStore();
  const playNews = useAppStore((s) => s.playNews);
  const setPopupOpen = useAudioStore((s) => s.setPopupOpen);

  const storeArticles = useNewsStore((s) => s.articles);
  const refreshNews = useNewsStore((s) => s.refresh);
  const newsLoading = useNewsStore((s) => s.loading);
  const lastUpdated = useNewsStore((s) => s.lastUpdated);
  const hasNewArticles = useNewsStore((s) => s.hasNewArticles);
  const newArticlesCount = useNewsStore((s) => s.newArticlesCount);
  const acceptNewArticles = useNewsStore((s) => s.acceptNewArticles);
  const currentUser = useUserStore((s) => s.currentUser);
  const streaks = useUserStore((s) => s.getStreaks)();

  const [showStreak, setShowStreak] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const newsData = useMemo(() => {
    const seen = new Map<string, NewsItem>();
    for (const item of storeArticles) {
      if (item.retention !== "archived") seen.set(item.id, item);
    }
    return Array.from(seen.values());
  }, [storeArticles]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning ☀️";
    if (h < 17) return "Good Afternoon 🌤";
    return "Good Evening 🌙";
  })();

  const visibleNews = useMemo(() => {
    if (!selectedCategory) return newsData;
    const terms = CATEGORY_MATCHES[selectedCategory] || [selectedCategory];
    return newsData.filter((item) => {
      const haystack = `${item.category || ""} ${item.headline || ""} ${item.summary || ""}`.toLowerCase();
      return terms.some((term) => haystack.includes(term.toLowerCase()));
    });
  }, [newsData, selectedCategory]);

  const featured = visibleNews[0] || newsData[0];
  const feed = visibleNews.slice(0, 20);
  const sourceCount = useMemo(() => new Set(newsData.map((item) => item.source).filter(Boolean)).size, [newsData]);
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return "Opening live feed";
    return new Intl.DateTimeFormat("ta-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(lastUpdated));
  }, [lastUpdated]);

  const sectionArticles = useMemo(() => {
    const result: Record<string, NewsItem[]> = {};
    for (const section of HORIZONTAL_SECTIONS) {
      if (section.id === "trending") {
        result.trending = visibleNews.slice(0, 6);
      } else if (section.categoryFilter) {
        const filtered = visibleNews
          .filter((a) => a.category && a.category.includes(section.categoryFilter!))
          .slice(0, 6);
        if (filtered.length > 0) result[section.id] = filtered;
      }
    }
    return result;
  }, [visibleNews]);

  if (showStreak) return <StreakSheetView onClose={() => setShowStreak(false)} currentUser={currentUser} streaks={streaks} />;
  if (showProfile) return <MobileProfileView onClose={() => setShowProfile(false)} />;

  const section = activeNav === "home" ? "home" : activeNav === "audio-news" ? "audio" : activeNav === "saved" ? "saved" : "home";

  if (section === "audio") {
    return (
      <div className="mobile-layout">
        <MobileHeader
          greeting="Audio News 🎧"
          subtitle="Listen to the latest stories"
          onProfile={() => setShowProfile(true)}
        />
        <div className="px-4 flex flex-col gap-3 pb-4 mt-2">
          {feed.map((item, i) => (
            <NewsCard key={item.id} item={item} feed={feed} index={i} playNews={playNews} onPlay={() => setPopupOpen(true)} />
          ))}
          {feed.length === 0 && (
            <div className="px-4 py-16 text-center">
              <Headphones size={48} className="mx-auto mb-4" style={{ color: "var(--mobile-accent)", opacity: 0.3 }} />
              <p className="text-sm" style={{ color: "var(--mobile-text-secondary)" }}>No audio news available</p>
            </div>
          )}
        </div>
        <MobileBottomNav active={section} onNav={(s) => setActiveNav(s === "home" ? "home" : s === "audio" ? "audio-news" : s === "saved" ? "saved" : s)} onStreak={() => setShowStreak(true)} onProfile={() => setShowProfile(true)} />
      </div>
    );
  }

  if (section === "saved") {
    return (
      <div className="mobile-layout">
        <MobileHeader
          greeting="Saved Articles 📰"
          subtitle="Your bookmarked news"
          onProfile={() => setShowProfile(true)}
        />
        <div className="px-4 py-6 text-center">
          <Bookmark size={48} className="mx-auto mb-4" style={{ color: "var(--mobile-accent)", opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--mobile-text-secondary)" }}>No saved articles</p>
        </div>
        <MobileBottomNav active={section} onNav={(s) => setActiveNav(s === "home" ? "home" : s === "audio" ? "audio-news" : s === "saved" ? "saved" : s)} onStreak={() => setShowStreak(true)} onProfile={() => setShowProfile(true)} />
      </div>
    );
  }

  return (
    <div className="mobile-layout">
      <MobileHeader
        greeting={greeting}
        subtitle="தமிழ்நாடு செய்திகள் மட்டும் · 5 நிமிட auto-update"
        onProfile={() => setShowProfile(true)}
      />

      <MobileLiveBanner
        loading={newsLoading}
        lastUpdatedLabel={lastUpdatedLabel}
        hasNewArticles={hasNewArticles}
        newArticlesCount={newArticlesCount}
        onRefresh={() => { void refreshNews(); }}
        onViewNew={acceptNewArticles}
      />

      <MobileStatsStrip stories={visibleNews.length} sources={sourceCount} streak={streaks.listeningStreak} />

      {featured && (
        <div className="px-4 mb-6">
          <div
            className="mobile-card relative overflow-hidden rounded-[30px]"
            style={{
              background: "linear-gradient(145deg, rgba(0,229,255,0.14), rgba(13,22,48,0.96) 42%, rgba(79,209,197,0.10))",
            }}
          >
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full" style={{ background: "rgba(0,229,255,0.14)", filter: "blur(28px)" }} />
            <div className="px-6 pt-7 pb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{getCategoryEmoji(featured.category)}</span>
                <span
                  className="text-[10px] font-semibold px-3 py-1 rounded-full"
                  style={{ background: "rgba(0,229,255,0.1)", color: "var(--mobile-accent)" }}
                >
                  AI Audio News
                </span>
              </div>
              <h2
                className="text-[22px] font-extrabold text-white mb-3 leading-snug"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  letterSpacing: "-0.02em",
                }}
              >
                {featured.headline}
              </h2>
              <div
                className="flex items-center gap-2 text-xs mb-5"
                style={{ color: "var(--mobile-text-secondary)" }}
              >
                <span>{featured.source}</span>
                <span>·</span>
                <span>{timeAgo(featured.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    playNews(featured, 0, [featured]);
                    setPopupOpen(true);
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center mobile-btn"
                  style={{
                    background: "var(--mobile-accent)",
                    boxShadow: "0 0 30px rgba(0,229,255,0.35)",
                  }}
                  aria-label="Play featured news"
                >
                  <Play size={20} fill="white" color="white" />
                </button>
                <div className="flex items-end gap-[3px] h-8">
                  {[0.3, 0.7, 0.2, 0.9, 0.4, 0.6, 0.8, 0.3].map((h, i) => (
                    <div
                      key={i}
                      className="equalizer-bar"
                      style={{
                        height: `${6 + h * 18}px`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mb-6 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 mobile-btn"
              style={{
                background: selectedCategory === cat.key ? "var(--mobile-accent)" : "rgba(255,255,255,0.05)",
                color: selectedCategory === cat.key ? "#050816" : "var(--mobile-text-secondary)",
              }}
              aria-label={`Category: ${cat.label}`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {Object.entries(sectionArticles).map(([id, articles]) => {
        const section = HORIZONTAL_SECTIONS.find((s) => s.id === id)!;
        if (articles.length === 0) return null;
        return (
          <div key={id} className="mb-6">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{section.icon}</span>
                <h3 className="text-sm font-bold text-white">{section.label}</h3>
              </div>
              <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: "var(--mobile-accent)" }}>
                See All
                <ChevronDown size={10} className="rotate-[-90deg]" />
              </span>
            </div>
            <div className="pl-4 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-3 pr-4 pb-1" style={{ minWidth: "max-content" }}>
                {articles.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      playNews(item, 0, [item]);
                      setPopupOpen(true);
                    }}
                    className="flex-shrink-0 rounded-[20px] text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[1.02]"
                    style={{
                      width: "220px",
                      height: "130px",
                      background: "var(--mobile-card)",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                    aria-label={`Listen to ${item.headline}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getCategoryEmoji(item.category)}</span>
                      <span className="text-[10px] font-semibold" style={{ color: "var(--mobile-accent)" }}>
                        {item.category?.replace("தமிழ்நாடு ", "") || "News"}
                      </span>
                    </div>
                    <p
                      className="text-[13px] font-bold text-white leading-tight"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.headline}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className="flex items-center gap-1 text-[10px]"
                        style={{ color: "var(--mobile-text-secondary)" }}
                      >
                        <Clock size={10} />
                        {timeAgo(item.publishedAt)}
                      </span>
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                        style={{ background: "var(--mobile-accent)" }}
                      >
                        <Play size={9} fill="white" color="white" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <MobileBottomNav
        active={section}
        onNav={(s) => setActiveNav(s === "home" ? "home" : s === "audio" ? "audio-news" : s === "saved" ? "saved" : s)}
        onStreak={() => setShowStreak(true)}
        onProfile={() => setShowProfile(true)}
      />
    </div>
  );
}

function NewsCard({ item, feed, index, playNews, onPlay }: { item: NewsItem; feed: QueueItem[]; index: number; playNews: (item: QueueItem, index: number, queue: QueueItem[]) => void; onPlay: () => void }) {
  const savedArticles = useAppStore((s) => s.savedArticles);
  const saveArticle = useAppStore((s) => s.saveArticle);
  const unsaveArticle = useAppStore((s) => s.unsaveArticle);
  const addToast = useAppStore((s) => s.addToast);
  const updateDailyTask = useUserStore((s) => s.updateDailyTaskProgress);
  const isSaved = savedArticles.includes(item.id);

  const handleSave = () => {
    if (isSaved) { unsaveArticle(item.id); addToast("Removed"); }
    else { saveArticle(item.id); addToast("Saved ✓"); updateDailyTask("save-articles", 1); }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: item.headline }); } catch { /* ignore */ }
    } else {
      try {
        await navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "");
        addToast("Link copied ✓");
      } catch { addToast("Could not copy", "error"); }
    }
  };

  return (
    <div className="rounded-xl" style={{ background: "var(--mobile-card)", padding: "14px 16px" }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span>{getCategoryEmoji(item.category)}</span>
        <span className="text-[10px] font-semibold" style={{ color: "var(--mobile-accent)" }}>{item.category}</span>
      </div>
      <h4 className="text-sm font-bold text-white leading-tight mb-1.5 truncate">{item.headline}</h4>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--mobile-text-secondary)" }}>
          <span>{item.source}</span>
          <span>·</span>
          <span>{timeAgo(item.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { playNews(item, index, feed); onPlay(); }}
            className="mobile-btn flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-semibold text-white"
            style={{ background: "var(--mobile-accent)" }}
          >
            <Play size={10} fill="white" />
            Listen
          </button>
          <button onClick={handleSave} className="mobile-btn p-1.5 rounded-full" style={{ color: isSaved ? "var(--mobile-accent)" : "var(--mobile-text-secondary)" }}>
            <Bookmark size={13} fill={isSaved ? "var(--mobile-accent)" : "none"} />
          </button>
          <button onClick={handleShare} className="mobile-btn p-1.5 rounded-full" style={{ color: "var(--mobile-text-secondary)" }}>
            <Share2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileHeader({ greeting, subtitle, onProfile }: { greeting?: string; subtitle: string; onProfile: () => void }) {
  return (
    <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ background: "linear-gradient(180deg, rgba(5,8,22,0.96), rgba(5,8,22,0.70) 72%, transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          {greeting && (
            <h1 className="text-[22px] font-bold text-white leading-tight">{greeting}</h1>
          )}
          <p className="text-xs mt-0.5" style={{ color: "var(--mobile-text-secondary)" }}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="mobile-btn p-2 rounded-full" style={{ color: "var(--mobile-text-secondary)" }} aria-label="Search">
            <Search size={18} />
          </button>
          <button className="mobile-btn p-2 rounded-full" style={{ color: "var(--mobile-text-secondary)" }} aria-label="Notifications">
            <Bell size={18} />
          </button>
          <button
            onClick={onProfile}
            className="mobile-btn w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "var(--mobile-accent)" }}
            aria-label="Profile"
          >
            {useUserStore.getState().currentUser?.username?.[0]?.toUpperCase() || "U"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileLiveBanner({
  loading,
  lastUpdatedLabel,
  hasNewArticles,
  newArticlesCount,
  onRefresh,
  onViewNew,
}: {
  loading: boolean;
  lastUpdatedLabel: string;
  hasNewArticles: boolean;
  newArticlesCount: number;
  onRefresh: () => void;
  onViewNew: () => void;
}) {
  return (
    <div className="px-4 mt-2 mb-3">
      <div className="mobile-card flex items-center justify-between gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.14)" }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--mobile-accent)" }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--mobile-accent)" }}>Tamil Nadu Live</span>
          </div>
          <p className="mt-1 text-[11px] truncate" style={{ color: "var(--mobile-text-secondary)" }}>Auto refresh every 5 min · {lastUpdatedLabel}</p>
        </div>
        {hasNewArticles ? (
          <button onClick={onViewNew} className="mobile-btn shrink-0 text-[11px] font-bold px-3 py-2 rounded-full" style={{ background: "var(--mobile-accent)", color: "#fff" }}>
            {newArticlesCount || "New"} fresh
          </button>
        ) : (
          <button onClick={onRefresh} disabled={loading} className="mobile-btn shrink-0 p-2.5 rounded-full disabled:opacity-50" style={{ background: "rgba(255,255,255,0.08)", color: "var(--mobile-accent)" }} aria-label="Refresh news">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        )}
      </div>
    </div>
  );
}

function MobileStatsStrip({ stories, sources, streak }: { stories: number; sources: number; streak: number }) {
  const stats = [
    { label: "Stories", value: stories },
    { label: "Sources", value: sources },
    { label: "Streak", value: `${streak}d` },
  ];

  return (
    <div className="px-4 mb-5">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="mobile-card text-center py-3 px-2">
            <div className="text-lg font-black text-white leading-none">{stat.value}</div>
            <div className="text-[10px] mt-1 uppercase tracking-[0.16em]" style={{ color: "var(--mobile-text-secondary)" }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileBottomNav({ active, onNav, onStreak, onProfile }: { active: string; onNav: (s: string) => void; onStreak: () => void; onProfile: () => void }) {
  const isActive = (name: string) => active === name;

  const items = [
    { icon: <Home size={20} />, label: "Home", key: "home", onClick: () => onNav("home") },
    { icon: <Headphones size={20} />, label: "Audio", key: "audio", onClick: () => onNav("audio") },
    { icon: <Newspaper size={20} />, label: "News", key: "saved", onClick: () => onNav("saved") },
    { icon: <Flame size={20} />, label: "Streak", key: "streak", onClick: onStreak },
    { icon: <User size={20} />, label: "Profile", key: "profile", onClick: onProfile },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-1" style={{ pointerEvents: "none" }}>
      <div
        className="flex items-center justify-around py-2 px-2 rounded-full"
        style={{
          background: "rgba(13,22,48,0.95)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          pointerEvents: "auto",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {items.map((item) => {
          const activeState = isActive(item.key);
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className="mobile-btn flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-200"
              style={{
                color: activeState ? "var(--mobile-accent)" : "var(--mobile-text-secondary)",
                textShadow: activeState ? "0 0 12px rgba(0,229,255,0.4)" : "none",
              }}
              aria-label={item.label}
            >
              {item.icon}
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MobileMiniPlayer({ onExpand }: { onExpand: () => void }) {
  const currentItem = useAudioStore((s) => s.currentTrack);
  const title = useAudioStore((s) => s.title);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const pauseAudio = useAudioStore((s) => s.pause);
  const playAudio = useAudioStore((s) => s.play);
  const progress = useAudioStore((s) => s.progress);

  if (!currentItem) return null;

  return (
    <div className="fixed bottom-[76px] left-0 right-0 z-40 px-3">
      <div
        className="rounded-2xl overflow-hidden backdrop-blur-lg"
        style={{
          background: "rgba(13,22,48,0.97)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="h-0.5 w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%`, background: "var(--mobile-accent)" }}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "rgba(0,229,255,0.1)" }}
          >
            {getCategoryEmoji(currentItem.category || "") || "🎧"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {title}
            </p>
            <p className="text-[10px]" style={{ color: "var(--mobile-text-secondary)" }}>{currentItem.source}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => (isPlaying ? pauseAudio() : playAudio())}
              className="mobile-btn w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--mobile-accent)" }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={15} fill="white" color="white" /> : <Play size={15} fill="white" color="white" />}
            </button>
            <button
              onClick={onExpand}
              className="mobile-btn p-1.5 rounded-full"
              style={{ color: "var(--mobile-text-secondary)" }}
              aria-label="Expand player"
            >
              <ChevronUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const reactionConfig: { type: ReactionType; icon: React.ReactNode; color: string; label: string }[] = [
  { type: "love", icon: <Heart size={14} />, color: "#e11d48", label: "Love" },
  { type: "trending", icon: <TrendingUp size={14} />, color: "#0f766e", label: "Trending" },
  { type: "celebrate", icon: <Star size={14} />, color: "#d97706", label: "Celebrate" },
  { type: "helpful", icon: <ThumbsUp size={14} />, color: "#64748b", label: "Helpful" },
];

export function MobileFullPlayer({ onClose }: { onClose: () => void }) {
  const currentItem = useAudioStore((s) => s.currentTrack);
  const engineCurrentIndex = useAudioStore((s) => s.currentIndex);
  const engineCurrentTime = useAudioStore((s) => s.currentTime);
  const engineDuration = useAudioStore((s) => s.duration);
  const engineSpeed = useAudioStore((s) => s.speed);
  const engineVolume = useAudioStore((s) => s.volume);
  const engineVoice = useAudioStore((s) => s.voice);
  const engineVoiceGender = useAudioStore((s) => s.voiceGender);
  const engineLanguage = useAudioStore((s) => s.language);
  const engineAudioProvider = useAudioStore((s) => s.audioProvider);
  const engineAudioNotice = useAudioStore((s) => s.audioNotice);
  const engineQueue = useAudioStore((s) => s.queue);
  const engineError = useAudioStore((s) => s.error);
  const audioIsPlaying = useAudioStore((s) => s.isPlaying);
  const audioIsLoading = useAudioStore((s) => s.isLoading);
  const pauseNews = useAudioStore((s) => s.pause);
  const resumeNews = useAudioStore((s) => s.play);
  const nextNews = useAudioStore((s) => s.next);
  const prevNews = useAudioStore((s) => s.prev);
  const replayNews = useAudioStore((s) => s.replay);
  const seekEngine = useAudioStore((s) => s.seek);
  const setEngineSpeed = useAudioStore((s) => s.setSpeed);
  const setEngineVolume = useAudioStore((s) => s.setVolume);
  const setEngineVoice = useAudioStore((s) => s.setVoice);
  const setEngineVoiceGender = useAudioStore((s) => s.setVoiceGender);
  const setEngineLanguage = useAudioStore((s) => s.setLanguage);
  const articleReactions = useAppStore((s) => s.articleReactions);
  const setReaction = useAppStore((s) => s.setReaction);
  const removeReaction = useAppStore((s) => s.removeReaction);
  const savedArticles = useAppStore((s) => s.savedArticles);
  const saveArticle = useAppStore((s) => s.saveArticle);
  const unsaveArticle = useAppStore((s) => s.unsaveArticle);
  const addToast = useAppStore((s) => s.addToast);
  const updateDailyTask = useUserStore((s) => s.updateDailyTaskProgress);
  const isPlaying = audioIsPlaying;
  const isLoading = audioIsLoading;
  const isIdle = !currentItem && !engineError;
  const progress = engineDuration > 0 ? (engineCurrentTime / engineDuration) * 100 : 0;
  const isSaved = currentItem ? savedArticles.includes(currentItem.id) : false;
  const progressRef = useRef<HTMLDivElement>(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState(false);
  const currentHeadline = useMemo(
    () => currentItem ? getArticleHeadlineText(currentItem, engineLanguage) : "",
    [currentItem, engineLanguage],
  );
  const currentPreviewText = useMemo(
    () => currentItem ? getArticleContentText(currentItem, engineLanguage, 520) : "",
    [currentItem, engineLanguage],
  );
  const currentFullText = useMemo(
    () => currentItem ? getArticleContentText(currentItem, engineLanguage, 5000) : "",
    [currentItem, engineLanguage],
  );
  const currentArticleText = expandedArticle ? currentFullText : currentPreviewText;

  const SPEEDS = [0.75, 1, 1.12, 1.25, 1.5, 2];
  const engine = useMemo(() => AudioEngine.getInstance(), []);
  const availableVoices = useMemo(() => engine.getAvailableVoices(engineLanguage, engineVoiceGender), [engine, engineLanguage, engineVoiceGender]);

  const activeReaction = currentItem ? (() => {
    const reactions = articleReactions[currentItem.id];
    return reactions ? (Object.entries(reactions).find(([, val]) => val) || [null, null])[1] as ReactionType | null : null;
  })() : null;

  const reactionCounts = useMemo(() => {
    if (!currentItem) return {} as Record<string, number>;
    const article = articleReactions[currentItem.id] || {};
    const counts: Record<string, number> = {};
    for (const val of Object.values(article)) {
      counts[val as string] = (counts[val as string] || 0) + 1;
    }
    return counts;
  }, [currentItem, articleReactions]);

  const handleUserReaction = (reaction: ReactionType) => {
    if (!currentItem) return;
    if (activeReaction === reaction) {
      removeReaction(currentItem.id);
    } else {
      setReaction(currentItem.id, reaction);
    }
  };

  const handleShare = async () => {
    if (!currentItem) return;
    updateDailyTask("share-article", 1);
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: currentHeadline, text: currentArticleText || currentHeadline, url });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        addToast("Link copied ✓");
      } catch {
        addToast("Could not copy link", "error");
      }
    }
  };

  const handleSaveClick = () => {
    if (!currentItem) return;
    if (isSaved) { unsaveArticle(currentItem.id); addToast("Article removed from saved"); }
    else { saveArticle(currentItem.id); addToast("Article saved ✓"); updateDailyTask("save-articles", 1); }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || engineDuration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    seekEngine(((e.clientX - rect.left) / rect.width) * engineDuration);
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(engineSpeed);
    setEngineSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const toggleLanguage = () => setEngineLanguage(engineLanguage === "ta" ? "en" : "ta");

  if (!currentItem && !engineError) return null;

  const currentVoiceLabel = engineVoice
    ? availableVoices.find((v: VoiceInfo) => v.name === engineVoice)?.name || engineVoice
    : engineVoiceGender === "male" ? "Male" : engineVoiceGender === "female" ? "Female" : "Auto";
  const generatedProvider = engineAudioProvider === "sarvam" || engineAudioProvider === "elevenlabs";
  const providerLabel = engineAudioProvider === "sarvam"
    ? "Sarvam"
    : engineAudioProvider === "elevenlabs"
      ? "ElevenLabs"
    : engineAudioProvider === "browser"
      ? "Browser fallback"
      : "";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--mobile-bg)" }}>
      <div className="flex items-center justify-between px-4 pt-5 pb-2 shrink-0">
        <button onClick={onClose} className="mobile-btn p-2 rounded-full" style={{ color: "var(--mobile-text-secondary)" }}>
          <ChevronDown size={22} />
        </button>
        <span className="text-xs font-semibold" style={{ color: "var(--mobile-text-secondary)" }}>Now Playing</span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {currentItem ? (
          <>
            <div className="flex flex-col items-center pt-2 pb-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: "rgba(0,229,255,0.1)" }}>
                {getCategoryEmoji(currentItem.category || "") || "🎧"}
              </div>
              <h2 className="text-lg font-bold text-white text-center leading-snug mb-1.5 line-clamp-3">{currentHeadline}</h2>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--mobile-text-secondary)" }}>
                <span>{currentItem.source}</span>
                <span>·</span>
                <span>{formatTime(engineDuration)}</span>
              </div>
            </div>

            <div className="w-full mb-4">
              <div ref={progressRef} onClick={handleProgressClick} className="w-full h-1.5 rounded-full cursor-pointer" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-200" style={{ width: `${progress}%`, background: "var(--mobile-accent)" }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: "var(--mobile-text-secondary)" }}>{formatTime(engineCurrentTime)}</span>
                <span className="text-[10px]" style={{ color: "var(--mobile-text-secondary)" }}>{formatTime(engineDuration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-5 mb-4">
              <button onClick={prevNews} disabled={engineCurrentIndex <= 0} className="mobile-btn p-2 disabled:opacity-20" style={{ color: "var(--mobile-text-secondary)" }}>
                <SkipBack size={20} />
              </button>
              <button onClick={replayNews} disabled={!currentItem} className="mobile-btn p-2 disabled:opacity-20" style={{ color: "var(--mobile-text-secondary)" }}>
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => (isPlaying ? pauseNews() : resumeNews())}
                disabled={isLoading || isIdle}
                className="mobile-btn w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-40"
                style={{ background: "var(--mobile-accent)" }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause size={24} fill="white" color="white" />
                ) : (
                  <Play size={24} fill="white" color="white" />
                )}
              </button>
              <button onClick={nextNews} disabled={engineCurrentIndex >= engineQueue.length - 1} className="mobile-btn p-2 disabled:opacity-20" style={{ color: "var(--mobile-text-secondary)" }}>
                <SkipForward size={20} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
              <button onClick={cycleSpeed} className="mobile-btn text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(0,229,255,0.1)", color: "var(--mobile-accent)" }}>
                {engineSpeed}x
              </button>
              <button onClick={toggleLanguage} className="mobile-btn flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(0,229,255,0.1)", color: "var(--mobile-accent)" }}>
                <Languages size={12} />
                {engineLanguage === "ta" ? "தமிழ்" : "English"}
              </button>
              {providerLabel && (
                <span
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: generatedProvider ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    color: generatedProvider ? "#34d399" : "#fbbf24",
                  }}
                  title={engineAudioNotice || providerLabel}
                >
                  {providerLabel}
                </span>
              )}
              <div className="flex items-center gap-1 rounded-full px-1 py-1" style={{ background: "rgba(0,229,255,0.1)" }}>
                {(["female", "male"] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setEngineVoiceGender(gender)}
                    className="mobile-btn text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: engineVoiceGender === gender ? "var(--mobile-accent)" : "transparent",
                      color: engineVoiceGender === gender ? "white" : "var(--mobile-accent)",
                    }}
                  >
                    {gender === "female" ? "பெண்" : "ஆண்"}
                  </button>
                ))}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    if (!generatedProvider) setVoiceDropdownOpen(!voiceDropdownOpen);
                  }}
                  className="mobile-btn flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(0,229,255,0.1)", color: "var(--mobile-accent)" }}
                  title={generatedProvider ? `${providerLabel} voice is selected by language and gender` : "Select browser voice"}
                >
                  <Mic size={12} />
                  <span className="max-w-[60px] truncate">{currentVoiceLabel}</span>
                  {!generatedProvider && <ChevronDown size={10} />}
                </button>
                {voiceDropdownOpen && !generatedProvider && (
                  <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[180px] rounded-xl overflow-hidden" style={{ background: "var(--mobile-card)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {availableVoices.length === 0 && (
                      <p className="text-[11px] px-3 py-3 text-center" style={{ color: "var(--mobile-text-secondary)", opacity: 0.5 }}>No matching voices</p>
                    )}
                    {availableVoices.map((v: VoiceInfo) => (
                      <button key={v.name} onClick={() => { setEngineVoice(v.name); setVoiceDropdownOpen(false); }}
                        className="w-full text-left text-[11px] px-3 py-2 transition-colors border-b last:border-b-0" style={{
                          borderColor: "rgba(255,255,255,0.05)",
                          color: engineVoice === v.name ? "var(--mobile-accent)" : "var(--mobile-text-secondary)",
                          background: engineVoice === v.name ? "rgba(0,229,255,0.08)" : "transparent",
                        }}>
                        <span className="block truncate">{v.name}</span>
                        <span className="block text-[9px] opacity-50">{v.lang} · {v.gender}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setEngineVolume(Math.max(0, engineVolume - 0.1))} className="mobile-btn" style={{ color: "var(--mobile-text-secondary)", opacity: 0.5 }}>
                  <Volume2 size={13} />
                </button>
                <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${engineVolume * 100}%`, background: "var(--mobile-accent)", opacity: 0.5 }} />
                </div>
                <button onClick={() => setEngineVolume(Math.min(1, engineVolume + 0.1))} className="mobile-btn" style={{ color: "var(--mobile-text-secondary)", opacity: 0.5 }}>
                  <Volume2 size={13} />
                </button>
              </div>
            </div>

            {engineAudioNotice && (
              <div className="text-[11px] leading-snug px-3 py-2 rounded-xl mb-4" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
                {engineAudioNotice}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 py-3 mb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {reactionConfig.map((r) => {
                const isActive = activeReaction === r.type;
                const count = reactionCounts[r.type] || 0;
                return (
                  <button key={r.type} onClick={() => handleUserReaction(r.type)}
                    className="mobile-btn flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors"
                    style={{
                      color: isActive ? r.color : "var(--mobile-text-secondary)",
                      background: isActive ? `${r.color}18` : "rgba(255,255,255,0.04)",
                      opacity: isActive ? 1 : 0.6,
                    }}>
                    {r.icon}
                    {count > 0 && <span className="text-[10px] font-medium">{count}</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 py-3">
              <button onClick={handleSaveClick} className="mobile-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold" style={{
                background: isSaved ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.04)",
                color: isSaved ? "var(--mobile-accent)" : "var(--mobile-text-secondary)",
              }}>
                {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isSaved ? "Saved" : "Save"}
              </button>
              <button onClick={handleShare} className="mobile-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.04)", color: "var(--mobile-text-secondary)" }}>
                <Share2 size={14} />
                Share
              </button>
            </div>

            <div className="mt-3 mb-4">
              <div className="text-xs whitespace-pre-line leading-relaxed" style={{ color: "var(--mobile-text-secondary)" }}>
                {currentArticleText}
              </div>
              {currentFullText.length > currentPreviewText.length && (
                <button onClick={() => setExpandedArticle(!expandedArticle)} className="mobile-btn text-xs font-semibold mt-1" style={{ color: "var(--mobile-accent)" }}>
                  {expandedArticle ? "Show Less" : "Show More"}
                </button>
              )}
            </div>

            {expandedArticle && (
              <div className="mb-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--mobile-text-secondary)" }}>Source</p>
                <div className="text-xs leading-relaxed" style={{ color: "var(--mobile-text-secondary)" }}>
                  <p>{currentItem.source || "Unknown"}</p>
                  {currentItem.publishedAt && <p>{formatArticleDateTime(currentItem.publishedAt)}</p>}
                  {currentItem.sourceUrl && (
                    <a href={currentItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline break-all" style={{ color: "var(--mobile-accent)" }}>
                      {currentItem.sourceUrl}
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--mobile-text-secondary)" }}>Related News</p>
              <RelatedNewsPanel currentId={currentItem.id} category={currentItem.category} language={engineLanguage} />
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--mobile-text-secondary)" }}>Comments</p>
              <CommentsSection newsId={currentItem.id} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm" style={{ color: "var(--mobile-accent)" }}>{engineError || "Audio unavailable"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StreakSheetView({ onClose, currentUser, streaks }: { onClose: () => void; currentUser: UserProfile | null; streaks: StreakData }) {
  const tasks: DailyTask[] = currentUser?.rewards?.dailyTasks ?? [];
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="mobile-layout flex flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <Flame size={20} style={{ color: "#d97706" }} />
          <h2 className="text-lg font-bold text-white">Streak & Tasks</h2>
        </div>
        <button onClick={onClose} className="mobile-btn p-2 rounded-full" style={{ color: "var(--mobile-text-secondary)" }}>
          <X size={20} />
        </button>
      </div>

      <div className="px-4 mt-2">
        <div className="mobile-card">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center py-3 px-2 rounded-lg" style={{ background: "rgba(0,229,255,0.06)" }}>
              <Flame size={18} style={{ color: "#d97706" }} />
              <span className="text-xl font-bold text-white mt-1">{streaks.listeningStreak}</span>
              <span className="text-[10px]" style={{ color: "var(--mobile-text-secondary)" }}>Current</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2 rounded-lg" style={{ background: "rgba(0,229,255,0.06)" }}>
              <Star size={18} style={{ color: "var(--mobile-accent)" }} />
              <span className="text-xl font-bold text-white mt-1">{currentUser?.rewards?.points ?? 0}</span>
              <span className="text-[10px]" style={{ color: "var(--mobile-text-secondary)" }}>Points</span>
            </div>
            <div className="flex flex-col items-center py-3 px-2 rounded-lg" style={{ background: "rgba(0,229,255,0.06)" }}>
              <Award size={18} style={{ color: "var(--mobile-accent)" }} />
              <span className="text-xl font-bold text-white mt-1">{streaks.bestListeningStreak}</span>
              <span className="text-[10px]" style={{ color: "var(--mobile-text-secondary)" }}>Best</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="mobile-card">
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={14} style={{ color: "var(--mobile-accent)" }} />
            <span className="text-xs font-semibold text-white">Today&apos;s Missions</span>
            <span className="ml-auto text-xs" style={{ color: "var(--mobile-text-secondary)" }}>{completedTasks}/{totalTasks}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`, background: "var(--mobile-accent)" }} />
          </div>
          <div className="flex flex-col gap-2">
            {tasks.map((task) => {
              const pct = task.target > 0 ? Math.round((task.progress / task.target) * 100) : 0;
              return (
                <div key={task.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: task.completed ? "rgba(0,229,255,0.15)" : "rgba(255,255,255,0.05)" }}>
                    {task.completed ? <Check size={14} style={{ color: "var(--mobile-accent)" }} /> : <span style={{ opacity: 0.4 }}>{TASK_ICONS[task.id]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${task.completed ? "text-white line-through opacity-50" : "text-white"}`} style={{ color: task.completed ? undefined : "var(--mobile-text)" }}>{task.label}</p>
                    <div className="w-full h-1 rounded-full mt-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: task.completed ? "var(--mobile-accent)" : "var(--mobile-text-secondary)", opacity: task.completed ? 1 : 0.3 }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--mobile-accent)" }}>+{task.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileProfileView({ onClose }: { onClose: () => void }) {
  const currentUser = useUserStore((s) => s.currentUser);
  const logout = useUserStore((s) => s.logout);
  const streaks = useUserStore((s) => s.getStreaks)();

  if (!currentUser) return null;

  const avatar = currentUser.profileImage || currentUser.username?.[0]?.toUpperCase() || "U";
  const isImage = !!currentUser.profileImage && currentUser.profileImage.length > 0;

  return (
    <div className="mobile-layout flex flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <h2 className="text-lg font-bold text-white">Profile</h2>
        <button onClick={onClose} className="mobile-btn p-2 rounded-full" style={{ color: "var(--mobile-text-secondary)" }}>
          <X size={20} />
        </button>
      </div>

      <div className="px-4 mt-4">
        <div className="mobile-card flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden mb-3" style={{ background: "rgba(0,229,255,0.15)" }}>
            {isImage ? (
              <Image src={avatar} alt="" width={80} height={80} unoptimized className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: "var(--mobile-accent)" }}>{avatar}</span>
            )}
          </div>
          <p className="text-base font-bold text-white">{currentUser.username}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--mobile-text-secondary)" }}>{currentUser.email}</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <Flame size={14} style={{ color: "#d97706" }} />
              <span className="text-sm font-bold text-white">{streaks.listeningStreak}</span>
              <span className="text-[10px]" style={{ color: "var(--mobile-text-secondary)" }}>streak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={14} style={{ color: "var(--mobile-accent)" }} />
              <span className="text-sm font-bold text-white">{currentUser.rewards?.points ?? 0}</span>
              <span className="text-[10px]" style={{ color: "var(--mobile-text-secondary)" }}>pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-3 flex flex-col gap-2">
        <button className="mobile-btn w-full py-3 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,229,255,0.1)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mobile-accent)" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          Change Photo
        </button>
        <button className="mobile-btn w-full py-3 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          Change Password
        </button>
        <button
          onClick={() => { logout(); }}
          className="mobile-btn w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#ef4444" }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          Logout
        </button>
      </div>
    </div>
  );
}
