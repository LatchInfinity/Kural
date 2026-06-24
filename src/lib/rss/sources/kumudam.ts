import type { RSSSourceConfig } from "./types";

function kumudamFeed(id: string, name: string, nameTa: string, feedPath: string, category: string): RSSSourceConfig {
  return {
    id,
    name,
    nameTa,
    feedUrl: `https://kumudam.com/rss/${feedPath}`,
    websiteUrl: "https://www.kumudam.com",
    logoUrl: "https://www.kumudam.com/favicon.ico",
    category,
    active: true,
  };
}

export const kumudamFeeds: RSSSourceConfig[] = [
  kumudamFeed("kumudam-latest", "Kumudam Latest", "குமுதம் புதிய செய்திகள்", "latest-posts", "general"),
  kumudamFeed("kumudam-tamilnadu", "Kumudam Tamil Nadu", "குமுதம் தமிழ்நாடு", "category/tamilnadu", "general"),
  kumudamFeed("kumudam-district-news", "Kumudam District News", "குமுதம் மாவட்ட செய்திகள்", "category/district-news", "local"),
  kumudamFeed("kumudam-politics", "Kumudam Politics", "குமுதம் அரசியல்", "category/politics", "politics"),
  kumudamFeed("kumudam-current-affair", "Kumudam Current Affair", "குமுதம் நடப்பு செய்திகள்", "category/current-affair", "general"),
  kumudamFeed("kumudam-crime", "Kumudam Crime", "குமுதம் குற்றம்", "category/crime", "crime"),
  kumudamFeed("kumudam-business", "Kumudam Business", "குமுதம் வணிகம்", "category/Business", "business"),
  kumudamFeed("kumudam-weather", "Kumudam Weather", "குமுதம் வானிலை", "category/weather", "weather"),
  kumudamFeed("kumudam-sports", "Kumudam Sports", "குமுதம் விளையாட்டு", "category/sports", "sports"),
  kumudamFeed("kumudam-health", "Kumudam Health", "குமுதம் ஆரோக்கியம்", "category/health", "health"),
];
