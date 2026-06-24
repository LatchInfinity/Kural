"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { useNewsStore, type PulseTab } from "@/store/news-store";
import type { NewsItem, TimeFilter as TimeFilterValue } from "@/types";
import type { QueueItem } from "@/lib/audio-engine";
import { useUserStore } from "@/store/user-store";
import AuthGuard from "@/components/auth/auth-guard";
import Header from "@/components/header";
import FlashTicker from "@/components/flash-ticker";
import NewsCard, { type NewsCardLanguage } from "@/components/news-card";
import CategoryTabs from "@/components/category-tabs";
import TimeFilter from "@/components/time-filter";
import TrendingSection from "@/components/trending-section";
import DistrictNews from "@/components/district-news";
import MobileHome from "@/components/mobile/MobileHome";
import ToastContainer from "@/components/toast";
import NewspaperView from "@/components/newspaper/newspaper-intro";
import ProfilePage from "@/components/auth/profile-page";
import { getCurrentEdition } from "@/lib/editions";
import { getCategoryEmoji } from "@/lib/category-images";
import { NEWS_PER_CATEGORY, TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";
import { NEWS_SOURCE_SHOWCASE } from "@/lib/source-showcase";
import { getArticleContentText, getArticleDisplayText, getArticleHeadlineText, getCategoryDisplayText } from "@/lib/news-text";
import {
  Bookmark, Mic, RefreshCw, Flame, Award, Zap, Radio, Sparkles, Globe2, Headphones, Languages, Newspaper,
  Play, Volume2, Clock, Search, ChevronRight,
} from "lucide-react";

const PULSE_TABS: { id: PulseTab; label: string; labelTa: string }[] = [
  { id: "breaking", label: "Breaking", labelTa: "முக்கிய" },
  { id: "last-hour", label: "Last Hour", labelTa: "கடந்த மணி" },
  { id: "today", label: "Today", labelTa: "இன்று" },
  { id: "last-3-days", label: "Last 3 Days", labelTa: "3 நாட்கள்" },
];

const CATEGORY_SECTIONS: { title: string; titleTa: string; icon: string; category: string }[] = [
  { title: "Tamil Nadu Politics", titleTa: "தமிழ்நாடு அரசியல்", icon: getCategoryEmoji("Politics"), category: "தமிழ்நாடு அரசியல்" },
  { title: "Chennai & Transport", titleTa: "சென்னை & போக்குவரத்து", icon: getCategoryEmoji("Railway"), category: "தமிழ்நாடு போக்குவரத்து" },
  { title: "Tamil Nadu Business", titleTa: "தமிழ்நாடு வணிகம்", icon: getCategoryEmoji("Business"), category: "தமிழ்நாடு வணிகம்" },
  { title: "Tamil Nadu Sports", titleTa: "தமிழ்நாடு விளையாட்டு", icon: getCategoryEmoji("Sports"), category: "தமிழ்நாடு விளையாட்டு" },
  { title: "Agriculture", titleTa: "வேளாண்மை", icon: getCategoryEmoji("Agriculture"), category: "தமிழ்நாடு வேளாண்மை" },
  { title: "Weather Alerts", titleTa: "வானிலை எச்சரிக்கை", icon: getCategoryEmoji("Weather"), category: "தமிழ்நாடு வானிலை" },
];

const CATEGORY_ICON_MAP: Record<string, string> = {
  "தமிழ்நாடு அரசியல்": getCategoryEmoji("Politics"),
  "தமிழ்நாடு அரசு": getCategoryEmoji("Government"),
  "தமிழ்நாடு கல்வி": getCategoryEmoji("Education"),
  "தமிழ்நாடு வணிகம்": getCategoryEmoji("Business"),
  "தமிழ்நாடு தொழில்நுட்பம்": getCategoryEmoji("Technology"),
  "தமிழ்நாடு விளையாட்டு": getCategoryEmoji("Sports"),
  "தமிழ்நாடு விபத்து": getCategoryEmoji("Accident"),
  "தமிழ்நாடு குற்றம்": getCategoryEmoji("Crime"),
  "தமிழ்நாடு வானிலை": getCategoryEmoji("Weather"),
  "தமிழ்நாடு போக்குவரத்து": getCategoryEmoji("Railway"),
  "தமிழ்நாடு வேளாண்மை": getCategoryEmoji("Agriculture"),
  "தமிழ்நாடு உள்ளூர்": getCategoryEmoji("Tamil Nadu"),
};

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    seen.set(item.id, item);
  }
  if (seen.size !== items.length) {
    console.log(`deduplicateById: removed ${items.length - seen.size} duplicate IDs from render`);
  }
  return Array.from(seen.values());
}

function filterPulseArticles(items: NewsItem[], tab: PulseTab): NewsItem[] {
  const now = Date.now();
  switch (tab) {
    case "breaking":
      return items.filter((item) => item.retention === "breaking" || item.isBreaking);
    case "last-hour":
      return items.filter((item) => now - new Date(item.publishedAt).getTime() <= 60 * 60 * 1000);
    case "today": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return items.filter((item) => new Date(item.publishedAt) >= today);
    }
    case "last-3-days":
      return items.filter((item) => now - new Date(item.publishedAt).getTime() <= 3 * 24 * 60 * 60 * 1000);
    default:
      return items;
  }
}

function filterDashboardArticles(items: NewsItem[], categoryFilter: string, timeFilter: TimeFilterValue): NewsItem[] {
  const now = Date.now();
  let result = items.filter((item) => item.retention !== "archived");

  if (categoryFilter) {
    result = result.filter((item) => item.category === categoryFilter);
  }

  if (timeFilter === "last-hour") {
    result = result.filter((item) => now - new Date(item.publishedAt).getTime() <= 60 * 60 * 1000);
  } else if (timeFilter === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    result = result.filter((item) => new Date(item.publishedAt) >= today);
  } else if (timeFilter === "last-3-days") {
    result = result.filter((item) => now - new Date(item.publishedAt).getTime() <= 3 * 24 * 60 * 60 * 1000);
  }

  return result;
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

function streakMilestone(streak: number): string | null {
  if (streak >= 365) return "365 Day Streak";
  if (streak >= 100) return "100 Day Streak";
  if (streak >= 50) return "50 Day Streak";
  if (streak >= 30) return "30 Day Streak";
  if (streak >= 7) return "7 Day Streak";
  return null;
}

function clearGoogleTranslateState(): void {
  if (typeof document === "undefined") return;

  const cookieTargets = [
    "googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/",
    `googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`,
    `googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`,
  ];
  cookieTargets.forEach((cookie) => { document.cookie = cookie; });

  document.documentElement.classList.remove("translated-ltr", "translated-rtl");
  document.documentElement.style.marginTop = "";
  document.body.style.top = "";

  document
    .querySelectorAll(".goog-te-banner-frame, iframe.goog-te-banner-frame, iframe.skiptranslate, body > .skiptranslate, #goog-gt-tt")
    .forEach((node) => node.remove());
}

export default function HomePage() {
  const edition = getCurrentEdition();
  const { activeNav, savedArticles = [], setActiveNav, playNews } = useAppStore();
  const setAudioLanguage = useAudioStore((s) => s.setLanguage);
  const showHomepage = activeNav === "home";
  const showNewspaper = activeNav === "newspaper-view";
  const isNewspaperActive = showNewspaper;

  const storeArticles = useNewsStore((s) => s.articles);
  const hasNewArticles = useNewsStore((s) => s.hasNewArticles);
  const newArticlesCount = useNewsStore((s) => s.newArticlesCount);
  const acceptNewArticles = useNewsStore((s) => s.acceptNewArticles);
  const initializeNews = useNewsStore((s) => s.initialize);
  const pulseTab = useNewsStore((s) => s.pulseTab);
  const setPulseTab = useNewsStore((s) => s.setPulseTab);
  const categoryFilter = useNewsStore((s) => s.categoryFilter);
  const setCategoryFilter = useNewsStore((s) => s.setCategoryFilter);
  const timeFilter = useNewsStore((s) => s.timeFilter);
  const setTimeFilter = useNewsStore((s) => s.setTimeFilter);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [displayLanguage, setDisplayLanguage] = useState<NewsCardLanguage>("ta");
  const [leadStoryIndex, setLeadStoryIndex] = useState(0);
  const [isLeadCarouselPaused, setIsLeadCarouselPaused] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const streaks = useUserStore((s) => s.getStreaks)();
  const currentUser = useUserStore((s) => s.currentUser);

  useEffect(() => {
    initializeNews();
    queueMicrotask(() => setMounted(true));
    return () => { useNewsStore.getState().destroy(); };
  }, [initializeNews]);

  useEffect(() => {
    clearGoogleTranslateState();
    const interval = window.setInterval(clearGoogleTranslateState, 500);
    const stop = window.setTimeout(() => window.clearInterval(interval), 4000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, []);

  const newsData = useMemo(() => deduplicateById(storeArticles), [storeArticles]);
  const latestNews = useMemo(() => deduplicateById(newsData.filter((n) => n.retention !== "archived")), [newsData]);
  const savedItems = useMemo(() => deduplicateById(newsData.filter((n) => savedArticles.includes(n.id))), [newsData, savedArticles]);
  const pulseArticles = useMemo(() => deduplicateById(filterPulseArticles(newsData, pulseTab)), [newsData, pulseTab]);
  const filteredArticles = useMemo(() => deduplicateById(filterDashboardArticles(newsData, categoryFilter, timeFilter)), [newsData, categoryFilter, timeFilter]);

  const categoryArticles = useMemo(() => {
    return CATEGORY_SECTIONS.map((section) => ({
      ...section,
      articles: deduplicateById(newsData.filter((item) => item.category === section.category).slice(0, NEWS_PER_CATEGORY)),
    }));
  }, [newsData]);

  const sourceCount = useMemo(() => {
    const liveCount = new Set(latestNews.map((item) => item.source).filter(Boolean)).size;
    return Math.max(liveCount, NEWS_SOURCE_SHOWCASE.length);
  }, [latestNews]);

  const todayStoriesCount = useMemo(() => {
    const today = new Date().toDateString();
    return latestNews.filter((item) => new Date(item.publishedAt).toDateString() === today).length;
  }, [latestNews]);

  const breakingStoriesCount = useMemo(() => {
    return latestNews.filter((item) => item.retention === "breaking" || item.isBreaking).length;
  }, [latestNews]);
  const leadStories = useMemo(() => latestNews.slice(0, 3), [latestNews]);
  const activeLeadStoryIndex = leadStories.length > 0 ? leadStoryIndex % leadStories.length : 0;
  const leadStory = leadStories[activeLeadStoryIndex];
  const sideStories = latestNews.slice(leadStories.length, leadStories.length + 4);
  const bestStreak = streaks.listeningStreak;
  const showStreak = bestStreak > 0;
  const milestone = streakMilestone(bestStreak);

  useEffect(() => {
    if (isLeadCarouselPaused || leadStories.length <= 1) return;

    const interval = window.setInterval(() => {
      setLeadStoryIndex((current) => (current + 1) % leadStories.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [isLeadCarouselPaused, leadStories.length]);

  const levelProgressWidth = useMemo(() => {
    const p = currentUser?.rewards?.points ?? 0;
    if (p <= 100) return (p / 101) * 100;
    if (p <= 300) return ((p - 101) / 200) * 100;
    if (p <= 700) return ((p - 301) / 400) * 100;
    if (p <= 1500) return ((p - 701) / 800) * 100;
    return 100;
  }, [currentUser?.rewards?.points]);

  const levelProgressLabel = useMemo(() => {
    const p = currentUser?.rewards?.points ?? 0;
    if (p < 101) return `${101 - p} to Lv.2`;
    if (p < 301) return `${301 - p} to Lv.3`;
    if (p < 701) return `${701 - p} to Lv.4`;
    if (p < 1501) return `${1501 - p} to Lv.5`;
    return "Max Level";
  }, [currentUser?.rewards?.points]);

  const handleCategorySelect = (cat: string) => {
    setCategoryFilter(cat === categoryFilter ? "" : cat);
  };

  const handleListenToItem = (item: NewsItem) => {
    setAudioLanguage(displayLanguage);
    const queued = toQueueItem(item);
    playNews(queued, 0, [queued]);
  };

  const showMobile = isMobile && mounted;

  return (
    <AuthGuard>
      {showMobile ? (
        <>
          <MobileHome />
          <ToastContainer />
        </>
      ) : (
        <div className="min-h-screen bg-background">
          <AnimatePresence>
            {!isNewspaperActive && (
              <motion.div
                key="header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Header />
              </motion.div>
            )}
          </AnimatePresence>
          <ToastContainer />

        <main className={isNewspaperActive ? "" : "pt-[132px] xl:pt-[142px]"}>
          {showNewspaper && <NewspaperView />}

          {showHomepage && (
            <>
              <FlashTicker language={displayLanguage} />

              {hasNewArticles && (
                <div className="notranslate flex items-center justify-center gap-3 px-4 py-2.5 bg-accent/5 border-b border-accent/10" translate="no">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
                    <span className="text-xs font-medium text-accent">{newArticlesCount} New {newArticlesCount === 1 ? "Story" : "Stories"} Available</span>
                  </span>
                  <button
                    onClick={acceptNewArticles}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-accent text-white text-[10px] font-semibold hover:bg-accent-soft transition-colors cursor-pointer"
                  >
                    <RefreshCw size={10} />
                    Refresh Feed
                  </button>
                </div>
              )}

              {showStreak && (
                <div className="notranslate border-b border-border bg-background-secondary/50" translate="no">
                  <div className="kural-page-shell py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Flame size={14} style={{ color: "var(--color-breaking)" }} />
                        <span className="text-xs font-bold text-foreground-secondary/80">{bestStreak} Day Streak</span>
                      </div>
                      <div className="text-[10px] text-foreground-secondary/50">
                        <span>Listening: {streaks.listeningStreak}d</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {milestone && <span className="text-[10px] font-semibold text-accent">{milestone}</span>}
                    </div>
                  </div>
                </div>
              )}

              {currentUser?.rewards && (
                <div className="notranslate border-b border-border bg-background-secondary/30" translate="no">
                  <div className="kural-page-shell py-1.5 flex items-center gap-3">
                    <Award size={13} style={{ color: edition.accent }} />
                    <span className="text-[11px] font-bold" style={{ color: edition.accent }}>
                      Level {currentUser.rewards.level}
                    </span>
                    <span className="text-[10px] text-foreground-secondary/50">{currentUser.rewards.points} pts</span>
                    <div className="w-20 h-1.5 bg-border-light rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${levelProgressWidth}%`, background: edition.accent }} />
                    </div>
                    <span className="text-[9px] text-foreground-secondary/40">{levelProgressLabel}</span>
                  </div>
                </div>
              )}

              <div className="kural-page-shell kural-frontpage-shell py-5 sm:py-7">
                <section className="kural-frontpage mb-6 sm:mb-8">
                  <div className="notranslate kural-frontpage-kicker" translate="no">
                    <div className="flex min-w-0 items-center gap-2">
                      <Newspaper size={15} className="text-news-red" />
                      <span className="truncate">{sourceCount} sources connected</span>
                      <span className="hidden h-1 w-1 rounded-full bg-foreground-secondary/40 sm:block" />
                      <span className="hidden text-accent sm:inline">Audio edition</span>
                    </div>
                    <div className="flex items-center gap-1 border border-border bg-surface p-1">
                      {(["ta", "en"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setDisplayLanguage(lang)}
                          className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] transition-colors cursor-pointer"
                          style={{
                            background: displayLanguage === lang ? "var(--color-news-red)" : "transparent",
                            color: displayLanguage === lang ? "#fff" : "var(--color-foreground-secondary)",
                          }}
                        >
                          {lang === "ta" && <Languages size={12} />}
                          {lang === "ta" ? "தமிழ்" : "English"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {leadStory && (
                    <div className="kural-frontpage-grid">
                      <article
                        className="kural-lead-story kural-lead-carousel"
                        onMouseEnter={() => setIsLeadCarouselPaused(true)}
                        onMouseLeave={() => setIsLeadCarouselPaused(false)}
                        onFocus={() => setIsLeadCarouselPaused(true)}
                        onBlur={() => setIsLeadCarouselPaused(false)}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={leadStory.id}
                            className="kural-lead-slide"
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                          >
                            <div className="notranslate mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em]" translate="no">
                              <span className="bg-news-red px-2 py-1 text-white">Lead Story</span>
                              <span className="text-news-red">{getCategoryDisplayText(leadStory.category, displayLanguage)}</span>
                              <span className="text-foreground-secondary/55">{formatDeskTime(leadStory.publishedAt)}</span>
                            </div>
                            <h1 className="text-balance font-serif text-[1.55rem] font-black leading-[1.15] text-foreground sm:text-3xl lg:text-[2.35rem] xl:text-[2.65rem]">
                              {getArticleHeadlineText(leadStory, displayLanguage)}
                            </h1>
                            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-foreground-secondary/85 sm:text-base">
                              {getArticleDisplayText(leadStory, displayLanguage)}
                            </p>
                            <div className="notranslate mt-5 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-secondary/60" translate="no">
                              <span className="truncate">{leadStory.source}</span>
                              <span className="h-1 w-1 rounded-full bg-foreground-secondary/30" />
                              <span className="inline-flex items-center gap-1.5"><Clock size={12} /> Updated now</span>
                            </div>
                            <div className="notranslate mt-6 flex flex-wrap items-center gap-3" translate="no">
                              <button
                                onClick={() => handleListenToItem(leadStory)}
                                className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-accent-soft transition-colors cursor-pointer"
                              >
                                <Play size={14} fill="currentColor" />
                                Listen
                              </button>
                              <span className="inline-flex items-center gap-2 text-xs font-bold text-foreground-secondary/70">
                                <Volume2 size={14} className="text-accent" />
                                தமிழ் + English voice briefings
                              </span>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                        {leadStories.length > 1 && (
                          <div className="notranslate kural-lead-carousel-dots" translate="no">
                            {leadStories.map((item, i) => (
                              <button
                                key={item.id}
                                type="button"
                                aria-label={`Show lead story ${i + 1}`}
                                aria-current={i === activeLeadStoryIndex ? "true" : undefined}
                                className="kural-lead-carousel-dot"
                                onClick={() => setLeadStoryIndex(i)}
                              />
                            ))}
                          </div>
                        )}
                      </article>

                      <aside className="kural-top-column">
                        <div className="kural-column-title">
                          <Zap size={14} className="text-news-red" />
                          Top Stories
                        </div>
                        <div className="divide-y divide-border-light">
                          {sideStories.map((item, i) => (
                            <article key={item.id} className="group py-3 first:pt-0">
                              <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-foreground-secondary/50">
                                <span className="text-news-red">{String(i + 1).padStart(2, "0")}</span>
                                <span>{getCategoryDisplayText(item.category, displayLanguage)}</span>
                              </div>
                              <h2 className="line-clamp-2 font-serif text-lg font-black leading-tight text-foreground group-hover:text-news-red">
                                {getArticleHeadlineText(item, displayLanguage)}
                              </h2>
                              <div className="notranslate mt-2 flex items-center justify-between gap-3 text-[10px] font-semibold text-foreground-secondary/55" translate="no">
                                <span className="truncate">{item.source}</span>
                                <button
                                  onClick={() => handleListenToItem(item)}
                                  className="inline-flex items-center gap-1 text-accent hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <Play size={11} fill="currentColor" />
                                  Listen
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </aside>

                      <aside className="notranslate kural-audio-rail" translate="no">
                        <div className="kural-column-title">
                          <Radio size={14} className="text-accent" />
                          Audio Desk
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Today", value: todayStoriesCount, icon: Sparkles },
                            { label: "Breaking", value: breakingStoriesCount, icon: Zap },
                            { label: "Sources", value: sourceCount, icon: Globe2 },
                            { label: "Listen", value: latestNews.length, icon: Headphones },
                          ].map((stat) => {
                            const Icon = stat.icon;
                            return (
                              <div key={stat.label} className="kural-desk-stat">
                                <Icon size={15} className="text-accent" />
                                <span className="text-xl font-black text-foreground">{stat.value}</span>
                                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-foreground-secondary/55">{stat.label}</span>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setActiveNav("audio-news")}
                          className="mt-4 inline-flex w-full items-center justify-between rounded-sm border border-accent/20 bg-accent/10 px-3 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                        >
                          Full audio queue
                          <ChevronRight size={14} />
                        </button>
                      </aside>
                    </div>
                  )}

                </section>

                <div className="notranslate kural-filter-bar mb-7 flex flex-col gap-3 p-3 sm:p-4" translate="no">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-foreground-secondary/60">
                    <Search size={13} className="text-news-red" />
                    Filter the edition
                  </div>
                  <TimeFilter active={timeFilter} onSelect={setTimeFilter} />
                  <CategoryTabs active={categoryFilter} onSelect={handleCategorySelect} />
                </div>

                {/* Trending Section */}
                <TrendingSection language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />

                {/* Filtered News Grid (when category/time filter is active) */}
                {(categoryFilter || timeFilter !== "all") && (
                  <section className="mb-8">
                    <div className="notranslate flex items-center gap-2 mb-4" translate="no">
                      <Zap size={16} style={{ color: edition.accent }} />
                      <h2 className="text-sm font-bold tracking-tight text-foreground">
                        {categoryFilter || "All News"}
                        {timeFilter !== "all" && ` — ${timeFilter.replace("-", " ")}`}
                      </h2>
                      <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${edition.accent}30, transparent)` }} />
                      {categoryFilter && (
                        <button
                          onClick={() => { setCategoryFilter(""); setTimeFilter("all"); }}
                          className="text-[9px] text-foreground-secondary/40 hover:text-accent transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="kural-news-grid">
                      {filteredArticles.slice(0, 12).map((item, i) => (
                        <NewsCard key={item.id} item={item} index={i} language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />
                      ))}
                      {filteredArticles.length === 0 && (
                        <p className="text-sm text-foreground-secondary/40 col-span-full text-center py-8">No matching news</p>
                      )}
                    </div>
                  </section>
                )}

                {/* Live Pulse — only when no filter active */}
                {!categoryFilter && timeFilter === "all" && (
                  <section className="mb-8">
                    <div className="notranslate flex items-center gap-2 mb-4" translate="no">
                      <Zap size={16} style={{ color: edition.accent }} />
                      <h2 className="text-sm font-bold tracking-tight text-foreground">Tamil Nadu Live Pulse</h2>
                      <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${edition.accent}30, transparent)` }} />
                    </div>
                    <div className="notranslate flex items-center gap-1 mb-4 overflow-x-auto" translate="no">
                      {PULSE_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPulseTab(tab.id)}
                          className="relative px-3 py-1.5 text-[10px] font-semibold rounded-sm whitespace-nowrap cursor-pointer transition-colors"
                          style={{
                            color: pulseTab === tab.id ? "#fff" : edition.accent,
                            background: pulseTab === tab.id ? edition.accent : `${edition.accent}10`,
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    {mounted && (
                      <div className="kural-news-grid">
                        {pulseArticles.slice(0, 8).map((item, i) => (
                          <NewsCard key={item.id} item={item} index={i} language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />
                        ))}
                        {pulseArticles.length === 0 && (
                          <p className="text-sm text-foreground-secondary/40 col-span-full text-center py-8">No news in this period</p>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {/* District News */}
                {!categoryFilter && timeFilter === "all" && <DistrictNews language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />}

                {/* Category Sections — only when no filter */}
                {!categoryFilter && timeFilter === "all" && categoryArticles.map((section) => (
                  <section key={section.category} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span style={{ color: edition.accent }}>{section.icon}</span>
                      <h2 className="text-sm font-bold tracking-tight text-foreground">{section.titleTa}</h2>
                      <span className="text-[9px] text-foreground-secondary/40 hidden sm:inline">{section.titleTa}</span>
                      <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${edition.accent}20, transparent)` }} />
                    </div>
                    <div className="kural-news-grid">
                      {section.articles.map((item, i) => (
                        <NewsCard key={item.id} item={item} index={i} language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />
                      ))}
                      {section.articles.length === 0 && (
                        <p className="text-[11px] text-foreground-secondary/30 col-span-full py-4">No news in this category</p>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}

          {activeNav === "audio-news" && (
            <div className="kural-page-shell py-8 min-h-screen">
              <div className="notranslate flex items-center gap-2 mb-6" translate="no">
                <Mic size={16} className="text-accent" />
                <h1 className="text-lg font-bold tracking-tight text-foreground">Audio News</h1>
                <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${edition.accent}30, transparent)` }} />
              </div>
              <div className="kural-news-grid">
                {latestNews.map((item, i) => (
                  <NewsCard key={item.id} item={item} index={i} language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />
                ))}
              </div>
            </div>
          )}

          {activeNav === "saved" && (
            <div className="kural-page-shell py-8 min-h-screen">
              <div className="notranslate flex items-center gap-2 mb-6" translate="no">
                <Bookmark size={16} className="text-accent" />
                <h1 className="text-lg font-bold tracking-tight text-foreground">Saved Articles</h1>
                <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${edition.accent}30, transparent)` }} />
              </div>
              {savedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Bookmark size={40} className="text-foreground-secondary/10 mb-4" />
                  <p className="text-foreground-secondary/50 text-sm mb-1">No saved articles yet</p>
                  <p className="text-foreground-secondary/30 text-xs">Tap the bookmark icon on any news to save it here</p>
                </div>
              ) : (
                <div className="kural-news-grid">
                  {savedItems.map((item, i) => (
                    <NewsCard key={item.id} item={item} index={i} language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeNav === "profile" && (
            <ProfilePage />
          )}

          {activeNav === "categories" && (
            <div className="kural-page-shell py-8 min-h-screen">
              <div className="flex items-center gap-2 mb-6">
                <h1 className="text-lg font-bold tracking-tight text-foreground">Categories</h1>
                <div className="h-[1px] flex-1" style={{ background: `linear-gradient(90deg, ${edition.accent}30, transparent)` }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {TAMIL_NADU_NEWS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setActiveNav("home"); setCategoryFilter(cat); }}
                    className="bg-surface border border-border hover:border-accent/20 transition-colors rounded-sm p-5 text-center cursor-pointer"
                  >
                    <div className="flex justify-center mb-2" style={{ color: edition.accent }}>{CATEGORY_ICON_MAP[cat]}</div>
                    <p className="text-sm font-semibold text-foreground-secondary/80">{cat}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
      )}
    </AuthGuard>
  );
}
