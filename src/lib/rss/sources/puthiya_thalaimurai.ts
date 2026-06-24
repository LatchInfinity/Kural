import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const puthiyaThalaimurai: RSSSourceConfig = {
  id: "puthiya-thalaimurai",
  name: "Puthiya Thalaimurai",
  nameTa: "புதிய தலைமுறை",
  feedUrl: "https://www.puthiyathalaimurai.com/rss",
  websiteUrl: "https://www.puthiyathalaimurai.com",
  logoUrl: "https://www.puthiyathalaimurai.com/favicon.ico",
  category: "general",
  active: true,
  scraper: {
    listUrl: "https://www.puthiyathalaimurai.com",
    articleItemSelector: "article, .post, .news-card, .story, .item, li",
    titleSelector: "h2 a, h3 a, .title a, .headline a, .entry-title a",
    linkSelector: "h2 a, h3 a, .title a, .headline a, .entry-title a, a[href*='puthiyathalaimurai']",
    summarySelector: ".summary, .description, p, .story-content",
    imageSelector: "img, .thumb img, .image img, figure img",
    dateSelector: "time, .date, .published",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.puthiyathalaimurai.com",
  },
};
