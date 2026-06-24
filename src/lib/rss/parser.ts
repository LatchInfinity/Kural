import Parser from "rss-parser";
import type { RSSSourceConfig } from "./sources";
import { scrapeSource } from "./scraper";
import { getApiFetcher } from "./api-providers";
import { cleanNewsText, cleanNewsTitle } from "@/lib/news-text";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Kural/1.0 (Tamil Nadu RSS Aggregator; +https://kural.app)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
    "Accept-Language": "ta,en-IN;q=0.9,en;q=0.7",
  },
});

export interface ParsedArticle {
  title: string;
  summary: string;
  content: string;
  link: string;
  guid?: string;
  pubDate: string;
  imageUrl: string;
  categories: string[];
}

export interface FeedResult {
  source: RSSSourceConfig;
  articles: ParsedArticle[];
  error: string | null;
}

type LooseRSSItem = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function getField(record: Record<string, unknown> | null, key: string): unknown {
  return record ? record[key] : undefined;
}

function mediaUrl(value: unknown): unknown {
  const first = Array.isArray(value) ? value[0] : value;
  const record = asRecord(first);
  const attrs = asRecord(getField(record, "$"));
  return getField(attrs, "url") || getField(record, "url");
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function pickMediaUrl(item: LooseRSSItem): string {
  const enclosure = asRecord(item.enclosure);
  const html = firstString(item["content:encoded"], item.content);
  const fromHtml = html.match(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i)?.[1] || "";

  return firstString(
    getField(enclosure, "url"),
    mediaUrl(item["media:content"]),
    mediaUrl(item["media:thumbnail"]),
    fromHtml,
  );
}

function normalizeArticle(item: LooseRSSItem): ParsedArticle {
  const rawContent = firstString(item["content:encoded"], item.content, item.contentSnippet, item.summary, item.description);
  const rawSummary = firstString(item.contentSnippet, item.summary, item.description, rawContent);
  const categories = Array.isArray(item.categories)
    ? item.categories.filter((c: unknown): c is string => typeof c === "string")
    : [];

  return {
    title: cleanNewsTitle(firstString(item.title)),
    summary: cleanNewsText(rawSummary, { maxLength: 500 }),
    content: cleanNewsText(rawContent || rawSummary, { maxLength: 5000 }),
    link: firstString(item.link, item.guid),
    guid: firstString(item.guid, item.id),
    pubDate: firstString(item.isoDate, item.pubDate, item.published, item.updated, new Date().toISOString()),
    imageUrl: pickMediaUrl(item),
    categories,
  };
}

async function fetchRSS(source: RSSSourceConfig): Promise<FeedResult> {
  if (!source.feedUrl) {
    return { source, articles: [], error: "No RSS feed URL configured" };
  }

  const feed = await parser.parseURL(source.feedUrl);
  const articles = (feed.items || [])
    .map((item) => normalizeArticle(item as LooseRSSItem))
    .filter((article) => article.title && article.link);

  return { source, articles, error: null };
}

export async function fetchFeed(source: RSSSourceConfig): Promise<FeedResult> {
  const apiFetcher = getApiFetcher(source);
  if (apiFetcher) {
    return apiFetcher(source);
  }

  let rssError = "";
  if (source.feedUrl) {
    try {
      return await fetchRSS(source);
    } catch (err) {
      rssError = err instanceof Error ? err.message : "Unknown RSS fetch error";
    }
  }

  if (source.scraper) {
    const scraped = await scrapeSource(source);
    if (!scraped.error && scraped.articles.length > 0) {
      return { source, articles: scraped.articles, error: null };
    }
    return {
      source,
      articles: scraped.articles,
      error: scraped.error || rssError || "No articles found by scraper fallback",
    };
  }

  return { source, articles: [], error: rssError || "No RSS, API, or scraper configured" };
}
