import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const newsToday: RSSSourceConfig = {
  id: "news-today",
  name: "News Today",
  nameTa: "நியூஸ் டுடே",
  feedUrl: "",
  websiteUrl: "https://www.newstodaynet.com",
  logoUrl: "https://www.newstodaynet.com/favicon.ico",
  category: "general",
  active: false,
  notes: "scraper config present but returned 0 articles in verification; site structure may have changed",
  scraper: {
    listUrl: "https://www.newstodaynet.com",
    articleItemSelector: "article, .post, .news-item, .entry, .td-module, li a[href*='newstoday']",
    titleSelector: "h2 a, h3 a, .entry-title a, .td-module-title a, .post-title a",
    linkSelector: "h2 a, h3 a, .entry-title a, .td-module-title a, a[href*='/']",
    summarySelector: ".entry-summary, .td-excerpt, .post-excerpt, p",
    imageSelector: "img, .td-module-thumb img, .wp-post-image",
    dateSelector: "time, .entry-date, .td-module-date, .post-date, .date",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.newstodaynet.com",
  },
};
