"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NewsItem, TimeFilter as TimeFilterType } from "@/types";
import {
  buildEnglishSummary,
  buildNewsContent,
  buildNewsSummary,
  cleanNewsText,
  cleanNewsTitle,
  isMostlyTamil,
} from "@/lib/news-text";
import { MAX_ARTICLES_HOME, NEWS_PER_CATEGORY, NEWS_RETENTION_MS, SYNC_INTERVAL_MS } from "@/lib/news-config";
import { isDisplayableNewsCategory, isDisplayableNewsItem } from "@/lib/news-policy";
import { getCategoryFallbackImageUrl } from "@/lib/category-images";

export type PulseTab = "breaking" | "last-hour" | "today" | "last-3-days";

let liveUpdateCleanup: (() => void) | null = null;

interface ApiNewsArticle {
  id: string;
  title: string;
  headline?: string;
  englishHeadline?: string;
  summary?: string;
  tamilSummary?: string;
  englishSummary?: string;
  content?: string;
  source: string;
  sourceUrl?: string;
  sourceLogoUrl?: string;
  imageUrl?: string;
  aiImageUrl?: string;
  aiVideoUrl?: string;
  videoStatus?: NewsItem["videoStatus"];
  videoPrompt?: string;
  videoGeneratedAt?: string;
  videoDuration?: number;
  videoThumbnail?: string;
  district?: string;
  playsCount?: number;
  sharesCount?: number;
  savesCount?: number;
  reactionsCount?: number;
  category: NewsItem["category"];
  publishedAt: string;
  publishedHour?: number;
  audioDuration?: string;
  isBreaking?: boolean;
  trending?: boolean;
  retention?: NewsItem["retention"];
}

interface GoogleTranslationArticle {
  id: string;
  englishHeadline?: string;
  englishSummary?: string;
  provider?: "google" | "local";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "Unable to refresh news");
}

interface NewsState {
  articles: NewsItem[];
  loading: boolean;
  lastUpdated: number | null;
  hasNewArticles: boolean;
  newArticlesCount: number;
  pendingNewArticles: NewsItem[];
  error: string | null;
  sseConnected: boolean;
  pulseTab: PulseTab;
  categoryFilter: string;
  timeFilter: TimeFilterType;
  setPulseTab: (tab: PulseTab) => void;
  setCategoryFilter: (cat: string) => void;
  setTimeFilter: (f: TimeFilterType) => void;

  initialize: () => void;
  refresh: () => Promise<void>;
  acceptNewArticles: () => void;
  fetchFromApi: () => Promise<void>;
  getPulseArticles: (tab: PulseTab) => NewsItem[];
  getArticlesByCategory: (category: string) => NewsItem[];
  getFilteredArticles: () => NewsItem[];
  destroy: () => void;
}

function comparableNewsText(value: string): string {
  return cleanNewsText(value, { maxLength: 280 })
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSimilarity(a: string, b: string): number {
  const left = new Set(a.split(" ").filter((token) => token.length > 2));
  const right = new Set(b.split(" ").filter((token) => token.length > 2));
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap++;
  }
  return overlap / Math.min(left.size, right.size);
}

function isFreshArticle(item: NewsItem): boolean {
  const published = new Date(item.publishedAt).getTime();
  if (Number.isNaN(published)) return false;
  return Date.now() - published <= NEWS_RETENTION_MS;
}

function isSameNews(candidate: NewsItem, existing: NewsItem): boolean {
  const candidateTitle = comparableNewsText(candidate.headline || candidate.title);
  const existingTitle = comparableNewsText(existing.headline || existing.title);
  if (candidateTitle && existingTitle) {
    if (candidateTitle === existingTitle) return true;
    if (candidateTitle.includes(existingTitle) || existingTitle.includes(candidateTitle)) return true;
    if (tokenSimilarity(candidateTitle, existingTitle) >= 0.72) return true;
  }

  const candidateBody = comparableNewsText(`${candidate.summary} ${candidate.tamilSummary} ${candidate.content}`);
  const existingBody = comparableNewsText(`${existing.summary} ${existing.tamilSummary} ${existing.content}`);
  return tokenSimilarity(candidateBody, existingBody) >= 0.82;
}

function deduplicateById(items: NewsItem[]): NewsItem[] {
  const seen = new Map<string, NewsItem>();
  for (const item of items) {
    if (!isDisplayableNewsItem(item)) continue;
    if (!isFreshArticle(item)) continue;
    if (seen.has(item.id)) continue;
    if (Array.from(seen.values()).some((existing) => isSameNews(item, existing))) continue;
    seen.set(item.id, item);
  }
  const categoryCounts = new Map<string, number>();
  return Array.from(seen.values()).filter((item) => {
    const category = item.category || "unknown";
    const count = categoryCounts.get(category) || 0;
    if (count >= NEWS_PER_CATEGORY) return false;
    categoryCounts.set(category, count + 1);
    return true;
  });
}

function resolveDisplayArticles(items: NewsItem[] | undefined): NewsItem[] {
  const now = Date.now();
  const normalized = (Array.isArray(items) ? items : []).map((item, index) => {
    const parsedTime = new Date(item.publishedAt).getTime();
    const publishedAt = Number.isNaN(parsedTime)
      ? new Date(now - index * 45 * 60 * 1000).toISOString()
      : item.publishedAt;
    const retention = item.retention || (item.isBreaking ? "breaking" : "latest");
    const headline = cleanNewsTitle(item.headline || item.title);
    const content = buildNewsContent(item.summary || item.tamilSummary, item.content, headline);
    const summary = buildNewsSummary(item.summary || item.tamilSummary, content, headline);
    const categoryAiImageUrl = getCategoryFallbackImageUrl(item.category, true);

    return {
      ...item,
      title: cleanNewsTitle(item.title || headline),
      headline,
      englishHeadline: cleanNewsTitle(item.englishHeadline || ""),
      summary,
      tamilSummary: summary,
      englishSummary: buildEnglishSummary({ ...item, headline, summary, content }),
      content,
      publishedAt,
      publishedHour: new Date(publishedAt).getHours(),
      imageUrl: categoryAiImageUrl,
      aiImageUrl: categoryAiImageUrl,
      videoThumbnail: categoryAiImageUrl,
      retention,
      isBreaking: item.isBreaking || retention === "breaking",
      trending: item.trending || retention === "breaking",
    };
  });
  return deduplicateById(normalized);
}

function applyTranslatedArticles(
  items: NewsItem[],
  translations: GoogleTranslationArticle[],
  provider: "google" | "local" = "google",
): NewsItem[] {
  const byId = new Map(translations.map((article) => [article.id, article]));
  return items.map((item) => {
    const translated = byId.get(item.id);
    if (!translated) return item;

    const englishHeadline = cleanNewsTitle(translated.englishHeadline || "");
    const englishSummary = cleanNewsText(translated.englishSummary || "", { maxLength: 520 });

    return {
      ...item,
      englishHeadline: englishHeadline && !isMostlyTamil(englishHeadline) ? englishHeadline : item.englishHeadline,
      englishSummary: englishSummary && !isMostlyTamil(englishSummary) ? englishSummary : item.englishSummary,
      translationProvider: provider === "google" ? "google" : item.translationProvider || "local",
    };
  });
}

async function translateArticlesWithGoogle(items: NewsItem[]): Promise<NewsItem[]> {
  const candidates = items.filter((item) => (
    isMostlyTamil(item.headline || "") ||
    isMostlyTamil(item.tamilSummary || item.summary || item.content || "")
  ));
  if (candidates.length === 0) return items;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articles: candidates.slice(0, 50).map((item) => ({
          id: item.id,
          title: item.title,
          headline: item.headline,
          summary: item.summary,
          tamilSummary: item.tamilSummary,
          content: item.content,
        })),
      }),
    });
    if (!res.ok) return items;

    const data = await res.json() as { articles?: GoogleTranslationArticle[]; provider?: "google" | "local" };
    if (!Array.isArray(data.articles)) return items;
    return applyTranslatedArticles(items, data.articles, data.provider || "google");
  } catch {
    return items;
  }
}

function mapDbArticle(a: ApiNewsArticle): NewsItem {
  const headline = cleanNewsTitle(a.headline || a.title);
  const content = buildNewsContent(a.summary || a.tamilSummary, a.content || "", headline);
  const summary = buildNewsSummary(a.summary || a.tamilSummary, content, headline);
  const categoryAiImageUrl = getCategoryFallbackImageUrl(a.category, true);

  return {
    id: a.id,
    title: cleanNewsTitle(a.title),
    headline,
    englishHeadline: cleanNewsTitle(a.englishHeadline || ""),
    summary,
    tamilSummary: summary,
    englishSummary: buildEnglishSummary({ ...a, headline, summary, content }),
    content,
    source: a.source,
    sourceUrl: a.sourceUrl || "",
    sourceLogoUrl: a.sourceLogoUrl || "",
    imageUrl: categoryAiImageUrl,
    aiImageUrl: categoryAiImageUrl,
    aiVideoUrl: a.aiVideoUrl || "",
    videoStatus: a.videoStatus,
    videoPrompt: a.videoPrompt || "",
    videoGeneratedAt: a.videoGeneratedAt || "",
    videoDuration: a.videoDuration || 5,
    videoThumbnail: categoryAiImageUrl,
    district: a.district || "",
    playsCount: a.playsCount || 0,
    sharesCount: a.sharesCount || 0,
    savesCount: a.savesCount || 0,
    reactionsCount: a.reactionsCount || 0,
    category: a.category,
    publishedAt: a.publishedAt,
    publishedHour: a.publishedHour || new Date(a.publishedAt).getHours(),
    audioDuration: a.audioDuration || "",
    isBreaking: a.isBreaking || a.retention === "breaking",
    trending: a.trending || a.retention === "breaking",
    retention: a.retention,
  };
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      articles: [],
      loading: false,
      lastUpdated: null,
      hasNewArticles: false,
      newArticlesCount: 0,
      pendingNewArticles: [],
      error: null,
      sseConnected: false,
      pulseTab: "breaking" as PulseTab,
      categoryFilter: "",
      timeFilter: "all" as TimeFilterType,

      setPulseTab: (tab) => set({ pulseTab: tab }),
      setCategoryFilter: (cat) => set({ categoryFilter: cat && isDisplayableNewsCategory(cat) ? cat : "" }),
      setTimeFilter: (f) => set({ timeFilter: f }),

      getPulseArticles: (tab) => {
        const all = get().articles;
        const now = Date.now();
        switch (tab) {
          case "breaking":
            return all.filter((a) => a.retention === "breaking");
          case "last-hour": {
            const oneHour = 60 * 60 * 1000;
            return all.filter((a) => {
              const t = new Date(a.publishedAt).getTime();
              return now - t <= oneHour;
            });
          }
          case "today": {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return all.filter((a) => new Date(a.publishedAt) >= today);
          }
          case "last-3-days": {
            const threeDays = 3 * 24 * 60 * 60 * 1000;
            return all.filter((a) => {
              const t = new Date(a.publishedAt).getTime();
              return now - t <= threeDays;
            });
          }
          default:
            return all;
        }
      },

      getArticlesByCategory: (category) => {
        return get().articles.filter((a) => a.category === category);
      },

      getFilteredArticles: () => {
        let result = get().articles.filter((a) => a.retention !== "archived");
        const now = Date.now();

        const catFilter = get().categoryFilter;
        if (catFilter) {
          result = result.filter((a) => a.category === catFilter);
        }

        const timeFilter = get().timeFilter;
        if (timeFilter === "last-hour") {
          const oneHour = 60 * 60 * 1000;
          result = result.filter((a) => now - new Date(a.publishedAt).getTime() <= oneHour);
        } else if (timeFilter === "today") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          result = result.filter((a) => new Date(a.publishedAt) >= today);
        } else if (timeFilter === "last-3-days") {
          const threeDays = 3 * 24 * 60 * 60 * 1000;
          result = result.filter((a) => now - new Date(a.publishedAt).getTime() <= threeDays);
        }

        return result;
      },

      fetchFromApi: async () => {
        try {
          const res = await fetch(`/api/news?retention=active&limit=${MAX_ARTICLES_HOME}&_=` + Date.now());
          if (!res.ok) return;
          const data = await res.json() as { articles?: ApiNewsArticle[] };
          if (data.articles && data.articles.length > 0) {
            const mapped = await translateArticlesWithGoogle(deduplicateById(data.articles.map(mapDbArticle)));
            const state = get();
            const existingIds = new Set(state.articles.map((a) => a.id));
            const newOnes = mapped.filter((a: NewsItem) => {
              const isNew = !existingIds.has(a.id);
              if (!isNew) {
                console.log("Duplicate Article", a.id, a.title);
              }
              return isNew;
            });
            set({
              articles: mapped,
              pendingNewArticles: newOnes,
              hasNewArticles: newOnes.length > 0,
              newArticlesCount: newOnes.length,
              lastUpdated: Date.now(),
              loading: false,
            });
          } else {
            set({ articles: [], loading: false });
          }
        } catch {
          if (get().articles.length === 0) set({ articles: [], loading: false });
        }
      },

      initialize: () => {
        if (liveUpdateCleanup) {
          void get().fetchFromApi();
          return;
        }

        void get().fetchFromApi();

        const es = new EventSource("/api/events");
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as { type?: string; count?: number };
            if (data.type === "new-articles") {
              set({ hasNewArticles: true, newArticlesCount: data.count ?? 0 });
            }
            if (data.type === "connected") {
              set({ sseConnected: true });
              void get().fetchFromApi();
            }
          } catch { /* ignore */ }
        };
        es.onerror = () => set({ sseConnected: false });

        const interval = setInterval(() => { void get().fetchFromApi(); }, SYNC_INTERVAL_MS);

        liveUpdateCleanup = () => {
          es.close();
          clearInterval(interval);
          liveUpdateCleanup = null;
          set({ sseConnected: false });
        };

        set({ destroy: () => { liveUpdateCleanup?.(); } });
      },

      refresh: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`/api/news?retention=active&limit=${MAX_ARTICLES_HOME}&_=` + Date.now());
          if (!res.ok) throw new Error("API error");
          const data = await res.json() as { articles?: ApiNewsArticle[] };
          if (data.articles) {
            const articles = data.articles.length > 0
              ? await translateArticlesWithGoogle(deduplicateById(data.articles.map(mapDbArticle)))
              : [];
            set({
              articles,
              loading: false,
              hasNewArticles: false,
              newArticlesCount: 0,
              pendingNewArticles: [],
              lastUpdated: Date.now(),
            });
          }
        } catch (err: unknown) {
          set({ loading: false, error: errorMessage(err) });
        }
      },

      acceptNewArticles: () => {
        const state = get();
        if (state.pendingNewArticles.length === 0) return;
        const merged = deduplicateById([...state.pendingNewArticles, ...state.articles]);
        const dupesRemoved = state.pendingNewArticles.length + state.articles.length - merged.length;
        if (dupesRemoved > 0) {
          console.log(`acceptNewArticles: removed ${dupesRemoved} duplicates`);
        }
        set({
          articles: merged,
          pendingNewArticles: [],
          hasNewArticles: false,
          newArticlesCount: 0,
        });
      },

      destroy: () => {},
    }),
    {
      name: "kural-news-storage",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<NewsState> | undefined;
        return {
          ...currentState,
          ...persisted,
          articles: resolveDisplayArticles(persisted?.articles || currentState.articles),
        };
      },
      partialize: (state) => ({
        articles: resolveDisplayArticles(state.articles),
        lastUpdated: state.lastUpdated,
        categoryFilter: state.categoryFilter,
        timeFilter: state.timeFilter,
      }),
    }
  )
);
