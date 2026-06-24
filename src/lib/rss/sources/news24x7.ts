import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const news24x7Tamil: RSSSourceConfig = {
  id: "news24x7-tamil",
  name: "News 24x7 Tamil",
  nameTa: "News 24x7 தமிழ்",
  feedUrl: "",
  websiteUrl: "https://news24tamil.com",
  logoUrl: "https://news24tamil.com/favicon.ico",
  category: "general",
  active: true,
  scraper: {
    listUrl: "https://news24tamil.com",
    articleItemSelector: "article, .post, .news-card, .story, .item, li",
    titleSelector: "h2 a, h3 a, .title a, .entry-title a",
    linkSelector: "h2 a, h3 a, .title a, .entry-title a, a[href*='news24tamil']",
    summarySelector: ".summary, .description, p",
    imageSelector: "img, .wp-post-image, .thumb img",
    dateSelector: "time, .entry-date, .post-date, .date",
    dateParse: parseRelativeDate,
    linkPrefix: "https://news24tamil.com",
  },
};
