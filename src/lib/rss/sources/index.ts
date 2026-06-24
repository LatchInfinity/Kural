import { dailyThanthi } from "./thanthi";
import { dinamalar } from "./dinamalar";
import { dinakaran } from "./dinakaran";
import { hinduTamilThisai } from "./hindu_tamil";
import { maalaiMalar } from "./maalaimalar";
import { malaiMurasu } from "./malai_murasu";
import { makkalKural } from "./makkal_kural";
import { newsToday } from "./news_today";
import { news18Tamil, news18TamilNadu } from "./news18";
import { oneIndiaTamil, oneIndiaTamilFeeds } from "./oneindia";
import { bbcTamil } from "./bbc_tamil";
import { vikatan } from "./vikatan";
import { puthiyaThalaimurai } from "./puthiya_thalaimurai";
import { thanthiTv } from "./thanthitv";
import { polimerNews } from "./polimer";
import { dinamani } from "./dinamani";
import { kamadenu } from "./kamadenu";
import { tamilMurasu } from "./tamil_murasu";
import { news24x7Tamil } from "./news24x7";
import { kumudamFeeds } from "./kumudam";
import { googleNewsTamilFeeds } from "./google_news";
import { gnews } from "./gnews";
import { newsapiSource } from "./newsapi";
import { mediastack } from "./mediastack";
import type { RSSSourceConfig } from "./types";

export type { RSSSourceConfig, ScraperConfig } from "./types";

export const RSS_SOURCES: RSSSourceConfig[] = [
  dailyThanthi,
  dinamalar,
  dinakaran,
  hinduTamilThisai,
  maalaiMalar,
  malaiMurasu,
  makkalKural,
  newsToday,
  news18Tamil,
  news18TamilNadu,
  oneIndiaTamil,
  ...oneIndiaTamilFeeds,
  bbcTamil,
  vikatan,
  puthiyaThalaimurai,
  thanthiTv,
  polimerNews,
  dinamani,
  ...kumudamFeeds,
  ...googleNewsTamilFeeds,
  news24x7Tamil,
  kamadenu,
  tamilMurasu,
  gnews,
  newsapiSource,
  mediastack,
];

export const ACTIVE_RSS_SOURCES = RSS_SOURCES.filter((source) => source.active);
