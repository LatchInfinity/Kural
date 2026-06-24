import type { RSSSourceConfig } from "./types";

function googleNewsSearch(id: string, name: string, nameTa: string, query: string, category: string): RSSSourceConfig {
  const encoded = encodeURIComponent(`${query} when:2d`);
  return {
    id,
    name,
    nameTa,
    feedUrl: `https://news.google.com/rss/search?q=${encoded}&hl=ta&gl=IN&ceid=IN:ta`,
    websiteUrl: "https://news.google.com/home?ceid=IN:ta&hl=ta",
    logoUrl: "https://news.google.com/favicon.ico",
    category,
    active: true,
    notes: "Free Google News RSS search feed; useful as a coverage backfill when publisher RSS feeds are unavailable.",
  };
}

export const googleNewsTamilFeeds: RSSSourceConfig[] = [
  googleNewsSearch("google-news-tamil-nadu", "Google News Tamil Nadu", "கூகுள் செய்திகள் தமிழ்நாடு", "Tamil Nadu தமிழ்நாடு", "general"),
  googleNewsSearch("google-news-chennai", "Google News Chennai", "கூகுள் செய்திகள் சென்னை", "Chennai சென்னை Tamil Nadu", "local"),
  googleNewsSearch("google-news-tamil-nadu-politics", "Google News Tamil Nadu Politics", "கூகுள் அரசியல் செய்திகள்", "Tamil Nadu politics தமிழக அரசியல்", "politics"),
  googleNewsSearch("google-news-tamil-nadu-government", "Google News Tamil Nadu Government", "கூகுள் அரசு செய்திகள்", "Tamil Nadu government தமிழக அரசு", "government"),
  googleNewsSearch("google-news-tamil-nadu-education", "Google News Tamil Nadu Education", "கூகுள் கல்வி செய்திகள்", "Tamil Nadu education பள்ளி கல்லூரி", "education"),
  googleNewsSearch("google-news-tamil-nadu-business", "Google News Tamil Nadu Business", "கூகுள் வணிக செய்திகள்", "Tamil Nadu business economy தங்கம் விலை", "business"),
  googleNewsSearch("google-news-tamil-nadu-weather", "Google News Tamil Nadu Weather", "கூகுள் வானிலை செய்திகள்", "Tamil Nadu weather rain வானிலை மழை", "weather"),
  googleNewsSearch("google-news-tamil-nadu-crime", "Google News Tamil Nadu Crime", "கூகுள் குற்ற செய்திகள்", "Tamil Nadu crime police court", "crime"),
  googleNewsSearch("google-news-tamil-nadu-transport", "Google News Tamil Nadu Transport", "கூகுள் போக்குவரத்து செய்திகள்", "Tamil Nadu transport railway bus metro", "transport"),
  googleNewsSearch("google-news-tamil-nadu-agriculture", "Google News Tamil Nadu Agriculture", "கூகுள் வேளாண்மை செய்திகள்", "Tamil Nadu agriculture farmers விவசாயம்", "agriculture"),
  googleNewsSearch("google-news-tamil-sports", "Google News Tamil Sports", "கூகுள் விளையாட்டு செய்திகள்", "Tamil sports cricket தமிழ்நாடு", "sports"),
];
