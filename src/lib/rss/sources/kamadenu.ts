import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const kamadenu: RSSSourceConfig = {
  id: "kamadenu",
  name: "Kamadenu",
  nameTa: "காமதேனு",
  feedUrl: "",
  websiteUrl: "https://www.kamadenu.in",
  logoUrl: "https://www.kamadenu.in/favicon.ico",
  category: "general",
  active: false,
  notes: "domain appears to be parked/resolved to placeholder; scraper returned junk articles",
  scraper: {
    listUrl: "https://www.kamadenu.in/news/tamil-nadu",
    articleItemSelector: "article, .post, .news-item, .entry, li",
    titleSelector: "h2 a, h3 a, .entry-title a, .post-title a",
    linkSelector: "h2 a, h3 a, .entry-title a, .post-title a",
    summarySelector: ".entry-summary, .post-excerpt, p",
    imageSelector: "img, .wp-post-image, .attachment-post-thumbnail",
    dateSelector: "time, .entry-date, .post-date",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.kamadenu.in",
  },
};
