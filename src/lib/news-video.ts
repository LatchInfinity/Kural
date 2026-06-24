import type Database from "better-sqlite3";
import {
  VIDEO_DURATION_SECONDS,
  VIDEO_ENABLED,
  VIDEO_RESOLUTION,
  VIDEO_STORAGE,
  VIDEO_STYLE,
} from "@/lib/news-config";

export type VideoStatus = "pending" | "generating" | "completed" | "failed" | "disabled";

export type NewsVideoScene =
  | "accident"
  | "animal-death"
  | "assembly"
  | "business"
  | "crime"
  | "district"
  | "education"
  | "fraud"
  | "human-death"
  | "industrial-accident"
  | "police-chase"
  | "sports"
  | "technology"
  | "transport"
  | "weather";

interface ArticleVideoInput {
  id: string;
  title?: string | null;
  headline?: string | null;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  district?: string | null;
  keywords?: string[] | string | null;
  thumbnailUrl?: string | null;
}

interface VideoAsset {
  scene: NewsVideoScene;
  url: string;
  label: string;
  categories?: string[];
  keywords: string[];
  priority: number;
  requiresKeyword?: boolean;
  forcedOnly?: boolean;
}

export interface ArticleVideoAssignment {
  aiVideoUrl: string;
  videoStatus: VideoStatus;
  videoPrompt: string;
  videoGeneratedAt: string;
  videoDuration: number;
  videoThumbnail: string;
  videoScene: NewsVideoScene;
}

const VIDEO_ASSETS: VideoAsset[] = [
  {
    scene: "industrial-accident",
    url: "",
    label: "industrial accident and factory emergency response",
    categories: ["தமிழ்நாடு விபத்து"],
    priority: 140,
    requiresKeyword: true,
    forcedOnly: true,
    keywords: [
      "factory accident", "factory", "plant accident", "industrial accident", "chemical leak",
      "gas leak", "ammonia leak", "boiler blast", "தொழிற்சாலை", "தொழிற்சாலை விபத்து",
      "வாயு கசிவு", "அமோனியா", "ரசாயன கசிவு", "வெடிப்பு", "தீ விபத்து",
    ],
  },
  {
    scene: "accident",
    url: "/generated-videos/accident/accident.mp4",
    label: "fatal accident report",
    categories: ["தமிழ்நாடு விபத்து", "தமிழ்நாடு போக்குவரத்து"],
    priority: 135,
    requiresKeyword: true,
    forcedOnly: true,
    keywords: ["accident", "crash", "collision", "mishap", "fatal", "death", "killed", "விபத்து", "மோதல்", "மோதி", "மோதியதில்", "கவிழ்ந்து", "உயிரிழப்பு", "உயிரிழந்த", "பலி"],
  },
  {
    scene: "animal-death",
    url: "/generated-videos/animal/animal-death.mp4",
    label: "animal death incident",
    categories: ["தமிழ்நாடு உள்ளூர்", "தமிழ்நாடு வேளாண்மை"],
    priority: 132,
    requiresKeyword: true,
    forcedOnly: true,
    keywords: ["animal", "elephant", "cattle", "cow", "dog", "goat", "deer", "tiger", "leopard", "விலங்கு", "யானை", "மாடு", "நாய்", "ஆடு பலி", "மான்", "புலி", "சிறுத்தை", "உயிரிழப்பு", "பலி"],
  },
  {
    scene: "human-death",
    url: "/generated-videos/human/human-death.mp4",
    label: "human death and public grief",
    categories: ["தமிழ்நாடு விபத்து", "தமிழ்நாடு குற்றம்", "தமிழ்நாடு உள்ளூர்"],
    priority: 130,
    requiresKeyword: true,
    forcedOnly: true,
    keywords: ["death", "death toll", "dead", "died", "dies", "killed", "fatal", "body", "உயிரிழப்பு", "உயிரிழந்த", "உயிரிழந்தார்", "உயிரிழந்தனர்", "பலி", "பலியான", "பலி எண்ணிக்கை", "மரணம்", "இறப்பு", "சடலம்", "பிணம்"],
  },
  {
    scene: "police-chase",
    url: "/generated-videos/crime/police-chase.mp4",
    label: "police chase",
    categories: ["தமிழ்நாடு குற்றம்"],
    priority: 120,
    requiresKeyword: true,
    keywords: ["chase", "chasing", "pursuit", "vehicle chase", "car chase", "police jeep", "துரத்த", "துரத்தல்", "விரட்ட", "ஜீப்"],
  },
  {
    scene: "fraud",
    url: "/generated-videos/fraud/fraud.mp4",
    label: "fraud investigation",
    categories: ["தமிழ்நாடு குற்றம்", "தமிழ்நாடு வணிகம்"],
    priority: 115,
    requiresKeyword: true,
    keywords: ["fraud", "scam", "cheating", "cyber crime", "cyber fraud", "money laundering", "மோசடி", "ஏமாற்ற", "சைபர்", "பணம் பறிப்பு"],
  },
  {
    scene: "assembly",
    url: "/generated-videos/politics/assembly.mp4",
    label: "Tamil Nadu assembly session",
    categories: ["தமிழ்நாடு அரசியல்", "தமிழ்நாடு அரசு"],
    priority: 110,
    keywords: ["assembly", "legislative", "session", "minister", "chief minister", "சட்டப்பேரவை", "சட்டசபை", "அமைச்சர்", "முதலமைச்சர்", "அரசு கூட்டம்"],
  },
  {
    scene: "weather",
    url: "/generated-videos/weather/weather.mp4",
    label: "weather alert",
    categories: ["தமிழ்நாடு வானிலை"],
    priority: 100,
    keywords: ["weather", "rain", "heavy rain", "storm", "cyclone", "flood", "cloud", "மழை", "வானிலை", "புயல்", "வெள்ள", "மேகம்"],
  },
  {
    scene: "transport",
    url: "/generated-videos/transport/transport.mp4",
    label: "transport update",
    categories: ["தமிழ்நாடு போக்குவரத்து"],
    priority: 95,
    keywords: ["transport", "traffic", "train", "metro", "bus", "road", "airport", "rail", "போக்குவரத்து", "ரயில்", "மெட்ரோ", "பேருந்து", "சாலை", "விமான"],
  },
  {
    scene: "sports",
    url: "/generated-videos/sports/sports.mp4",
    label: "Tamil Nadu sports update",
    categories: ["தமிழ்நாடு விளையாட்டு"],
    priority: 94,
    keywords: ["sports", "cricket", "kabaddi", "football", "match", "athlete", "player", "விளையாட்டு", "கிரிக்கெட்", "கபடி", "கால்பந்து", "போட்டி", "விளையாட்டு வீரர்"],
  },
  {
    scene: "education",
    url: "/generated-videos/education/education.mp4",
    label: "education update",
    categories: ["தமிழ்நாடு கல்வி"],
    priority: 90,
    keywords: ["education", "school", "college", "university", "exam", "student", "teacher", "கல்வி", "பள்ளி", "கல்லூரி", "பல்கலை", "தேர்வு", "மாணவர்", "ஆசிரியர்"],
  },
  {
    scene: "technology",
    url: "/generated-videos/technology/technology.mp4",
    label: "technology update",
    categories: ["தமிழ்நாடு தொழில்நுட்பம்"],
    priority: 88,
    keywords: ["technology", "tech", "ai", "robot", "startup", "software", "science", "digital", "தொழில்நுட்பம்", "செயற்கை", "அறிவியல்", "டிஜிட்டல்", "ஸ்டார்ட்அப்"],
  },
  {
    scene: "business",
    url: "/generated-videos/business/business.mp4",
    label: "business and market update",
    categories: ["தமிழ்நாடு வணிகம்"],
    priority: 86,
    keywords: ["business", "market", "economy", "investment", "industry", "trade", "gst", "price", "வணிகம்", "சந்தை", "முதலீடு", "தொழில்", "விலை", "வர்த்தகம்"],
  },
  {
    scene: "crime",
    url: "/generated-videos/crime/crime.mp4",
    label: "crime report",
    categories: ["தமிழ்நாடு குற்றம்"],
    priority: 84,
    keywords: ["crime", "arrest", "murder", "theft", "court", "criminal case", "குற்றம்", "கைது", "கொலை", "திருட்டு", "நீதிமன்ற", "வழக்கு", "காவல் நிலையம்"],
  },
  {
    scene: "district",
    url: "/generated-videos/district/district-news.mp4",
    label: "Tamil Nadu district update",
    categories: ["தமிழ்நாடு உள்ளூர்", "தமிழ்நாடு வேளாண்மை", "தமிழ்நாடு விளையாட்டு"],
    priority: 40,
    keywords: ["district", "local", "village", "town", "farmers", "match", "உள்ளூர்", "மாவட்ட", "கிராம", "நகர", "வேளாண்மை", "விவசாய", "விளையாட்டு", "போட்டி"],
  },
];

const FATALITY_TERMS = ["death", "death toll", "dead", "died", "dies", "killed", "fatal", "body", "உயிரிழப்பு", "உயிரிழந்த", "உயிரிழந்தார்", "உயிரிழந்தனர்", "பலி", "பலியான", "பலி எண்ணிக்கை", "மரணம்", "இறப்பு", "சடலம்", "பிணம்"];
const ACCIDENT_TERMS = ["accident", "crash", "collision", "mishap", "hit by", "overturned", "gas leak", "ammonia leak", "explosion", "fire accident", "விபத்து", "மோதல்", "மோதி", "மோதியதில்", "கவிழ்ந்து", "தடம் புரண்டு", "வாயு கசிவு", "அமோனியா", "தீ விபத்து", "வெடிப்பு"];
const INDUSTRIAL_ACCIDENT_TERMS = ["factory accident", "factory", "plant accident", "industrial accident", "chemical leak", "gas leak", "ammonia leak", "boiler blast", "தொழிற்சாலை", "தொழிற்சாலை விபத்து", "வாயு கசிவு", "அமோனியா", "ரசாயன கசிவு"];
const ANIMAL_TERMS = ["animal", "elephant", "cattle", "cow", "dog", "goat", "deer", "tiger", "leopard", "விலங்கு", "யானை", "மாடு", "நாய்", "ஆடு பலி", "மான்", "புலி", "சிறுத்தை"];
const LOCAL_EVENT_TERMS = ["festival", "food festival", "fair", "museum", "exhibition", "திருவிழா", "விழா", "உணவு திருவிழா", "அருங்காட்சியகம்", "கண்காட்சி"];
const POLITICAL_FORUM_TERMS = ["assembly", "legislative", "சட்டப்பேரவை", "சட்டசபை", "சட்டமன்ற"];

function normalizeVideoText(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^\w\s\u0B80-\u0BFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textIncludes(text: string, term: string): boolean {
  const normalized = normalizeVideoText(term);
  if (!normalized) return false;
  if (/^[a-z0-9 ]+$/.test(normalized) || normalized === "கொலை") {
    return new RegExp(`(^|\\s)${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s)`).test(text);
  }
  return text.includes(normalized);
}

function keywordText(keywords: ArticleVideoInput["keywords"]): string {
  if (Array.isArray(keywords)) return keywords.join(" ");
  return keywords || "";
}

function buildHaystack(input: ArticleVideoInput): string {
  return normalizeVideoText([
    input.category,
    input.title,
    input.headline,
    input.summary,
    input.content,
    input.district,
    keywordText(input.keywords),
  ].filter(Boolean).join(" "));
}

function categoryMatches(asset: VideoAsset, category?: string | null): boolean {
  if (!category || !asset.categories) return false;
  return asset.categories.includes(category);
}

function hasAnyTerm(haystack: string, terms: string[]): boolean {
  return terms.some((term) => textIncludes(haystack, term));
}

function getAsset(scene: NewsVideoScene): VideoAsset {
  return VIDEO_ASSETS.find((asset) => asset.scene === scene) || VIDEO_ASSETS[VIDEO_ASSETS.length - 1];
}

function scoreAsset(asset: VideoAsset, input: ArticleVideoInput, haystack: string): number {
  if (asset.forcedOnly) return -1;
  const keywordHits = asset.keywords.reduce((score, keyword) => score + (textIncludes(haystack, keyword) ? 1 : 0), 0);
  const categoryScore = categoryMatches(asset, input.category) ? 3 : 0;
  if (asset.requiresKeyword && keywordHits === 0) return -1;
  if (keywordHits === 0 && categoryScore === 0) return -1;
  return asset.priority + categoryScore * 10 + keywordHits * 8;
}

function selectVideoAsset(input: ArticleVideoInput): VideoAsset {
  const haystack = buildHaystack(input);

  if (hasAnyTerm(haystack, POLITICAL_FORUM_TERMS)) return getAsset("assembly");

  const hasFatality = hasAnyTerm(haystack, FATALITY_TERMS);
  const hasAccident = hasAnyTerm(haystack, ACCIDENT_TERMS);
  const hasIndustrialAccident = hasAnyTerm(haystack, INDUSTRIAL_ACCIDENT_TERMS) && (hasAccident || hasFatality || input.category === "தமிழ்நாடு விபத்து");
  const hasAnimal = hasAnyTerm(haystack, ANIMAL_TERMS);
  const hasLocalEvent = input.category === "தமிழ்நாடு உள்ளூர்" && hasAnyTerm(haystack, LOCAL_EVENT_TERMS);
  const isIncidentCategory = input.category === "தமிழ்நாடு விபத்து" || input.category === "தமிழ்நாடு குற்றம்" || input.category === "தமிழ்நாடு உள்ளூர்";

  if (hasLocalEvent) return getAsset("district");
  if (hasAnimal && hasFatality) return getAsset("animal-death");
  if (hasIndustrialAccident) return getAsset("industrial-accident");
  if (hasFatality && hasAccident) return getAsset("accident");
  if (hasFatality && isIncidentCategory) return getAsset("human-death");
  if (hasAccident) return getAsset("accident");

  let best = VIDEO_ASSETS[VIDEO_ASSETS.length - 1];
  let bestScore = -1;

  for (const asset of VIDEO_ASSETS) {
    const score = scoreAsset(asset, input, haystack);
    if (score > bestScore) {
      best = asset;
      bestScore = score;
    }
  }

  return bestScore >= 0 ? best : VIDEO_ASSETS[VIDEO_ASSETS.length - 1];
}

function buildVideoPrompt(input: ArticleVideoInput, asset: VideoAsset): string {
  const headline = input.headline || input.title || "Tamil Nadu news update";
  const summary = input.summary || input.content || "";
  const district = input.district ? ` District: ${input.district}.` : "";
  const keywords = keywordText(input.keywords);

  return [
    `${VIDEO_DURATION_SECONDS}-second ${VIDEO_STYLE} animated news video, ${VIDEO_RESOLUTION}, 16:9, muted, seamless loop.`,
    `Scene: ${asset.label}.`,
    `Headline: ${headline}.`,
    summary ? `Summary: ${summary.slice(0, 360)}.` : "",
    input.category ? `Category: ${input.category}.` : "",
    district,
    keywords ? `Keywords: ${keywords.slice(0, 180)}.` : "",
    "No text, no logos, no watermark, no audio.",
  ].filter(Boolean).join(" ");
}

export function resolveArticleVideo(input: ArticleVideoInput): ArticleVideoAssignment {
  const thumbnail = input.thumbnailUrl || "";
  if (!VIDEO_ENABLED || VIDEO_STORAGE !== "local") {
    return {
      aiVideoUrl: "",
      videoStatus: "disabled",
      videoPrompt: "",
      videoGeneratedAt: "",
      videoDuration: VIDEO_DURATION_SECONDS,
      videoThumbnail: thumbnail,
      videoScene: "district",
    };
  }

  const asset = selectVideoAsset(input);
  const videoStatus: VideoStatus = asset.url ? "completed" : "disabled";
  return {
    aiVideoUrl: asset.url,
    videoStatus,
    videoPrompt: buildVideoPrompt(input, asset),
    videoGeneratedAt: new Date().toISOString(),
    videoDuration: VIDEO_DURATION_SECONDS,
    videoThumbnail: thumbnail,
    videoScene: asset.scene,
  };
}

interface BackfillVideoRow {
  id: string;
  title: string | null;
  headline: string | null;
  summary: string | null;
  content: string | null;
  category: string | null;
  district: string | null;
  image_url: string | null;
  ai_image_url: string | null;
  search_keywords: string | null;
  tags: string | null;
}

export function backfillArticleVideos(database: Database.Database): number {
  const rows = database.prepare(`
    SELECT id, title, headline, summary, content, category, district,
           image_url, ai_image_url, search_keywords, tags
    FROM articles
    WHERE retention != 'archived'
      AND (
        video_status IS NULL
        OR video_status IN ('pending', 'failed')
        OR ((ai_video_url IS NULL OR ai_video_url = '') AND video_status NOT IN ('completed', 'disabled'))
      )
    ORDER BY published_at DESC
    LIMIT 500
  `).all() as BackfillVideoRow[];

  if (rows.length === 0) return 0;

  const update = database.prepare(`
    UPDATE articles
    SET ai_video_url = ?,
        video_status = ?,
        video_prompt = ?,
        video_generated_at = ?,
        video_duration = ?,
        video_thumbnail = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);

  const transaction = database.transaction((items: BackfillVideoRow[]) => {
    for (const row of items) {
      const video = resolveArticleVideo({
        id: row.id,
        title: row.title,
        headline: row.headline,
        summary: row.summary,
        content: row.content,
        category: row.category,
        district: row.district,
        keywords: [row.search_keywords || "", row.tags || ""],
        thumbnailUrl: row.ai_image_url || row.image_url || "",
      });

      update.run(
        video.aiVideoUrl,
        video.videoStatus,
        video.videoPrompt,
        video.videoGeneratedAt,
        video.videoDuration,
        video.videoThumbnail,
        row.id,
      );
    }
  });

  transaction(rows);
  return rows.length;
}
