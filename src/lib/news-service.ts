"use client";

import type { NewsItem } from "@/types";
import { newsData } from "@/lib/news";

export interface FetchResult {
  articles: NewsItem[];
  newArticles: NewsItem[];
  updatedArticles: NewsItem[];
}

const STORAGE_KEY = "kural-cached-articles";

function loadCached(): NewsItem[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(articles: NewsItem[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  } catch {}
}

export async function fetchNews(): Promise<FetchResult> {
  const cached = loadCached();
  const fresh = newsData;
  const prevMap = new Map((cached || fresh).map((a) => [a.id, a]));
  const newArticles: NewsItem[] = [];
  const updatedArticles: NewsItem[] = [];

  for (const article of fresh) {
    const existing = prevMap.get(article.id);
    if (!existing) {
      newArticles.push(article);
    } else if (
      existing.headline !== article.headline ||
      existing.summary !== article.summary ||
      existing.publishedAt !== article.publishedAt
    ) {
      updatedArticles.push(article);
    }
  }

  const articles = fresh;
  saveCache(articles);

  return { articles, newArticles, updatedArticles };
}

let refreshTimer: ReturnType<typeof setInterval> | null = null;

export function startAutoRefresh(
  callback: (result: FetchResult) => void,
  intervalMs = 60000
): void {
  stopAutoRefresh();
  refreshTimer = setInterval(async () => {
    try {
      const result = await fetchNews();
      if (result.newArticles.length > 0 || result.updatedArticles.length > 0) {
        callback(result);
      }
    } catch {}
  }, intervalMs);
}

export function stopAutoRefresh(): void {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
