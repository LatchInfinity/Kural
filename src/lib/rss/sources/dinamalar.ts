import type { RSSSourceConfig } from "./types";
import { parseRelativeDate } from "./helpers";

export const dinamalar: RSSSourceConfig = {
  id: "dinamalar",
  name: "Dinamalar",
  nameTa: "தினமலர்",
  feedUrl: "https://feeds.feedburner.com/dinamalar/Front_page_news",
  websiteUrl: "https://www.dinamalar.com",
  logoUrl: "https://www.dinamalar.com/favicon.ico",
  category: "general",
  active: true,
  scraper: {
    listUrl: "https://www.dinamalar.com",
    articleItemSelector: "article, .news-card, .LHS_News_Details, .news_item, .s4, li",
    titleSelector: "h2 a, h3 a, .title a, .headline a",
    linkSelector: "h2 a, h3 a, .title a, .headline a, a[href*='dinamalar']",
    summarySelector: ".summary, .description, p, .content",
    imageSelector: "img, .thumb img, .image img, .news-img img",
    dateSelector: "time, .date, .published, .time",
    dateParse: parseRelativeDate,
    linkPrefix: "https://www.dinamalar.com",
  },
};
