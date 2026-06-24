import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const maalaiMalar: RSSSourceConfig = {
  id: "maalai-malar",
  name: "Maalai Malar",
  nameTa: "மாலை மலர்",
  feedUrl: "https://www.maalaimalar.com/feed",
  websiteUrl: "https://www.maalaimalar.com",
  logoUrl: "https://www.maalaimalar.com/favicon.ico",
  category: "general",
  active: true,
  scraper: {
    listUrl: "https://www.maalaimalar.com",
    articleItemSelector: "article, .post, .news-item, .entry, .story, li",
    titleSelector: "h2 a, h3 a, .entry-title a, .post-title a, .title a",
    linkSelector: "h2 a, h3 a, .entry-title a, .post-title a, .title a, a[href*='maalaimalar']",
    summarySelector: ".entry-summary, .post-excerpt, p, .summary",
    imageSelector: "img, .wp-post-image, .attachment-post-thumbnail, .thumb img",
    dateSelector: "time, .entry-date, .post-date, .date",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.maalaimalar.com",
  },
};
