import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const makkalKural: RSSSourceConfig = {
  id: "makkal-kural",
  name: "Makkal Kural",
  nameTa: "மக்கள் குரல்",
  feedUrl: "",
  websiteUrl: "https://makkalkural.net",
  logoUrl: "https://makkalkural.net/favicon.ico",
  category: "general",
  active: false,
  notes: "scraper config present but returned 0 articles in verification; site may have anti-scraping measures",
  scraper: {
    listUrl: "https://makkalkural.net",
    articleItemSelector: "article, .post, .news-item, .entry, li a[href*='makkalkural']",
    titleSelector: "h2 a, h3 a, .entry-title a, .post-title a",
    linkSelector: "h2 a, h3 a, .entry-title a, .post-title a, a[href*='/']",
    summarySelector: ".entry-summary, .post-excerpt, p",
    imageSelector: "img, .wp-post-image, .attachment-post-thumbnail",
    dateSelector: "time, .entry-date, .post-date, .date",
    dateParse: parseRelativeDate,
    linkPrefix: "https://makkalkural.net",
  },
};
