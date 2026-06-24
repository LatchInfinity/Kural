import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const dinakaran: RSSSourceConfig = {
  id: "dinakaran",
  name: "Dinakaran",
  nameTa: "தினகரன்",
  feedUrl: "https://www.dinakaran.com/rss_Latest.asp",
  websiteUrl: "https://www.dinakaran.com",
  logoUrl: "https://www.dinakaran.com/favicon.ico",
  category: "general",
  active: true,
  scraper: {
    listUrl: "https://www.dinakaran.com",
    articleItemSelector: "article, .post, .news-item, .entry, .listing-item, li",
    titleSelector: "h2 a, h3 a, .entry-title a, .post-title a",
    linkSelector: "h2 a, h3 a, .entry-title a, .post-title a, a[href*='dinakaran']",
    summarySelector: ".entry-summary, .post-excerpt, p",
    imageSelector: "img, .wp-post-image, .attachment-post-thumbnail",
    dateSelector: "time, .entry-date, .post-date, .date",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.dinakaran.com",
  },
};
