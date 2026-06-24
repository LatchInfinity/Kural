import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const vikatan: RSSSourceConfig = {
  id: "vikatan",
  name: "Vikatan",
  nameTa: "விகடன்",
  feedUrl: "https://www.vikatan.com/rss/",
  websiteUrl: "https://www.vikatan.com",
  logoUrl: "https://www.vikatan.com/favicon.ico",
  category: "general",
  active: true,
  scraper: {
    listUrl: "https://www.vikatan.com",
    articleItemSelector: "article, .post, .story-card, .news-card, .card, li",
    titleSelector: "h2 a, h3 a, .title a, .card-title a",
    linkSelector: "h2 a, h3 a, .title a, .card-title a, a[href*='vikatan']",
    summarySelector: ".summary, .description, p, .card-text",
    imageSelector: "img, .card-img img, figure img, .thumb img",
    dateSelector: "time, .date, .published",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.vikatan.com",
  },
};
