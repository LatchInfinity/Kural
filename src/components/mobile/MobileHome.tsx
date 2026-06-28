"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  ChevronUp,
  Clock,
  Flame,
  Headphones,
  Home,
  Newspaper,
  Pause,
  Play,
  RefreshCw,
  Search,
  Target,
  User,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { useNewsStore } from "@/store/news-store";
import { useUserStore } from "@/store/user-store";
import type { QueueItem } from "@/lib/audio-engine";
import {
  getArticleContentText,
  getArticleDisplayText,
  getCategoryDisplayText,
} from "@/lib/news-text";
import { getCategoryFallbackImageUrl } from "@/lib/category-images";
import type { NewsItem } from "@/types";

const QUICK_CATEGORIES = [
  { id: "all", label: "All", terms: [] },
  { id: "politics", label: "Politics", terms: ["தமிழ்நாடு அரசியல்", "அரசியல்", "Politics"] },
  { id: "business", label: "Business", terms: ["தமிழ்நாடு வணிகம்", "வணிகம்", "Business"] },
  { id: "education", label: "Education", terms: ["தமிழ்நாடு கல்வி", "கல்வி", "Education", "school", "college"] },
  { id: "crime", label: "Crime", terms: ["தமிழ்நாடு குற்றம்", "குற்றம்", "Crime", "Police", "Court"] },
  { id: "transport", label: "Transport", terms: ["தமிழ்நாடு போக்குவரத்து", "போக்குவரத்து", "Railway", "Train", "Metro", "Bus"] },
  { id: "local", label: "Local", terms: ["தமிழ்நாடு உள்ளூர்", "உள்ளூர்", "Local", "Tamil Nadu"] },
  { id: "sports", label: "Sports", terms: ["தமிழ்நாடு விளையாட்டு", "விளையாட்டு", "Sports", "Cricket"] },
  { id: "technology", label: "Technology", terms: ["தமிழ்நாடு தொழில்நுட்பம்", "தொழில்நுட்பம்", "Technology", "AI"] },
  { id: "cinema", label: "Cinema", terms: ["சினிமா", "திரைப்பட", "Cinema", "Movie", "Film"] },
] as const;

const DISTRICTS = ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy", "Tirunelveli"] as const;

const MOBILE_NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "audio-news", label: "Audio", icon: Headphones },
  { id: "newspaper-view", label: "Newspaper", icon: Newspaper },
  { id: "categories", label: "Categories", icon: Target },
  { id: "profile", label: "Profile", icon: User },
] as const;

function dedupeById(items: NewsItem[]): NewsItem[] {
  const seen = new Map<string, NewsItem>();
  for (const item of items) seen.set(item.id, item);
  return Array.from(seen.values());
}

function newestFirst(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.publishedAt).getTime();
    const bTime = new Date(b.publishedAt).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
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

function categoryLabel(item: Pick<NewsItem, "category"> | QueueItem): string {
  return getCategoryDisplayText(item.category, "en");
}

function audioSeconds(item: Pick<NewsItem, "id"> | QueueItem): number {
  const seed = Array.from(item.id || "kural").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 30 + (seed % 16);
}

function formatDuration(seconds: number): string {
  return `0:${seconds.toString().padStart(2, "0")}`;
}

function timeAgo(value?: string): string {
  if (!value) return "Latest";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Latest";
  const mins = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function matchesTerms(item: NewsItem, terms: readonly string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = [
    item.category,
    item.headline,
    item.englishHeadline,
    item.summary,
    item.tamilSummary,
    item.district,
  ].filter(Boolean).join(" ").toLowerCase();
  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

function districtTerms(district: string): string[] {
  if (district === "Trichy") return ["trichy", "tiruchirappalli", "திருச்சி"];
  return [district.toLowerCase(), district];
}

export default function MobileHome() {
  const activeNav = useAppStore((s) => s.activeNav);
  const setActiveNav = useAppStore((s) => s.setActiveNav);
  const playNews = useAppStore((s) => s.playNews);
  const savedArticles = useAppStore((s) => s.savedArticles);

  const articles = useNewsStore((s) => s.articles);
  const refreshNews = useNewsStore((s) => s.refresh);
  const newsLoading = useNewsStore((s) => s.loading);
  const hasNewArticles = useNewsStore((s) => s.hasNewArticles);
  const newArticlesCount = useNewsStore((s) => s.newArticlesCount);
  const acceptNewArticles = useNewsStore((s) => s.acceptNewArticles);

  const setPopupOpen = useAudioStore((s) => s.setPopupOpen);
  const currentTrack = useAudioStore((s) => s.currentTrack);

  const currentUser = useUserStore((s) => s.currentUser);
  const streaks = useUserStore((s) => s.getStreaks)();

  const [selectedCategory, setSelectedCategory] = useState<(typeof QUICK_CATEGORIES)[number]["id"]>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const newsData = useMemo(
    () => dedupeById(articles.filter((item) => item.retention !== "archived")),
    [articles],
  );

  const selectedCategoryConfig = QUICK_CATEGORIES.find((cat) => cat.id === selectedCategory) || QUICK_CATEGORIES[0];

  const filteredNews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return newsData.filter((item) => {
      const matchesCategory = selectedCategory === "all" || matchesTerms(item, selectedCategoryConfig.terms);
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      const text = [item.headline, item.englishHeadline, item.summary, item.category, item.district, item.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [newsData, query, selectedCategory, selectedCategoryConfig.terms]);

  const featured = filteredNews[0] || newsData[0];
  const trending = useMemo(() => {
    const priority = filteredNews.filter((item) => item.trending || item.isBreaking);
    return dedupeById([...priority, ...filteredNews]).filter((item) => item.id !== featured?.id).slice(0, 8);
  }, [featured?.id, filteredNews]);
  const latest = filteredNews.slice(0, 18);
  const newspaperNews = useMemo(() => newestFirst(newsData), [newsData]);
  const newspaperFeatured = newspaperNews[0];
  const newspaperLatest = newspaperNews.slice(0, 18);

  const districtCards = useMemo(() => {
    return DISTRICTS.map((district) => {
      const terms = districtTerms(district);
      const districtItems = newsData.filter((item) => {
        const haystack = [item.district, item.headline, item.summary, item.sourceUrl].filter(Boolean).join(" ").toLowerCase();
        return terms.some((term) => haystack.includes(term.toLowerCase()));
      });
      return {
        district,
        count: districtItems.length,
        item: districtItems[0] || newsData[0],
      };
    }).filter((card) => Boolean(card.item));
  }, [newsData]);

  const recommended = useMemo(() => {
    const currentCategory = currentTrack?.category;
    const sameCategory = currentCategory
      ? newsData.filter((item) => item.category === currentCategory && item.id !== currentTrack.id)
      : [];
    const categoryBased = selectedCategory === "all" ? [] : filteredNews.slice(4);
    return dedupeById([...sameCategory, ...categoryBased, ...newsData.slice(6)]).slice(0, 8);
  }, [currentTrack, filteredNews, newsData, selectedCategory]);

  const playItem = (item: NewsItem, queue: NewsItem[] = latest, index = 0) => {
    const scopedQueue = queue.length > 0 ? queue : [item];
    const queueIndex = Math.max(0, Math.min(index, scopedQueue.length - 1));
    playNews(toQueueItem(item), queueIndex, scopedQueue.map(toQueueItem));
    setPopupOpen(false);
  };

  const nav = activeNav === "audio-news"
    || activeNav === "newspaper-view"
    || activeNav === "categories"
    || activeNav === "profile"
    ? activeNav
    : "home";

  return (
    <div className="kural-mobile-shell mobile-layout notranslate" translate="no">
      <MobileTopHeader
        query={query}
        searchOpen={searchOpen}
        hasNewArticles={hasNewArticles}
        newArticlesCount={newArticlesCount}
        onQueryChange={setQuery}
        onToggleSearch={() => setSearchOpen((open) => !open)}
        onNotification={hasNewArticles ? acceptNewArticles : undefined}
      />

      {hasNewArticles && nav === "home" && (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-lg border border-[var(--mobile-border)] bg-white px-3 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[var(--mobile-red)]" />
          <p className="min-w-0 flex-1 text-xs font-semibold text-[var(--mobile-ink)]">
            {newArticlesCount} new {newArticlesCount === 1 ? "briefing" : "briefings"} ready
          </p>
          <button
            type="button"
            onClick={acceptNewArticles}
            className="rounded-full bg-[var(--mobile-ink)] px-3 py-1.5 text-[11px] font-bold text-white"
          >
            Update
          </button>
        </div>
      )}

      {nav === "home" && (
        <main className="kural-mobile-main">
          {featured && (
            <HeroAudioSection
              item={featured}
              loading={newsLoading}
              onRefresh={() => { void refreshNews(); }}
              onPlay={() => playItem(featured, latest, 0)}
            />
          )}
          <QuickCategories selected={selectedCategory} onSelect={setSelectedCategory} />
          <HorizontalAudioSection title="Trending Audio News" items={trending} onPlay={playItem} />
          <LatestBriefings items={latest} onPlay={playItem} />
          <DistrictNewsRail cards={districtCards} onPlay={(item) => playItem(item, latest, 0)} />
          <HorizontalAudioSection title="Recommended For You" items={recommended} onPlay={playItem} compact />
        </main>
      )}

      {nav === "audio-news" && (
        <main className="kural-mobile-main">
          <MobilePageTitle eyebrow="Kural audio" title="Audio News" count={latest.length} />
          <QuickCategories selected={selectedCategory} onSelect={setSelectedCategory} />
          <LatestBriefings items={latest} onPlay={playItem} heading="Latest Audio Briefings" />
          <HorizontalAudioSection title="Recommended For You" items={recommended} onPlay={playItem} compact />
        </main>
      )}

      {nav === "newspaper-view" && (
        <main className="kural-mobile-main">
          <MobilePageTitle eyebrow="Mobile edition" title="Newspaper" count={newspaperNews.length} />
          {newspaperFeatured && (
            <section className="rounded-lg border border-[var(--mobile-border)] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--mobile-ink)] text-white">
                  <Newspaper size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--mobile-red)]">Today</p>
                  <h2 className="line-clamp-2 text-base font-black leading-tight text-[var(--mobile-ink)]">{newspaperFeatured.headline}</h2>
                </div>
              </div>
            </section>
          )}
          <LatestBriefings items={newspaperLatest} onPlay={playItem} heading="Top Stories" />
        </main>
      )}

      {nav === "categories" && (
        <main className="kural-mobile-main">
          <MobilePageTitle eyebrow="Browse" title="Categories" count={QUICK_CATEGORIES.length - 1} />
          <div className="grid grid-cols-2 gap-3">
            {QUICK_CATEGORIES.filter((cat) => cat.id !== "all").map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setActiveNav("home");
                }}
                className="min-h-[104px] rounded-lg border border-[var(--mobile-border)] bg-white p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
              >
                <span className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-[var(--mobile-soft)] text-sm font-black text-[var(--mobile-red)]">
                  {cat.label.slice(0, 1)}
                </span>
                <span className="block text-sm font-black text-[var(--mobile-ink)]">{cat.label}</span>
                <span className="mt-1 block text-[11px] font-semibold text-[var(--mobile-muted)]">Audio briefings</span>
              </button>
            ))}
          </div>
        </main>
      )}

      {nav === "profile" && (
        <main className="kural-mobile-main">
          <MobilePageTitle eyebrow="Listener" title="Profile" count={savedArticles.length} />
          <section className="rounded-lg border border-[var(--mobile-border)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[var(--mobile-ink)] text-xl font-black text-white">
                {(currentUser?.username || "K").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-[var(--mobile-ink)]">{currentUser?.username || "Kural listener"}</h2>
                <p className="truncate text-xs font-medium text-[var(--mobile-muted)]">{currentUser?.email || "Audio news profile"}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <ProfileStat label="Saved" value={savedArticles.length} icon={<Bookmark size={14} />} />
              <ProfileStat label="Streak" value={streaks.listeningStreak} icon={<Flame size={14} />} />
              <ProfileStat label="Best" value={streaks.bestListeningStreak} icon={<Headphones size={14} />} />
            </div>
          </section>
        </main>
      )}

      <MobileMiniPlayer />
      <MobileBottomNav active={nav} onNav={setActiveNav} />
    </div>
  );
}

function MobileTopHeader({
  query,
  searchOpen,
  hasNewArticles,
  newArticlesCount,
  onQueryChange,
  onToggleSearch,
  onNotification,
}: {
  query: string;
  searchOpen: boolean;
  hasNewArticles: boolean;
  newArticlesCount: number;
  onQueryChange: (value: string) => void;
  onToggleSearch: () => void;
  onNotification?: () => void;
}) {
  return (
    <header className="kural-mobile-header">
      <div className="flex h-16 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--mobile-ink)] font-serif text-lg font-black text-white">
            K
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--mobile-red)]">Kural</p>
            <h1 className="text-lg font-black leading-none tracking-tight text-[var(--mobile-ink)]">Audio News</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSearch}
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--mobile-border)] bg-white text-[var(--mobile-ink)] shadow-sm"
            aria-label={searchOpen ? "Close search" : "Search"}
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          <button
            type="button"
            onClick={onNotification}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-[var(--mobile-border)] bg-white text-[var(--mobile-ink)] shadow-sm"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {hasNewArticles && (
              <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--mobile-red)] px-1 text-[9px] font-black text-white">
                {Math.min(newArticlesCount, 9)}
              </span>
            )}
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="px-4 pb-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mobile-muted)]" size={16} />
            <input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.currentTarget.value)}
              placeholder="Search audio news"
              className="h-11 w-full rounded-full border border-[var(--mobile-border)] bg-white pl-10 pr-4 text-sm font-semibold text-[var(--mobile-ink)] outline-none placeholder:text-[var(--mobile-muted)]"
            />
          </label>
        </div>
      )}
    </header>
  );
}

function HeroAudioSection({
  item,
  loading,
  onRefresh,
  onPlay,
}: {
  item: NewsItem;
  loading: boolean;
  onRefresh: () => void;
  onPlay: () => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--mobile-red)]">Featured briefing</p>
          <h2 className="text-xl font-black tracking-tight text-[var(--mobile-ink)]">Listen Now</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--mobile-border)] bg-white text-[var(--mobile-ink)] shadow-sm"
          aria-label="Refresh feed"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <article className="overflow-hidden rounded-lg border border-[var(--mobile-border)] bg-white shadow-[var(--mobile-shadow)]">
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--mobile-ink)]">
          <MobileArtwork item={item} className="h-full w-full object-cover" loading="eager" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/24 to-transparent p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--mobile-red)]">
                {categoryLabel(item)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white">
                <Clock size={10} />
                {formatDuration(audioSeconds(item))}
              </span>
            </div>
            <h3 className="line-clamp-2 text-balance text-xl font-black leading-tight text-white">{item.headline}</h3>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3">
          <button
            type="button"
            onClick={onPlay}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--mobile-red)] text-white shadow-lg shadow-red-900/20 transition-transform active:scale-95"
            aria-label="Play featured news"
          >
            <Play size={20} fill="currentColor" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[var(--mobile-muted)]">{item.source || "Kural"} · {timeAgo(item.publishedAt)} ago</p>
            <div className="mt-2 flex h-5 items-end gap-1">
              {[10, 16, 8, 20, 13, 18, 9, 15].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="kural-mobile-wave-bar"
                  style={{ height, animationDelay: `${index * 90}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function QuickCategories({
  selected,
  onSelect,
}: {
  selected: (typeof QUICK_CATEGORIES)[number]["id"];
  onSelect: (id: (typeof QUICK_CATEGORIES)[number]["id"]) => void;
}) {
  return (
    <section className="-mx-4 overflow-x-auto px-4 scrollbar-none">
      <div className="flex w-max gap-2 py-1">
        {QUICK_CATEGORIES.map((category) => {
          const isActive = selected === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className="h-9 rounded-full border px-4 text-xs font-black transition-colors"
              style={{
                borderColor: isActive ? "var(--mobile-red)" : "var(--mobile-border)",
                background: isActive ? "var(--mobile-red)" : "#fff",
                color: isActive ? "#fff" : "var(--mobile-ink)",
              }}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HorizontalAudioSection({
  title,
  items,
  onPlay,
  compact = false,
}: {
  title: string;
  items: NewsItem[];
  onPlay: (item: NewsItem, queue: NewsItem[], index: number) => void;
  compact?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <SectionTitle title={title} />
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none">
        <div className="flex w-max gap-3 pb-1">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPlay(item, items, index)}
              className="w-[238px] shrink-0 overflow-hidden rounded-lg border border-[var(--mobile-border)] bg-white text-left shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="relative aspect-video overflow-hidden bg-[var(--mobile-ink)]">
                <MobileArtwork item={item} className="h-full w-full object-cover" />
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                  <Clock size={10} />
                  {formatDuration(audioSeconds(item))}
                </span>
                <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-white text-[var(--mobile-red)]">
                  <Play size={13} fill="currentColor" />
                </span>
              </div>
              <div className={compact ? "p-3" : "p-3.5"}>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--mobile-teal)]">{categoryLabel(item)}</p>
                <h3 className="line-clamp-2 text-sm font-black leading-snug text-[var(--mobile-ink)]">{item.headline}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function LatestBriefings({
  items,
  onPlay,
  heading = "Latest Audio Briefings",
}: {
  items: NewsItem[];
  onPlay: (item: NewsItem, queue: NewsItem[], index: number) => void;
  heading?: string;
}) {
  return (
    <section className="space-y-3">
      <SectionTitle title={heading} />
      <div className="space-y-2">
        {items.slice(0, 12).map((item, index) => (
          <article
            key={item.id}
            className="flex min-h-[92px] items-center gap-3 rounded-lg border border-[var(--mobile-border)] bg-white p-2.5 shadow-sm"
          >
            <div className="h-[72px] w-[82px] shrink-0 overflow-hidden rounded-lg bg-[var(--mobile-ink)]">
              <MobileArtwork item={item} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 self-stretch py-0.5">
              <h3 className="line-clamp-2 text-sm font-black leading-snug text-[var(--mobile-ink)]">{item.headline}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold text-[var(--mobile-muted)]">
                <span className="text-[var(--mobile-teal)]">{categoryLabel(item)}</span>
                <span>{formatDuration(audioSeconds(item))}</span>
                <span>{timeAgo(item.publishedAt)} ago</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onPlay(item, items, index)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--mobile-ink)] text-white transition-transform active:scale-95"
              aria-label={`Play ${item.headline}`}
            >
              <Play size={15} fill="currentColor" />
            </button>
          </article>
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-[var(--mobile-border)] bg-white p-8 text-center">
            <Headphones size={34} className="mx-auto text-[var(--mobile-muted)]" />
            <p className="mt-3 text-sm font-bold text-[var(--mobile-muted)]">No audio briefings found</p>
          </div>
        )}
      </div>
    </section>
  );
}

function DistrictNewsRail({
  cards,
  onPlay,
}: {
  cards: { district: string; count: number; item: NewsItem }[];
  onPlay: (item: NewsItem) => void;
}) {
  if (cards.length === 0) return null;
  return (
    <section className="space-y-3">
      <SectionTitle title="District News" />
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none">
        <div className="flex w-max gap-3 pb-1">
          {cards.map((card) => (
            <button
              key={card.district}
              type="button"
              onClick={() => onPlay(card.item)}
              className="relative h-[118px] w-[170px] shrink-0 overflow-hidden rounded-lg border border-[var(--mobile-border)] bg-[var(--mobile-ink)] text-left shadow-sm"
            >
              <MobileArtwork item={card.item} className="absolute inset-0 h-full w-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-base font-black text-white">{card.district}</p>
                <p className="mt-0.5 text-[10px] font-bold text-white/75">{Math.max(card.count, 1)} briefings</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileMiniPlayer() {
  const track = useAudioStore((s) => s.currentTrack);
  const isPopupOpen = useAudioStore((s) => s.isPopupOpen);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const toggle = useAudioStore((s) => s.toggle);
  const setPopupOpen = useAudioStore((s) => s.setPopupOpen);

  if (!track || isPopupOpen) return null;

  return (
    <div className="kural-mobile-mini-player">
      <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-[var(--mobile-ink)] p-2 text-white shadow-2xl shadow-black/25">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <Headphones size={18} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-xs font-black leading-tight">{track.title}</p>
          <p className="mt-1 text-[10px] font-semibold text-white/58">
            {isLoading ? "Loading" : isPlaying ? "Playing" : "Paused"} · {categoryLabel(track)}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[var(--mobile-ink)]"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
        </button>
        <button
          type="button"
          onClick={() => setPopupOpen(true)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white"
          aria-label="Expand player"
        >
          <ChevronUp size={18} />
        </button>
      </div>
    </div>
  );
}

function MobileBottomNav({
  active,
  onNav,
}: {
  active: string;
  onNav: (id: string) => void;
}) {
  return (
    <nav className="kural-mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="grid grid-cols-5 gap-1 rounded-t-[18px] border-t border-[var(--mobile-border)] bg-white px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_38px_rgba(17,24,39,0.10)]">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNav(item.id)}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5"
              style={{
                color: isActive ? "var(--mobile-red)" : "var(--mobile-muted)",
                background: isActive ? "var(--mobile-soft)" : "transparent",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.8 : 2.2} />
              <span className="w-full truncate text-center text-[10px] font-black">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function MobilePageTitle({ eyebrow, title, count }: { eyebrow: string; title: string; count: number }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--mobile-red)]">{eyebrow}</p>
        <h2 className="text-2xl font-black tracking-tight text-[var(--mobile-ink)]">{title}</h2>
      </div>
      <span className="rounded-full border border-[var(--mobile-border)] bg-white px-3 py-1.5 text-[11px] font-black text-[var(--mobile-muted)]">
        {count}
      </span>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-black tracking-tight text-[var(--mobile-ink)]">{title}</h2>
      <span className="h-px flex-1 bg-[var(--mobile-border)]" />
    </div>
  );
}

function ProfileStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--mobile-soft)] px-2 py-3">
      <div className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-white text-[var(--mobile-red)]">{icon}</div>
      <p className="text-lg font-black text-[var(--mobile-ink)]">{value}</p>
      <p className="text-[10px] font-bold text-[var(--mobile-muted)]">{label}</p>
    </div>
  );
}

function MobileArtwork({
  item,
  className,
  loading = "lazy",
}: {
  item: Pick<NewsItem, "headline" | "imageUrl" | "aiImageUrl" | "category">;
  className: string;
  loading?: "lazy" | "eager";
}) {
  const imageCandidates = useMemo(() => {
    const seen = new Set<string>();
    return [item.aiImageUrl, item.imageUrl, getCategoryFallbackImageUrl(item.category, true)]
      .map((value) => (value || "").trim())
      .filter((value) => {
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
      });
  }, [item.aiImageUrl, item.category, item.imageUrl]);
  const imageCandidatesKey = imageCandidates.join("|");
  const [imageIndex, setImageIndex] = useState(0);
  const src = imageCandidates[imageIndex] || "";

  useEffect(() => {
    setImageIndex(0);
  }, [imageCandidatesKey]);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading={loading}
        decoding="async"
        className={className}
        onError={() => setImageIndex((current) => current + 1)}
      />
    );
  }

  return (
    <div className={`${className} kural-mobile-art-fallback`}>
      <span className="text-2xl font-black">{categoryLabel(item).slice(0, 1)}</span>
    </div>
  );
}
