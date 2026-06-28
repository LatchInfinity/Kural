import rawNews from "@/data/news.json";
import type { NewsCategory, NewsItem, TimePeriod } from "@/types";
import { filterTamilNadu } from "@/lib/rss/tn-filter";
import { TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";

const TN_CATEGORY_FALLBACK = [...TAMIL_NADU_NEWS_CATEGORIES] satisfies NewsCategory[];

function buildSummary(text: string): string {
  return text.split("\n\n")[0].replace(/\n/g, " ").trim();
}

function classifyArticle(headline: string, summary: string): NewsCategory {
  const normalizeText = (value: string): string =>
    value.toLowerCase().replace(/[^\w\s\u0B80-\u0BFF]/g, " ").replace(/\s+/g, " ").trim();
  const textHas = (text: string, terms: string[]): boolean =>
    terms.some((term) => {
      const normalizedTerm = normalizeText(term);
      if (!normalizedTerm) return false;
      if (/^[a-z0-9 ]+$/.test(normalizedTerm)) {
        return new RegExp(`(^|\\s)${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s)`).test(text);
      }
      return text.includes(normalizedTerm);
    });
  const fallbackToCategory = (category: NewsCategory): NewsCategory =>
    TN_CATEGORY_FALLBACK.find((fallbackCategory) => fallbackCategory === category) ?? "தமிழ்நாடு உள்ளூர்";

  const POLITICAL_TERMS = ["assembly", "legislative", "minister", "chief minister", "MLA", "MLC", "சட்டப்பேரவை", "சட்டசபை", "அமைச்சர்", "முதலமைச்சர்", "அரசியல்", "தேர்தல்", "election", "vote", "party", "கட்சி", "ஆளுநர்", "governor"];
  const GOVERNMENT_TERMS = ["government", "scheme", "policy", "budget", "tender", "பட்ஜெட்", "திட்டம்", "ஒப்பந்தம்", "அரசு அறிவிப்பு", "அரசு திட்டம்", "ரூபாய்", "crore", "crores", "lakh", "lakhs", "மானியம்", "subsidy", "welfare"];
  const CRIME_TERMS = ["crime", "arrest", "murder", "theft", "court", "police", "FIR", "குற்றம்", "கைது", "கொலை", "திருட்டு", "நீதிமன்ற", "வழக்கு", "காவல் நிலையம்", "சிறை", "jail", "prison", "fraud", "scam", "cheating", "cyber", "மோசடி", "சைபர்"];
  const ACCIDENT_TERMS = ["accident", "crash", "collision", "fire", "explosion", "gas leak", "ammonia", "factory accident", "injured", "hospitalized", "விபத்து", "மோதல்", "தீ விபத்து", "வெடிப்பு", "வாயு கசிவு", "காயம்", "மருத்துவமனை"];
  const TRANSPORT_TERMS = ["train", "metro", "bus", "railway", "airport", "road", "traffic", "transport", "flight", "போக்குவரத்து", "ரயில்", "மெட்ரோ", "பேருந்து", "விமானம்", "சாலை", "விமான நிலையம்", "track", "platform", "சுங்கச்சாவடி"];
  const SPORTS_TERMS = ["cricket", "football", "kabaddi", "match", "tournament", "player", "score", " Stadium", "IPL", "விளையாட்டு", "கிரிக்கெட்", "கபடி", "போட்டி", "வீரர்", "சாம்பியன்", "Olympic", "Olympics", "தகரம்"];
  const EDUCATION_TERMS = ["school", "college", "university", "exam", "student", "teacher", "results", "admission", "graduation", "கல்வி", "பள்ளி", "கல்லூரி", "பல்கலைக்கழகம்", "தேர்வு", "மாணவர்", "ஆசிரியர்", "மதிப்பெண்", "தரவரிசை"];
  const TECHNOLOGY_TERMS = ["technology", "tech", "AI", "robot", "startup", "software", "digital", "cyber", "app", "இணைய", "தொழில்நுட்பம்", "செயற்கை", "அறிவியல்", "டிஜிட்டல்", "ஸ்டார்ட்அப்", "மென்பொருள்", "ஹேக்", "hack"];
  const BUSINESS_TERMS = ["business", "market", "economy", "stock", "share", "investment", "trade", "GST", "price", "gold", "oil", "petrol", "diesel", "inflation", "வணிகம்", "சந்தை", "முதலீடு", "தொழில்", "விலை", "தங்கம்", "பங்கு", "சரக்கு", "ஏற்றுமதி"];
  const WEATHER_TERMS = ["rain", "heavy rain", "storm", "cyclone", "flood", "weather", "cloud", "thunderstorm", "heat wave", "மழை", "வானிலை", "புயல்", "வெள்ளம்", "மேகம்", "இடி மின்னல்", "வெப்ப அலை", "சூறாவளி"];
  const AGRICULTURE_TERMS = ["farm", "crop", "harvest", "paddy", "rice", "agriculture", "farmer", "irrigation", "field", "வேளாண்மை", "விவசாயி", "விவசாயம்", "நெல்", "பயிர்", "அறுவடை", "குளிர்சாதனம்"];
  const haystack = normalizeText(`${headline} ${summary}`);
  const categoryRules: { category: NewsCategory; terms: string[] }[] = [
    { category: "தமிழ்நாடு குற்றம்", terms: CRIME_TERMS },
    { category: "தமிழ்நாடு விபத்து", terms: ACCIDENT_TERMS },
    { category: "தமிழ்நாடு விளையாட்டு", terms: SPORTS_TERMS },
    { category: "தமிழ்நாடு வானிலை", terms: WEATHER_TERMS },
    { category: "தமிழ்நாடு போக்குவரத்து", terms: TRANSPORT_TERMS },
    { category: "தமிழ்நாடு வேளாண்மை", terms: AGRICULTURE_TERMS },
    { category: "தமிழ்நாடு கல்வி", terms: EDUCATION_TERMS },
    { category: "தமிழ்நாடு வணிகம்", terms: BUSINESS_TERMS },
    { category: "தமிழ்நாடு அரசியல்", terms: POLITICAL_TERMS },
    { category: "தமிழ்நாடு அரசு", terms: GOVERNMENT_TERMS },
    { category: "தமிழ்நாடு தொழில்நுட்பம்", terms: TECHNOLOGY_TERMS },
  ];

  return fallbackToCategory(categoryRules.find((rule) => textHas(haystack, rule.terms))?.category ?? "தமிழ்நாடு உள்ளூர்");
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
  category: classifyArticle(item.title, item.tamilSummary),
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
