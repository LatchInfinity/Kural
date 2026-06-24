import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const dinamani: RSSSourceConfig = {
  id: "dinamani",
  name: "Dinamani",
  nameTa: "தினமணி",
  feedUrl: "https://www.dinamani.com/rss",
  websiteUrl: "https://www.dinamani.com",
  logoUrl: "https://www.dinamani.com/favicon.ico",
  category: "general",
  active: true,
  scraper: {
    listUrl: "https://www.dinamani.com/tamilnadu",
    articleItemSelector: "article, .story-card, .news-card, .item, li",
    titleSelector: "h2 a, h3 a, .title a, a.story",
    linkSelector: "h2 a, h3 a, .title a, a.story, a[href*='dinamani']",
    summarySelector: ".summary, .description, p, .story-content",
    imageSelector: "img, .thumb img, .image img",
    dateSelector: "time, .date, .published, .time",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.dinamani.com",
  },
};
