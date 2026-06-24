import type { RSSSourceConfig } from "./sources";
import { cleanNewsText, cleanNewsTitle, isLikelyBoilerplateText, stripHtml } from "@/lib/news-text";

const FETCH_TIMEOUT = 15000;
const USER_AGENT = "Mozilla/5.0 (compatible; KuralBot/1.0; Tamil Nadu news reader)";

interface ScrapedArticle {
  title: string;
  summary: string;
  content: string;
  link: string;
  pubDate: string;
  imageUrl: string;
  categories: string[];
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ta,en-IN;q=0.9,en;q=0.7",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function resolveUrl(href: string, base: string): string {
  if (!href) return "";
  try {
    return new URL(href, base).toString();
  } catch {
    return "";
  }
}

function hostMatches(url: string, websiteUrl: string): boolean {
  try {
    const candidate = new URL(url);
    const source = new URL(websiteUrl);
    return candidate.hostname === source.hostname || candidate.hostname.endsWith(`.${source.hostname}`);
  } catch {
    return true;
  }
}

function extractImageNearLink(html: string, linkStart: number, baseUrl: string): string {
  const windowHtml = html.slice(Math.max(0, linkStart - 700), Math.min(html.length, linkStart + 700));
  const imgMatch = windowHtml.match(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i);
  return imgMatch ? resolveUrl(imgMatch[1], baseUrl) : "";
}

function extractAnchors(html: string, baseUrl: string, websiteUrl: string): ScrapedArticle[] {
  const articles: ScrapedArticle[] = [];
  const seen = new Set<string>();
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null && articles.length < 20) {
    const attrs = match[1] || "";
    const body = match[2] || "";
    const href = attrs.match(/href=["']([^"']+)["']/i)?.[1] || "";
    const link = resolveUrl(href, baseUrl);
    if (!link || seen.has(link)) continue;
    if (!hostMatches(link, websiteUrl)) continue;
    if (/\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(link)) continue;
    if (/javascript:|mailto:|tel:|#$/i.test(href)) continue;

    const title = cleanNewsTitle(body);
    if (title.length < 18 || title.length > 220) continue;

    seen.add(link);
    articles.push({
      title,
      summary: title,
      content: title,
      link,
      pubDate: new Date().toISOString(),
      imageUrl: extractImageNearLink(html, match.index, baseUrl),
      categories: [],
    });
  }

  return articles;
}

async function scrapeArticleContent(url: string): Promise<string> {
  try {
    const html = await fetchWithTimeout(url);
    const contentHtml = extractReadableHtml(html);
    const paragraphs = Array.from(contentHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
      .map((match) => cleanNewsText(match[1], { maxLength: 420 }))
      .filter((text) => text.length >= 35 && !isLikelyBoilerplateText(text));

    const text = paragraphs.length > 0
      ? paragraphs.join(" ")
      : cleanNewsText(stripHtml(contentHtml), { maxLength: 5000 });

    return cleanNewsText(text, { maxLength: 5000 });
  } catch {
    return "";
  }
}

function extractReadableHtml(html: string): string {
  const article = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)?.[0];
  if (article) return article;

  const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
  if (main) return main;

  const classMatch = html.match(/<div\b[^>]+class=["'][^"']*(?:article|story|entry|post-content|article-body|story-content|news-detail|content)[^"']*["'][^>]*>[\s\S]*?<\/div>/i)?.[0];
  return classMatch || html;
}

export async function scrapeSource(source: RSSSourceConfig): Promise<{
  articles: ScrapedArticle[];
  error: string | null;
}> {
  const config = source.scraper;
  const listUrl = config?.listUrl || source.websiteUrl;

  if (!listUrl) {
    return { articles: [], error: "No scraper list URL configured" };
  }

  try {
    const html = await fetchWithTimeout(listUrl);
    const articles = extractAnchors(html, listUrl, source.websiteUrl || listUrl);

    for (const article of articles.slice(0, 8)) {
      const content = await scrapeArticleContent(article.link);
      if (content && content.length > article.summary.length) {
        article.content = content;
        article.summary = cleanNewsText(content, { maxLength: 500 });
      }
    }

    if (articles.length === 0) {
      return { articles: [], error: "Scraper found no article links" };
    }

    return { articles, error: null };
  } catch (err) {
    return { articles: [], error: err instanceof Error ? err.message : "Scraping failed" };
  }
}
