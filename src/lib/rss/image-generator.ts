import { getErrorMessage } from "@/lib/api-errors";

const CATEGORY_VISUALS: Record<string, string[]> = {
  "தமிழ்நாடு அரசியல்": [
    "Tamil Nadu political leaders public meeting",
    "government building assembly session",
    "state legislature ministers debate",
    "political rally election campaign",
  ],
  "தமிழ்நாடு அரசு": [
    "Tamil Nadu Secretariat government office",
    "government scheme launch ceremony",
    "district collector office administration",
    "public welfare program event",
  ],
  "தமிழ்நாடு கல்வி": [
    "students writing competitive exam hall",
    "university campus admission atmosphere",
    "school classroom teaching books",
    "college graduation ceremony students",
  ],
  "தமிழ்நாடு வணிகம்": [
    "Tamil Nadu factory industrial production",
    "business trade center commerce",
    "shopping market retail economy",
    "office corporate building workers",
  ],
  "தமிழ்நாடு தொழில்நுட்பம்": [
    "IT park technology office Chennai",
    "computer lab students programming",
    "modern tech startup innovation",
    "digital technology AI robotics",
  ],
  "தமிழ்நாடு விளையாட்டு": [
    "cricket stadium match Tamil Nadu",
    "athlete running sports competition",
    "football ground players training",
    "sports tournament trophy celebration",
  ],
  "தமிழ்நாடு விபத்து": [
    "road accident emergency rescue team",
    "industrial safety fire response",
    "ambulance paramedic disaster relief",
    "police traffic incident investigation",
  ],
  "தமிழ்நாடு குற்றம்": [
    "police station law enforcement officers",
    "court building justice legal system",
    "crime scene investigation forensic",
    "police patrol vehicle night duty",
  ],
  "தமிழ்நாடு வானிலை": [
    "heavy rain flood Tamil Nadu",
    "cyclone storm clouds dark sky",
    "heatwave sun hot weather",
    "thunderstorm lightning rainy season",
  ],
  "தமிழ்நாடு போக்குவரத்து": [
    "metro train platform commuters Chennai",
    "bus terminal highway road traffic",
    "railway station train arrival departure",
    "bridge flyover urban transport",
  ],
  "தமிழ்நாடு வேளாண்மை": [
    "paddy field farmer harvesting crop",
    "agriculture farmland irrigation Tamil Nadu",
    "vegetable market farmer selling produce",
    "rural farming village agriculture work",
  ],
  "தமிழ்நாடு உள்ளூர்": [
    "local market street vendors Tamil Nadu",
    "village festival cultural celebration",
    "neighborhood park community gathering",
    "town street daily life local event",
  ],
};

const DISTRICT_LOCATIONS: Record<string, string> = {
  "சென்னை": "Chennai", "chennai": "Chennai",
  "coimbatore": "Coimbatore", "கோயம்புத்தூர்": "Coimbatore",
  "madurai": "Madurai", "மதுரை": "Madurai",
  "trichy": "Trichy", "திருச்சி": "Trichy",
  "salem": "Salem", "சேலம்": "Salem",
  "erode": "Erode", "ஈரோடு": "Erode",
  "tirunelveli": "Tirunelveli", "திருநெல்வேலி": "Tirunelveli",
  "thoothukudi": "Thoothukudi", "தூத்துக்குடி": "Thoothukudi",
  "vellore": "Vellore", "வேலூர்": "Vellore",
  "kanyakumari": "Kanyakumari", "கன்னியாகுமரி": "Kanyakumari",
  "tiruppur": "Tiruppur", "திருப்பூர்": "Tiruppur",
  "dindigul": "Dindigul", "திண்டுக்கல்": "Dindigul",
  "tiruvallur": "Tiruvallur", "திருவள்ளூர்": "Tiruvallur",
};

function detectLocation(headline: string, summary: string, district?: string): string {
  if (district) {
    const eng = DISTRICT_LOCATIONS[district.toLowerCase()];
    if (eng) return eng;
  }
  const text = `${headline} ${summary}`.toLowerCase();
  for (const [key, value] of Object.entries(DISTRICT_LOCATIONS)) {
    if (text.includes(key)) return value;
  }
  return "Tamil Nadu";
}

export interface ArticleImageGeneration {
  prompt: string;
  url: string;
}

export interface ArticleImageGenerationInput {
  headline: string;
  category: string;
  summary: string;
  district?: string;
  keywords?: string[];
}

function stableIndex(seed: string, length: number): number {
  if (length <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

const TOPIC_KEYWORDS: [RegExp, string][] = [
  [/gold\s+price|gold\s+rate|gold\s+market|gold\s+today/i, "jewelry shop gold market Tamil Nadu, traders and customers examining gold ornaments, gold coins display"],
  [/price|rate|inflation|cost|budget|finance|stock\s+market/i, "stock market trading floor Tamil Nadu, financial district business center, economic activity commerce"],
  [/power\s+cut|power\s+failure|electricity\s+failure|power\s+restoration|electricity/i, "electricity workers repairing power lines Tamil Nadu, transformer maintenance, power grid restoration"],
  [/water\s+supply|water\s+shortage|drinking\s+water|water\s+tank/i, "water tanker distribution Tamil Nadu street, public water supply pipeline, municipal water service"],
  [/traffic|road\s+jam|traffic\s+j am|traffic\s+police|congestion/i, "Chennai traffic road vehicles, police managing traffic junction, urban road congestion Tamil Nadu"],
  [/metro|railway|train|rail\s+station/i, "Chennai metro railway station platform, commuters boarding train, suburban railway Tamil Nadu"],
  [/government\s+scheme|welfare|subsidy|free\s+scheme|assistance/i, "citizens receiving government services at Tamil Nadu office, scheme distribution event, public welfare program"],
  [/accident|collision|crash|road\s+safety/i, "road accident site Tamil Nadu, emergency rescue team ambulance, police investigation traffic incident"],
  [/flood|cyclone|storm|heavy\s+rain|rainfall|weather\s+alert/i, "heavy rain flood affected area Tamil Nadu, flooded street rescue operation, cyclone damage landscape"],
  [/election|vote|polling|campaign|party\s+meeting/i, "Tamil Nadu election polling station, voters queue casting vote, political campaign rally"],
  [/hospital|health|medical|camp|doctor|patient|clinic/i, "Tamil Nadu government hospital doctors treating patients, medical camp healthcare service, hospital corridor"],
  [/school|college|exam|university|admission|student|education/i, "students writing exam in Tamil Nadu school classroom, university campus college building, education event"],
  [/court|judge|justice|legal|law\s+suit|civil\s+case/i, "Tamil Nadu court building exterior, lawyers legal proceedings, court hearing session"],
  [/police|arrest|crime|investigation|theft|robbery\s+|illegal/i, "police station exterior Tamil Nadu, law enforcement vehicle police patrol, crime investigation scene"],
  [/transport|bus\s+stand|bus\s+stop|public\s+transport/i, "Tamil Nadu bus terminus passengers boarding, public transport bus on road, commuters waiting at bus stop"],
  [/farmer|agriculture|crop|harvest|paddy|farm/i, "paddy field farmer harvesting Tamil Nadu agriculture, farmland irrigation rural scene, vegetable market farmer selling"],
  [/sports|cricket|match|tournament|athlete|stadium/i, "cricket stadium Tamil Nadu sports match, athletes competing stadium crowd, sports tournament celebration"],
  [/technology|digital|AI|startup|IT|computer|innovation/i, "IT park technology office Chennai, computer lab innovation hub Tamil Nadu, digital technology workspace"],
  [/road\s+construction|bridge|infrastructure|flyover|highway/i, "road construction bridge building Tamil Nadu, infrastructure development engineering project, flyover highway construction"],
  [/environment|pollution|forest|wildlife|river|conservation/i, "Tamil Nadu forest reserve wildlife habitat, river conservation environment protection, pollution control initiative"],
  [/festival|pooja|temple|celebration|cultural/i, "Tamil temple festival celebration, cultural event traditional Tamil Nadu, pooja ceremony devotees"],
];

function detectTopicScene(text: string): string | null {
  for (const [regex, scene] of TOPIC_KEYWORDS) {
    if (regex.test(text)) return scene;
  }
  return null;
}

function truncateHeadline(headline: string, maxLen: number = 60): string {
  if (headline.length <= maxLen) return headline;
  return headline.slice(0, maxLen).split(" ").slice(0, -1).join(" ") + "...";
}

export function buildImagePrompt(input: ArticleImageGenerationInput): string {
  const { headline, category, summary, district, keywords = [] } = input;
  const location = detectLocation(headline, summary, district);

  const searchText = `${headline} ${summary} ${keywords.join(" ")}`;
  const topicScene = detectTopicScene(searchText);

  let scene: string;
  if (topicScene) {
    scene = topicScene;
  } else {
    const visuals = CATEGORY_VISUALS[category] || ["Tamil Nadu street scene daily life", "public place people Tamil Nadu"];
    scene = visuals[stableIndex(`${headline} ${category} ${district || ""}`, visuals.length)];
  }

  const locationScene = scene.includes(location) ? scene : `${scene} in ${location}`;

  const prompt = [
    "Photorealistic Tamil Nadu news photograph",
    locationScene,
    "realistic people, natural lighting",
    "newspaper-quality journalism photography, highly detailed, professional news coverage",
    "16:9 composition, no text, no watermark, no logo",
  ].join(", ");

  console.log(`[IMAGE] PROMPT category=${category} location=${location} scene="${scene.slice(0, 80)}" prompt_len=${prompt.length}`);
  return prompt;
}

export function imageUrlFromPrompt(prompt: string): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=450&nofeed=true`;
}

const URL_REGEX = /^https:\/\/image\.pollinations\.ai\/prompt\//;

export function isValidImageUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  if (trimmed === "null" || trimmed === "undefined") return false;
  return URL_REGEX.test(trimmed) || trimmed.startsWith("https://") || trimmed.startsWith("http://");
}

export async function verifyImageUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  if (!isValidImageUrl(url)) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export function generateArticleImage(input: ArticleImageGenerationInput): ArticleImageGeneration {
  console.log(`[IMAGE] QUEUE category=${input.category} headline="${input.headline.slice(0, 60)}"`);
  const prompt = buildImagePrompt(input);
  const url = imageUrlFromPrompt(prompt);
  if (!isValidImageUrl(url)) {
    console.error(`[IMAGE] INVALID_URL generated for category=${input.category} url=${url.slice(0, 80)}`);
  }
  console.log(`[IMAGE] GENERATED category=${input.category} url=${url.slice(0, 80)}`);
  return { prompt, url };
}

export function generateImageUrl(headline: string, category: string, summary: string, district?: string): string {
  return generateArticleImage({ headline, category, summary, district }).url;
}

export async function generateVerifiedArticleImage(
  input: ArticleImageGenerationInput,
  maxRetries: number = 3,
): Promise<ArticleImageGeneration> {
  let lastError = "";
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = generateArticleImage(input);
      const ok = await verifyImageUrl(result.url);
      if (ok) {
        console.log(`[IMAGE] VERIFIED url=${result.url.slice(0, 80)}`);
        return result;
      }
      lastError = `HTTP check failed for ${result.url.slice(0, 60)}`;
      console.log(`[IMAGE] VERIFY_FAILED attempt=${attempt}/${maxRetries} category=${input.category} error=${lastError}`);
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        console.log(`[IMAGE] RETRY delay=${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      lastError = getErrorMessage(err);
      console.log(`[IMAGE] ERROR attempt=${attempt}/${maxRetries} error=${lastError}`);
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error(`[IMAGE] FINAL_FAILURE category=${input.category} headline="${input.headline.slice(0, 50)}" error=${lastError}`);
  const fallback = generateArticleImage({ headline: "Tamil Nadu news", category: input.category, summary: input.category });
  return fallback;
}
