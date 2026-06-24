import type { RSSSourceConfig } from "./types";

export const newsapiSource: RSSSourceConfig = {
  id: "newsapi",
  name: "NewsAPI Tamil API",
  nameTa: "NewsAPI தமிழ் API",
  feedUrl: "",
  websiteUrl: "https://newsapi.org",
  logoUrl: "https://newsapi.org/favicon.ico",
  category: "general",
  active: false,
  apiProvider: "newsapi",
  notes: "Optional free-tier API source. Enable only after setting NEWSAPI_KEY.",
};
