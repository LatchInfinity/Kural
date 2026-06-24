import type { RSSSourceConfig } from "../sources/types";
import type { FeedResult } from "../parser";
import { fetchGNews } from "./gnews";
import { fetchNewsAPI } from "./newsapi";
import { fetchMediastack } from "./mediastack";

type ApiFetcher = (source: RSSSourceConfig) => Promise<FeedResult>;

const API_PROVIDERS: Record<string, ApiFetcher> = {
  gnews: fetchGNews,
  newsapi: fetchNewsAPI,
  mediastack: fetchMediastack,
};

export function getApiFetcher(source: RSSSourceConfig): ApiFetcher | null {
  if (!source.apiProvider) return null;
  return API_PROVIDERS[source.apiProvider] || null;
}
