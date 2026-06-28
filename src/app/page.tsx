"use client";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { useNewsStore } from "@/store/news-store";
import AuthGuard from "@/components/auth/auth-guard";
import Header from "@/components/header";
import MobileHome from "@/components/mobile/MobileHome";
import NewsCard, { type NewsCardLanguage } from "@/components/news-card";
import AudioNewsPage from "@/components/audio-news/audio-news-page";
import ToastContainer from "@/components/toast";
import NewspaperView from "@/components/newspaper/newspaper-intro";
import ProfilePage from "@/components/auth/profile-page";
import DistrictNews from "@/components/district-news";
import TrendingSection from "@/components/trending-section";
import { BreakingNewsBar, TopStory, JustNowFeed, CategoryStrips, AudioNewsStrip } from "@/components/home";
import { getCategoryEmoji } from "@/lib/category-images";
import { TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";
import { Bookmark, RefreshCw } from "lucide-react";

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
  return Array.from(seen.values());
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
  const { activeNav, savedArticles = [], setActiveNav } = useAppStore();
  const storeArticles = useNewsStore((s) => s.articles);
  const hasNewArticles = useNewsStore((s) => s.hasNewArticles);
  const newArticlesCount = useNewsStore((s) => s.newArticlesCount);
  const acceptNewArticles = useNewsStore((s) => s.acceptNewArticles);
  const initializeNews = useNewsStore((s) => s.initialize);
  const setCategoryFilter = useNewsStore((s) => s.setCategoryFilter);

  const [displayLanguage, setDisplayLanguage] = useState<NewsCardLanguage>("ta");

  useEffect(() => {
    initializeNews();
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

  return (
    <AuthGuard>
      <div className="mobile-only">
        <MobileHome />
      </div>

      <div className="desktop-only">
      <Header />

      {activeNav === "newspaper-view" && <NewspaperView />}

      {activeNav === "home" && (
        <>
          <BreakingNewsBar />

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

          <TopStory />
          <JustNowFeed />
          <AudioNewsStrip />
          <CategoryStrips />

          {/* District News */}
          <div className="border-b border-border">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <DistrictNews language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />
            </div>
          </div>

          {/* Trending Section */}
          <div className="border-b border-border">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <TrendingSection language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {latestNews.slice(0, 16).map((item, i) => (
                <NewsCard key={item.id} item={item} index={i} language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />
              ))}
            </div>
          </div>
        </>
      )}

      {activeNav === "audio-news" && (
        <AudioNewsPage />
      )}

      {activeNav === "saved" && (
        <main className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
          <div className="notranslate flex items-center gap-2 mb-6" translate="no">
            <Bookmark size={16} className="text-accent" />
            <h1 className="text-lg font-bold tracking-tight text-foreground">Saved Articles</h1>
            <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
          </div>
          {savedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Bookmark size={40} className="text-foreground-secondary/10 mb-4" />
              <p className="text-foreground-secondary/50 text-sm mb-1">No saved articles yet</p>
              <p className="text-foreground-secondary/30 text-xs">Tap the bookmark icon on any news to save it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {savedItems.map((item, i) => (
                <NewsCard key={item.id} item={item} index={i} language={displayLanguage} onLanguageChange={setDisplayLanguage} animatedThumbnail />
              ))}
            </div>
          )}
        </main>
      )}

      {activeNav === "profile" && <ProfilePage />}

      {activeNav === "categories" && (
        <main className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
          <div className="flex items-center gap-2 mb-6">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Categories</h1>
            <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TAMIL_NADU_NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveNav("home"); setCategoryFilter(cat); }}
                className="bg-surface border border-border hover:border-accent/20 transition-colors rounded-sm p-5 text-center cursor-pointer"
              >
                <div className="flex justify-center mb-2" style={{ color: "var(--color-accent)" }}>{CATEGORY_ICON_MAP[cat]}</div>
                <p className="text-sm font-semibold text-foreground-secondary/80">{cat}</p>
              </button>
            ))}
          </div>
        </main>
      )}
      </div>

      <ToastContainer />
    </AuthGuard>
  );
}
