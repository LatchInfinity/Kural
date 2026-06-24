import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const thanthiTv: RSSSourceConfig = {
  id: "thanthi-tv",
  name: "Thanthi TV",
  nameTa: "தந்தி டிவி",
  feedUrl: "https://www.thanthitv.com/feed",
  websiteUrl: "https://www.thanthitv.com",
  logoUrl: "https://www.thanthitv.com/favicon.ico",
  category: "general",
  active: true,
  scraper: {
    listUrl: "https://www.thanthitv.com",
    articleItemSelector: "article, .post, .news-card, .story, .item, li",
    titleSelector: "h2 a, h3 a, .title a, .headline a",
    linkSelector: "h2 a, h3 a, .title a, .headline a, a[href*='thanthitv']",
    summarySelector: ".summary, .description, p",
    imageSelector: "img, .thumb img, .image img, figure img",
    dateSelector: "time, .date, .published",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.thanthitv.com",
  },
};
