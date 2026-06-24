import type { RSSSourceConfig } from "../sources/types";
import type { FeedResult, ParsedArticle } from "../parser";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

interface MediastackArticle {
  title: string;
  description: string;
  url: string;
  image: string;
  published_at: string;
  source: string;
}

interface MediastackResponse {
  data: MediastackArticle[];
}

export async function fetchMediastack(source: RSSSourceConfig): Promise<FeedResult> {
  const apiKey = process.env.MEDIASTACK_KEY;
  if (!apiKey) {
    return { source, articles: [], error: "MEDIASTACK_KEY not configured" };
  }

  try {
    const res = await fetch(
      `https://api.mediastack.com/v1/news?access_key=${apiKey}&keywords=tamil,nadu&languages=ta&limit=10&countries=in`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) {
      return { source, articles: [], error: `Mediastack API error: ${res.status}` };
    }

    const data = (await res.json()) as MediastackResponse;
    const articles: ParsedArticle[] = (data.data || []).map((a) => ({
      title: a.title || "",
      summary: a.description || "",
      content: a.description || "",
      link: a.url || "",
      pubDate: a.published_at || new Date().toISOString(),
      imageUrl: a.image || "",
      categories: [],
    }));

    return { source, articles, error: null };
  } catch (err: unknown) {
    return { source, articles: [], error: errorMessage(err, "Mediastack fetch failed") };
  }
}
