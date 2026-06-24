export type NewsAnimationScene =
  | "accident"
  | "politics"
  | "government"
  | "transport"
  | "business"
  | "sports"
  | "agriculture"
  | "weather"
  | "education"
  | "technology"
  | "crime"
  | "breaking"
  | "local";

const SCENE_KEYS = new Set<NewsAnimationScene>([
  "accident",
  "politics",
  "government",
  "transport",
  "business",
  "sports",
  "agriculture",
  "weather",
  "education",
  "technology",
  "crime",
  "breaking",
  "local",
]);

export interface NewsAnimationInput {
  animationScene?: string | null;
  category?: string | null;
  title?: string | null;
  headline?: string | null;
  summary?: string | null;
  content?: string | null;
  source?: string | null;
  retention?: string | null;
  isBreaking?: boolean | null;
}

export function isNewsAnimationScene(value: unknown): value is NewsAnimationScene {
  return typeof value === "string" && SCENE_KEYS.has(value as NewsAnimationScene);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSceneText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s\u0B80-\u0BFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTerm(haystack: string, term: string): boolean {
  const normalizedTerm = normalizeSceneText(term);
  if (!normalizedTerm) return false;
  if (/^[a-z0-9 ]+$/.test(normalizedTerm) || normalizedTerm === "கொலை") {
    return new RegExp(`(^|\\s)${escapeRegex(normalizedTerm)}($|\\s)`).test(haystack);
  }
  return haystack.includes(normalizedTerm);
}

function has(haystack: string, terms: string[]): boolean {
  const normalizedHaystack = normalizeSceneText(haystack);
  return terms.some((term) => hasTerm(normalizedHaystack, term));
}

export function resolveNewsAnimationScene(input: NewsAnimationInput): NewsAnimationScene {
  if (isNewsAnimationScene(input.animationScene)) return input.animationScene;

  const haystack = [
    input.category,
    input.title,
    input.headline,
    input.summary,
    input.content,
    input.source,
  ].filter(Boolean).join(" ").toLowerCase();

  if (has(input.category?.toLowerCase() || "", ["விபத்து", "accident"])) return "accident";
  if (
    input.category === "தமிழ்நாடு உள்ளூர்" &&
    has(haystack, ["திருவிழா", "விழா", "festival", "food festival", "உணவு திருவிழா", "அருங்காட்சியகம்", "museum", "கண்காட்சி", "exhibition", "fair"])
  ) return "local";
  if (has(haystack, ["குற்றம்", "crime", "chase", "chasing", "pursuit", "raid", "arrest", "murder", "theft", "court", "criminal case", "நீதிமன்ற", "கைது", "கொலை", "திருட்டு", "துரத்த", "துரத்தல்", "விரட்ட", "ஜீப்", "காவல் நிலையம்"])) return "crime";
  if (has(haystack, ["விபத்து", "accident", "crash", "collision", "வாயு கசிவு", "gas leak", "அமோனியா", "ammonia", "தீ விபத்து", "வெடிப்பு", "explosion", "factory accident", "தொழிற்சாலை விபத்து"])) return "accident";
  if (has(haystack, ["வானிலை", "weather", "rain", "shower", "storm", "cyclone", "மழை", "சாரல்", "புயல்", "flood", "வெள்ள"])) return "weather";
  if (has(haystack, ["தொழில்நுட்பம்", "technology", "science", "scientist", "machine", "robot", "ai", "5g", "டெக்", "செயற்கை", "அறிவியல்", "விஞ்ஞானி", "இயந்திரம்"])) return "technology";
  if (has(haystack, ["போக்குவரத்து", "metro", "rail", "train", "airport", "bus", "விமான", "ரயில்", "பேருந்து"])) return "transport";
  if (has(haystack, ["விளையாட்டு", "sports", "cricket", "ipl", "football", "போட்டி"])) return "sports";
  if (has(haystack, ["வேளாண்மை", "agriculture", "farm", "farmer", "விவசாய"])) return "agriculture";
  if (has(haystack, ["கல்வி", "education", "school", "college", "university", "மாணவர்", "பள்ளி", "கல்லூரி"])) return "education";
  if (has(haystack, ["வணிகம்", "business", "economy", "investment", "market", "முதலீடு", "சந்தை"])) return "business";
  if (has(haystack, ["அரசியல்", "politics", "election", "minister", "முதலமைச்சர்", "தேர்தல்"])) return "politics";
  if (has(haystack, ["அரசு", "government", "scheme", "policy", "திட்டம்"])) return "government";
  if (input.isBreaking || input.retention === "breaking" || has(haystack, ["breaking", "முக்கிய", "அவசரம்"])) return "breaking";

  return "local";
}
