import type { RSSSourceConfig } from "./types";

export const mediastack: RSSSourceConfig = {
  id: "mediastack",
  name: "Mediastack Tamil API",
  nameTa: "Mediastack தமிழ் API",
  feedUrl: "",
  websiteUrl: "https://mediastack.com",
  logoUrl: "https://mediastack.com/favicon.ico",
  category: "general",
  active: false,
  apiProvider: "mediastack",
  notes: "Optional free-tier API source. Enable only after setting MEDIASTACK_KEY.",
};
