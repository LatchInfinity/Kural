import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const hinduTamilThisai: RSSSourceConfig = {
  id: "hindu-tamil-thisai",
  name: "Hindu Tamil Thisai",
  nameTa: "இந்து தமிழ் திசை",
  feedUrl: "https://www.hindutamil.in/feed",
  websiteUrl: "https://www.hindutamil.in",
  logoUrl: "https://www.hindutamil.in/favicon.ico",
  category: "general",
  active: true,
  scraper: {
    listUrl: "https://www.hindutamil.in",
    articleItemSelector: "article, .post, .news-card, .story-card, .item, li",
    titleSelector: "h2 a, h3 a, .title a, .entry-title a",
    linkSelector: "h2 a, h3 a, .title a, .entry-title a, a[href*='hindutamil']",
    summarySelector: ".summary, .description, p, .story-content",
    imageSelector: "img, .thumb img, .image img, figure img",
    dateSelector: "time, .date, .published",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.hindutamil.in",
  },
};
