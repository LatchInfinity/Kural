import type { RSSSourceConfig } from "../sources/types";
import type { FeedResult, ParsedArticle } from "../parser";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
}

interface GNewsResponse {
  articles: GNewsArticle[];
}

export async function fetchGNews(source: RSSSourceConfig): Promise<FeedResult> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return { source, articles: [], error: "GNEWS_API_KEY not configured" };
  }

  try {
    const res = await fetch(
      `https://gnews.io/api/v4/search?q=tamil+nadu&lang=ta&country=in&max=10&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) {
      return { source, articles: [], error: `GNews API error: ${res.status}` };
    }

    const data = (await res.json()) as GNewsResponse;
    const articles: ParsedArticle[] = (data.articles || []).map((a) => ({
      title: a.title || "",
      summary: a.description || "",
      content: a.content || a.description || "",
      link: a.url || "",
      pubDate: a.publishedAt || new Date().toISOString(),
      imageUrl: a.image || "",
      categories: [],
    }));

    return { source, articles, error: null };
  } catch (err: unknown) {
    return { source, articles: [], error: errorMessage(err, "GNews fetch failed") };
  }
}
