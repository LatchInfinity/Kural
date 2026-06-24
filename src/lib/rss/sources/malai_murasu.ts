import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const malaiMurasu: RSSSourceConfig = {
  id: "malai-murasu",
  name: "Malai Murasu",
  nameTa: "மாலை முரசு",
  feedUrl: "",
  websiteUrl: "https://www.malaimurasu.com",
  logoUrl: "https://www.malaimurasu.com/favicon.ico",
  category: "general",
  active: false,
  notes: "scraper config present but returned 0 articles in verification; needs selector update",
  scraper: {
    listUrl: "https://www.malaimurasu.com",
    articleItemSelector: "article, .post, .news-item, .entry, li a[href*='malaimurasu']",
    titleSelector: "h2 a, h3 a, .entry-title a, .post-title a",
    linkSelector: "h2 a, h3 a, .entry-title a, .post-title a, a[href*='/']",
    summarySelector: ".entry-summary, .post-excerpt, p",
    imageSelector: "img, .wp-post-image, .attachment-post-thumbnail",
    dateSelector: "time, .entry-date, .post-date, .date",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.malaimurasu.com",
  },
};
