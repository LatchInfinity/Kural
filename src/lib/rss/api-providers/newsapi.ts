import type { RSSSourceConfig } from "../sources/types";
import type { FeedResult, ParsedArticle } from "../parser";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

interface NewsAPIArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string; id: string | null };
}

interface NewsAPIResponse {
  articles: NewsAPIArticle[];
  status: string;
  totalResults: number;
}

export async function fetchNewsAPI(source: RSSSourceConfig): Promise<FeedResult> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    return { source, articles: [], error: "NEWSAPI_KEY not configured" };
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=tamil+nadu&language=ta&pageSize=10&apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) {
      return { source, articles: [], error: `NewsAPI error: ${res.status}` };
    }

    const data = (await res.json()) as NewsAPIResponse;
    if (data.status === "error") {
      return { source, articles: [], error: "NewsAPI returned error" };
    }

    const articles: ParsedArticle[] = (data.articles || []).map((a) => ({
      title: a.title || "",
      summary: a.description || "",
      content: a.content || a.description || "",
      link: a.url || "",
      pubDate: a.publishedAt || new Date().toISOString(),
      imageUrl: a.urlToImage || "",
      categories: [],
    }));

    return { source, articles, error: null };
  } catch (err: unknown) {
    return { source, articles: [], error: errorMessage(err, "NewsAPI fetch failed") };
  }
}
