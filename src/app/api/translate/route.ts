import { NextRequest, NextResponse } from "next/server";
import {
  buildEnglishSummary,
  cleanNewsText,
  cleanNewsTitle,
  getArticleHeadlineText,
  isMostlyTamil,
} from "@/lib/news-text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TranslateArticleInput {
  id?: string;
  title?: string;
  headline?: string;
  summary?: string;
  tamilSummary?: string;
  content?: string;
}

interface TranslateArticleOutput {
  id: string;
  englishHeadline: string;
  englishSummary: string;
  provider: "google" | "local";
}

interface GoogleTranslateResponse {
  data?: {
    translations?: { translatedText?: string }[];
  };
  error?: {
    message?: string;
  };
}

interface TranslationCacheEntry {
  value: string;
  expiresAt: number;
}

const MAX_ARTICLES = 50;
const MAX_HEADLINE_CHARS = 180;
const MAX_SUMMARY_CHARS = 760;
const MAX_GOOGLE_BATCH_ITEMS = 80;
const MAX_GOOGLE_BATCH_CHARS = 24000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const translationCache = new Map<string, TranslationCacheEntry>();

function getGoogleTranslateApiKey(): string {
  return process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY || "";
}

function cacheKey(text: string): string {
  return `ta:en:${text}`;
}

function getCachedTranslation(text: string): string | null {
  const cached = translationCache.get(cacheKey(text));
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    translationCache.delete(cacheKey(text));
    return null;
  }
  return cached.value;
}

function setCachedTranslation(text: string, value: string): void {
  translationCache.set(cacheKey(text), { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function buildLocalTranslations(articles: TranslateArticleInput[]): TranslateArticleOutput[] {
  return articles.map((article) => {
    const headline = cleanNewsTitle(article.headline || article.title || "");
    const summary = cleanNewsText(article.tamilSummary || article.summary || article.content || headline, {
      maxLength: MAX_SUMMARY_CHARS,
    });
    const source = {
      ...article,
      headline,
      title: cleanNewsTitle(article.title || headline),
      summary,
      tamilSummary: summary,
      content: article.content || summary,
    };

    return {
      id: article.id || "",
      englishHeadline: getArticleHeadlineText(source, "en", MAX_HEADLINE_CHARS),
      englishSummary: buildEnglishSummary(source),
      provider: "local" as const,
    };
  }).filter((article) => article.id);
}

function normalizeGoogleError(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as GoogleTranslateResponse;
    if (parsed.error?.message) return parsed.error.message;
  } catch {}
  return raw || "Google Translate failed";
}

function chunkTextIndexes(indexes: number[], texts: string[]): number[][] {
  const chunks: number[][] = [];
  let current: number[] = [];
  let currentChars = 0;

  for (const index of indexes) {
    const length = texts[index]?.length || 0;
    if (
      current.length > 0 &&
      (current.length >= MAX_GOOGLE_BATCH_ITEMS || currentChars + length > MAX_GOOGLE_BATCH_CHARS)
    ) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(index);
    currentChars += length;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

async function translateTextsWithGoogle(texts: string[], apiKey: string): Promise<string[]> {
  const results = new Array<string>(texts.length);
  const uncachedIndexes: number[] = [];

  texts.forEach((text, index) => {
    const cached = getCachedTranslation(text);
    if (cached) {
      results[index] = cached;
    } else {
      uncachedIndexes.push(index);
    }
  });

  for (const chunk of chunkTextIndexes(uncachedIndexes, texts)) {
    const q = chunk.map((index) => texts[index]);
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        q,
        source: "ta",
        target: "en",
        format: "text",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(normalizeGoogleError(raw));
    }

    const data = JSON.parse(raw) as GoogleTranslateResponse;
    const translations = data.data?.translations || [];
    chunk.forEach((sourceIndex, chunkIndex) => {
      const translated = cleanNewsText(translations[chunkIndex]?.translatedText || texts[sourceIndex], {
        maxLength: Math.max(texts[sourceIndex].length * 2, 240),
      });
      results[sourceIndex] = translated;
      setCachedTranslation(texts[sourceIndex], translated);
    });
  }

  return results.map((result, index) => result || texts[index]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { articles?: TranslateArticleInput[] };
    const articles = Array.isArray(body.articles) ? body.articles.slice(0, MAX_ARTICLES) : [];
    if (articles.length === 0) {
      return NextResponse.json({ articles: [], provider: "google" });
    }

    const apiKey = getGoogleTranslateApiKey();
    if (!apiKey) {
      return NextResponse.json({
        articles: buildLocalTranslations(articles),
        provider: "local",
      });
    }

    const textsToTranslate: string[] = [];
    const slots: { articleIndex: number; field: "englishHeadline" | "englishSummary"; maxLength: number }[] = [];
    const output = articles.map((article) => ({
      id: article.id || "",
      englishHeadline: "",
      englishSummary: "",
      provider: "google" as const,
    }));

    articles.forEach((article, articleIndex) => {
      const headline = cleanNewsTitle(article.headline || article.title || "");
      if (headline) {
        if (isMostlyTamil(headline)) {
          slots.push({ articleIndex, field: "englishHeadline", maxLength: MAX_HEADLINE_CHARS });
          textsToTranslate.push(headline);
        } else {
          output[articleIndex].englishHeadline = headline;
        }
      }

      const summary = cleanNewsText(article.tamilSummary || article.summary || article.content || headline, {
        maxLength: MAX_SUMMARY_CHARS,
      });
      if (summary) {
        if (isMostlyTamil(summary)) {
          slots.push({ articleIndex, field: "englishSummary", maxLength: 520 });
          textsToTranslate.push(summary);
        } else {
          output[articleIndex].englishSummary = summary;
        }
      }
    });

    const translations = textsToTranslate.length > 0
      ? await translateTextsWithGoogle(textsToTranslate, apiKey)
      : [];

    slots.forEach((slot, index) => {
      const translated = slot.field === "englishHeadline"
        ? cleanNewsTitle(translations[index])
        : cleanNewsText(translations[index], { maxLength: slot.maxLength });
      output[slot.articleIndex][slot.field] = translated;
    });

    return NextResponse.json({
      articles: output.filter((article) => article.id),
      provider: "google",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), provider: "local" },
      { status: 502 },
    );
  }
}
