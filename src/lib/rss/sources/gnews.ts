import type { RSSSourceConfig } from "./types";

export const gnews: RSSSourceConfig = {
  id: "gnews",
  name: "GNews Tamil API",
  nameTa: "GNews தமிழ் API",
  feedUrl: "",
  websiteUrl: "https://gnews.io",
  logoUrl: "https://gnews.io/favicon.ico",
  category: "general",
  active: false,
  apiProvider: "gnews",
  notes: "Optional free-tier API source. Enable only after setting GNEWS_API_KEY.",
};
