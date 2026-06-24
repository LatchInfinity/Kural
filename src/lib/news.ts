import rawNews from "@/data/news.json";
import type { NewsCategory, NewsItem, TimePeriod } from "@/types";
import { filterTamilNadu } from "@/lib/rss/tn-filter";
import { TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";

const TN_CATEGORY_FALLBACK = [...TAMIL_NADU_NEWS_CATEGORIES] satisfies NewsCategory[];

function buildSummary(text: string): string {
  return text.split("\n\n")[0].replace(/\n/g, " ").trim();
}

interface RawNewsItem {
  id: string;
  title: string;
  tamilSummary: string;
  englishSummary: string;
  source: string;
  sourceUrl: string;
  image: string;
  category?: string;
  publishedTime: string;
}

const rawNewsItems = (rawNews as RawNewsItem[]).filter((item) => filterTamilNadu({
  title: item.title,
  summary: item.tamilSummary,
  content: `${item.englishSummary} ${item.category || ""}`,
  source: item.source,
}).relevant);

const durations = ["1:24", "0:58", "1:45", "2:10", "1:30", "1:15", "2:05", "1:50", "1:35", "1:40", "2:15", "1:55", "1:20", "1:48", "2:00", "1:38", "2:30", "1:52", "1:28", "2:20", "1:42", "1:58", "2:08", "1:33", "2:12"];
const fallbackNow = Date.now();

export const newsData: NewsItem[] = rawNewsItems.map((item, index) => ({
  ...item,
  headline: item.title,
  imageUrl: item.image,
  publishedAt: new Date(fallbackNow - index * 45 * 60 * 1000).toISOString(),
  publishedHour: new Date(fallbackNow - index * 45 * 60 * 1000).getHours(),
  summary: buildSummary(item.tamilSummary),
  content: item.tamilSummary,
  category: TN_CATEGORY_FALLBACK[index % TN_CATEGORY_FALLBACK.length],
  audioDuration: durations[index] || "1:30",
  isBreaking: index < 3,
  trending: index < 5,
  retention: index < 3 ? "breaking" : index < 16 ? "latest" : "recent",
}));

export const breakingNews = newsData.filter((n) => n.isBreaking);

export function getTimePeriod(hour: number): Exclude<TimePeriod, "all"> {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 20) return "evening";
  return "night";
}

export function getCurrentTimePeriod(): Exclude<TimePeriod, "all"> {
  return getTimePeriod(new Date().getHours());
}

export function getTimePeriodLabelTa(period: TimePeriod): string {
  switch (period) {
    case "all": return "அனைத்து செய்திகள்";
    case "morning": return "காலை";
    case "afternoon": return "மதியம்";
    case "evening": return "மாலை";
    case "night": return "இரவு";
  }
}

export function filterNewsByTimePeriod(items: NewsItem[], period: TimePeriod): NewsItem[] {
  if (period === "all") return items;
  return items.filter((item) => getTimePeriod(item.publishedHour) === period);
}
