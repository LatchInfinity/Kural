import { getErrorMessage } from "@/lib/api-errors";
import { getArticleTopicImage, localAiImageUrl } from "@/lib/ai-image-url";

interface CategoryPromptRule {
  canonical: string;
  scenes: string[];
  avoid: string;
}

const POLITICS_RULE: CategoryPromptRule = {
  canonical: "politics",
  scenes: [
    "wide exterior of a Tamil Nadu government building during a policy announcement, press barricades and official vehicles in the background",
    "Tamil Nadu assembly session atmosphere from a wide editorial angle, desks and microphones visible, no identifiable faces",
    "public meeting stage in Tamil Nadu with podium, flags kept abstract, crowd shown only from behind and far away",
    "official government event hall prepared for a policy briefing, empty chairs, press cameras, and administrative backdrop",
  ],
  avoid: "Never generate politician portraits or recognizable political faces.",
};

const GOVERNMENT_RULE: CategoryPromptRule = {
  canonical: "government",
  scenes: [
    "Tamil Nadu Secretariat style government office exterior with public service counters and administrative activity",
    "district collector office entrance with citizens waiting at service desks, wide news photograph, faces not visible",
    "public service center with forms, counters, notice boards without readable text, and orderly administrative activity",
    "official inspection scene at a public infrastructure site with government vehicles and staff seen from a distance",
  ],
  avoid: "No politician portraits, no close-up officials, no campaign imagery.",
};

const EDUCATION_RULE: CategoryPromptRule = {
  canonical: "education",
  scenes: [
    "Tamil Nadu school classroom with students studying from behind, books and notebooks on desks, no close-up faces",
    "college campus in Tamil Nadu with academic buildings and students walking in the distance",
    "exam hall with rows of desks and answer sheets, invigilator only as a distant figure, no readable text",
    "school building exterior during admission or results season, parents and students only as small background figures",
  ],
  avoid: "No teacher portraits, no student close-ups, no readable exam papers.",
};

const BUSINESS_RULE: CategoryPromptRule = {
  canonical: "business",
  scenes: [
    "Tamil Nadu factory floor with manufacturing machines, workers only as distant safety-helmet silhouettes",
    "industrial zone with warehouses, trucks, and production activity under realistic daylight",
    "office complex and business district in Tamil Nadu with stock market displays blurred and unreadable",
    "investment project construction site with cranes, factory structures, and industrial infrastructure",
  ],
  avoid: "Never generate businessman faces, executive portraits, logos, or brand signage.",
};

const TECHNOLOGY_RULE: CategoryPromptRule = {
  canonical: "technology",
  scenes: [
    "Chennai IT park office exterior with servers and digital infrastructure context, no company logos",
    "computer lab in Tamil Nadu with workstations and code-like screens blurred without readable text",
    "technology startup workspace with laptops, hardware prototypes, and distant unrecognizable staff",
    "data center corridor and network equipment in an editorial news photography style",
  ],
  avoid: "No tech-founder portraits, no logos, no readable screen text.",
};

const SPORTS_RULE: CategoryPromptRule = {
  canonical: "sports",
  scenes: [
    "stadium match action in Tamil Nadu from a wide angle, players in motion without recognizable faces",
    "cricket ground with bat, ball, stumps, scoreboard blurred, and crowd atmosphere in the background",
    "sports equipment laid near a practice field with stadium lights and spectators as distant silhouettes",
    "kabaddi or football match action captured from far away, energetic crowd atmosphere, no identifiable athletes",
  ],
  avoid: "Avoid recognizable athletes, close-up faces, trophy portrait poses, or celebrity sports imagery.",
};

const ACCIDENT_RULE: CategoryPromptRule = {
  canonical: "accident",
  scenes: [
    "Tamil Nadu road accident response scene with ambulance, traffic cones, and rescue workers from a distance",
    "industrial safety incident site with fire response vehicles and safety barriers, no injured people visible",
    "highway emergency response with police vehicle lights, warning triangles, and controlled traffic diversion",
    "disaster relief scene after an accident with responders, equipment, and cordoned area, no victim faces",
  ],
  avoid: "No gore, no victim faces, no dramatic close-ups.",
};

const CRIME_RULE: CategoryPromptRule = {
  canonical: "crime",
  scenes: [
    "Tamil Nadu police vehicles outside a station during an investigation, wide editorial news photo",
    "forensic investigation markers at a cordoned street scene, police tape without readable text, no people close-up",
    "court building exterior with security activity and police vehicles, no accused or victim faces",
    "night police patrol vehicle near a public area, realistic lighting, investigation atmosphere",
  ],
  avoid: "No victim faces, no accused portraits, no graphic crime scene detail.",
};

const WEATHER_RULE: CategoryPromptRule = {
  canonical: "weather",
  scenes: [
    "heavy rain over a Tamil Nadu city road with waterlogged streets, vehicles moving slowly, no pedestrians close-up",
    "dark storm clouds over Chennai skyline with realistic monsoon lighting and wet roads",
    "flooding impact on a Tamil Nadu neighborhood street, barricades and rescue equipment visible, no random people",
    "heatwave scene on a Tamil Nadu road with harsh sunlight, shimmering asphalt, and sparse traffic",
  ],
  avoid: "Never show random people, portraits, or dramatic fantasy skies.",
};

const TRANSPORT_RULE: CategoryPromptRule = {
  canonical: "transport",
  scenes: [
    "Tamil Nadu bus terminus with buses lined up, platform activity from a wide angle, no driver portraits",
    "railway station platform with train arrival and commuters as distant silhouettes, no readable signs",
    "Chennai metro train at a station platform, modern transit infrastructure, no close-up passengers",
    "highway traffic infrastructure with flyover, road markings, and vehicles in realistic daylight",
  ],
  avoid: "No driver portraits, no passenger close-ups, no readable route boards.",
};

const AGRICULTURE_RULE: CategoryPromptRule = {
  canonical: "agriculture",
  scenes: [
    "Tamil Nadu paddy field with irrigation channels, farming equipment, and workers seen only from far away",
    "rural agriculture landscape with crop rows, water pumps, and cloudy daylight",
    "vegetable wholesale market with produce crates and traders as distant silhouettes, no close-up faces",
    "farmland harvest scene with realistic soil, crops, and agricultural tools in a wide editorial frame",
  ],
  avoid: "No farmer portraits, no staged smiling close-ups.",
};

const LOCAL_RULE: CategoryPromptRule = {
  canonical: "local",
  scenes: [
    "Tamil Nadu district market street with shops, vehicles, and daily community activity from a wide angle",
    "district landmark street scene with public buildings, trees, and local traffic in realistic daylight",
    "public community event in a Tamil Nadu town square, people only as distant background figures",
    "neighborhood street with market stalls, buses, and civic activity, no random faces in close-up",
  ],
  avoid: "Avoid random faces, selfies, portraits, and staged poster-like scenes.",
};

const HEALTH_RULE: CategoryPromptRule = {
  canonical: "health",
  scenes: [
    "Tamil Nadu government hospital exterior with ambulance bay and medical staff as distant figures",
    "public health camp setup with examination tables and medical equipment, no patient faces",
    "hospital corridor with wheelchairs, signage blurred, and realistic clinical lighting",
    "primary health center exterior in Tamil Nadu with ambulance and public service activity",
  ],
  avoid: "No doctor portraits, no patient faces, no graphic medical scenes.",
};

const DEFAULT_RULE: CategoryPromptRule = {
  canonical: "local",
  scenes: LOCAL_RULE.scenes,
  avoid: LOCAL_RULE.avoid,
};

const CATEGORY_RULES: Record<string, CategoryPromptRule> = {
  "தமிழ்நாடு அரசியல்": POLITICS_RULE,
  Politics: POLITICS_RULE,
  "தமிழ்நாடு அரசு": GOVERNMENT_RULE,
  Government: GOVERNMENT_RULE,
  "தமிழ்நாடு கல்வி": EDUCATION_RULE,
  Education: EDUCATION_RULE,
  "தமிழ்நாடு வணிகம்": BUSINESS_RULE,
  Business: BUSINESS_RULE,
  "தமிழ்நாடு தொழில்நுட்பம்": TECHNOLOGY_RULE,
  Technology: TECHNOLOGY_RULE,
  "தமிழ்நாடு விளையாட்டு": SPORTS_RULE,
  Sports: SPORTS_RULE,
  "தமிழ்நாடு விபத்து": ACCIDENT_RULE,
  Accident: ACCIDENT_RULE,
  "தமிழ்நாடு குற்றம்": CRIME_RULE,
  Crime: CRIME_RULE,
  "தமிழ்நாடு வானிலை": WEATHER_RULE,
  Weather: WEATHER_RULE,
  "தமிழ்நாடு போக்குவரத்து": TRANSPORT_RULE,
  Transport: TRANSPORT_RULE,
  Railway: TRANSPORT_RULE,
  "தமிழ்நாடு வேளாண்மை": AGRICULTURE_RULE,
  Agriculture: AGRICULTURE_RULE,
  "தமிழ்நாடு உள்ளூர்": LOCAL_RULE,
  Local: LOCAL_RULE,
  Health: HEALTH_RULE,
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
  source?: string;
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
  [/gold\s+price|gold\s+rate|gold\s+market|gold\s+today|தங்கம்|தங்க\s*விலை/i, "Tamil Nadu jewelry market and gold rate report, gold ornaments in display cases, customers only as blurred background silhouettes"],
  [/price|rate|inflation|cost|budget|finance|stock\s+market|விலை|பணவீக்கம்|பட்ஜெட்|பங்கு\s*சந்தை/i, "financial district and stock market display context in Tamil Nadu, trading screens blurred without readable text, business news atmosphere"],
  [/power\s+cut|power\s+failure|electricity\s+failure|power\s+restoration|electricity|மின்\s*தடை|மின்சாரம்|மின்வாரியம்/i, "electricity infrastructure repair in Tamil Nadu, transformer, power lines, and service vehicles, workers only as distant silhouettes"],
  [/water\s+supply|water\s+shortage|drinking\s+water|water\s+tank|குடிநீர்|தண்ணீர்|நீர்\s*விநியோகம்/i, "municipal water supply scene in Tamil Nadu, water tanker, pipes, and public service area, no close-up people"],
  [/traffic|road\s+jam|traffic\s+jam|traffic\s+police|congestion|போக்குவரத்து\s*நெரிசல்|சாலை\s*நெரிசல்/i, "Tamil Nadu urban traffic junction with vehicles, flyover, and traffic management infrastructure, wide editorial angle"],
  [/metro|railway|train|rail\s+station|மெட்ரோ|ரயில்|இரயில்|ரயில்\s*நிலையம்/i, "Tamil Nadu railway or metro station platform with train arrival, commuters only as distant silhouettes, no readable signs"],
  [/government\s+scheme|welfare|subsidy|free\s+scheme|assistance|அரசு\s*திட்டம்|நலத்திட்டம்|மானியம்/i, "Tamil Nadu public service center during welfare scheme distribution, counters, forms, and administrative activity, faces not visible"],
  [/accident|collision|crash|road\s+safety|விபத்து|மோதல்|சாலை\s*விபத்து/i, "Tamil Nadu road accident response scene with ambulance, traffic cones, police vehicle, and cordoned area, no victims visible"],
  [/flood|cyclone|storm|heavy\s+rain|rainfall|weather\s+alert|வெள்ளம்|புயல்|கனமழை|மழை|வானிலை/i, "Tamil Nadu weather impact scene with heavy rain, flooded street, storm clouds, and slow traffic, no random people"],
  [/election|vote|polling|campaign|party\s+meeting|தேர்தல்|வாக்கு|வாக்குச்சாவடி|பிரசாரம்/i, "Tamil Nadu polling station or public policy meeting seen from a wide angle, ballots and administrative setup, no politician portraits"],
  [/hospital|health|medical|camp|doctor|patient|clinic|மருத்துவமனை|சுகாதாரம்|மருத்துவ\s*முகாம்/i, "Tamil Nadu government hospital or public health camp with medical equipment and ambulance, no doctor or patient close-up faces"],
  [/school|college|exam|university|admission|student|education|பள்ளி|கல்லூரி|தேர்வு|பல்கலைக்கழகம்|மாணவர்|கல்வி/i, "Tamil Nadu exam hall or classroom with rows of desks and students shown from behind, no readable papers"],
  [/court|judge|justice|legal|law\s+suit|civil\s+case|நீதிமன்றம்|தீர்ப்பு|நீதிபதி/i, "Tamil Nadu court building exterior with security activity and police vehicles, wide news photograph, no close-up faces"],
  [/police|arrest|crime|investigation|theft|robbery|illegal|காவல்|கைது|குற்றம்|விசாரணை|திருட்டு|கொள்ளை|மோசடி/i, "Tamil Nadu police investigation scene with police vehicles, forensic markers, and cordoned street, no victim or suspect faces"],
  [/transport|bus\s+stand|bus\s+stop|public\s+transport|பேருந்து|பஸ்|போக்குவரத்து/i, "Tamil Nadu bus terminus with buses, platform activity, and transport infrastructure, no driver portraits"],
  [/farmer|agriculture|crop|harvest|paddy|farm|விவசாய|விவசாயி|பயிர்|நெல்|வேளாண்மை/i, "Tamil Nadu paddy field and irrigation scene with crops and farming tools, workers only as distant silhouettes"],
  [/sports|cricket|match|tournament|athlete|stadium|விளையாட்டு|கிரிக்கெட்|போட்டி|மைதானம்|கபடி|கால்பந்து/i, "Tamil Nadu stadium match action from a wide angle with sports equipment and crowd atmosphere, no recognizable athletes"],
  [/technology|digital|AI|startup|IT|computer|innovation|தொழில்நுட்பம்|டிஜிட்டல்|செயற்கை\s*நுண்ணறிவு/i, "Chennai IT park or computer lab with digital infrastructure, screens blurred without readable text, no founder portraits"],
  [/road\s+construction|bridge|infrastructure|flyover|highway|சாலை\s*பணி|பாலம்|மேம்பாலம்|நெடுஞ்சாலை/i, "Tamil Nadu road construction, bridge, flyover, and highway infrastructure project, workers only as distant silhouettes"],
  [/environment|pollution|forest|wildlife|river|conservation|சுற்றுச்சூழல்|மாசு|காடு|நதி/i, "Tamil Nadu environment news scene with river, forest, pollution control equipment, and conservation activity, no close-up people"],
  [/festival|pooja|temple|celebration|cultural|திருவிழா|கோவில்|கலாசாரம்/i, "Tamil Nadu temple festival or cultural public event from a wide editorial angle, crowd shown from behind, no close-up faces"],
];

function detectTopicScene(text: string): string | null {
  for (const [regex, scene] of TOPIC_KEYWORDS) {
    if (regex.test(text)) return scene;
  }
  return null;
}

function normalizeCategoryKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function getCategoryRule(category: string): CategoryPromptRule {
  const direct = CATEGORY_RULES[category];
  if (direct) return direct;

  const normalized = normalizeCategoryKey(category);
  const matched = Object.keys(CATEGORY_RULES).find((key) => normalizeCategoryKey(key) === normalized);
  return matched ? CATEGORY_RULES[matched] : DEFAULT_RULE;
}

function articleFocusFor(text: string, rule: CategoryPromptRule): string {
  if (/flood|வெள்ளம்/i.test(text)) return "flooding impact on streets, transport, and public safety";
  if (/cyclone|storm|புயல்/i.test(text)) return "storm preparedness, dark clouds, and weather impact on the city";
  if (/rain|rainfall|மழை|கனமழை/i.test(text)) return "rainfall alert and wet road conditions";
  if (/heatwave|வெப்ப/i.test(text)) return "heatwave conditions and harsh summer sunlight";
  if (/exam|result|admission|தேர்வு|முடிவு|சேர்க்கை/i.test(text)) return "exam, admission, or student academic activity";
  if (/school|college|university|பள்ளி|கல்லூரி|பல்கலை/i.test(text)) return "school or college campus activity";
  if (/arrest|police|investigation|கைது|காவல்|விசாரணை/i.test(text)) return "police investigation and public security activity";
  if (/court|நீதிமன்றம்|தீர்ப்பு/i.test(text)) return "court proceedings and legal institution context";
  if (/factory|industry|manufacturing|தொழிற்சாலை|தொழில்/i.test(text)) return "industrial production, factory activity, and investment context";
  if (/stock|market|business|சந்தை|வணிகம்/i.test(text)) return "market movement, commercial activity, and business infrastructure";
  if (/bus|train|metro|traffic|பேருந்து|ரயில்|மெட்ரோ|போக்குவரத்து/i.test(text)) return "transport service, stations, roads, and commuter infrastructure";
  if (/cricket|football|kabaddi|match|tournament|கிரிக்கெட்|கால்பந்து|கபடி|போட்டி/i.test(text)) return "match action, sports equipment, and crowd atmosphere";
  if (/scheme|welfare|subsidy|அரசு\s*திட்டம்|நலத்திட்டம்|மானியம்/i.test(text)) return "public welfare service delivery and administrative counters";
  if (/election|poll|vote|தேர்தல்|வாக்கு/i.test(text)) return "election administration, polling station, and public meeting context";
  if (/market|street|festival|சந்தை|தெரு|திருவிழா/i.test(text)) return "district street life, public event, and community activity";
  return `${rule.canonical} news context with concrete public place details`;
}

const CONCRETE_SCENE_RE = /building|assembly|office|school|college|classroom|exam|factory|market|rain|flood|storm|bus|train|metro|station|highway|stadium|court|police|vehicle|street|road|campus|industrial|government|hospital|bridge|traffic|field|farm|infrastructure|சட்டமன்ற|அலுவலக|பள்ளி|கல்லூரி|தேர்வு|மழை|வெள்ளம்|புயல்|பேருந்து|ரயில்|மைதானம்|நீதிமன்றம்|காவல்|சந்தை|தெரு|சாலை|மருத்துவமனை|பாலம்|விவசாய/i;

const VAGUE_ONLY_RE = /^(news|latest|breaking|update|updates|general|topic|story|tamil nadu|தமிழ்நாடு|செய்தி|புதிய செய்தி|உள்ளூர்)$/i;

const POLITICAL_OR_PERSON_NAME_RE = /\b(stalin|modi|rahul|gandhi|amit\s+shah|annamalai|udhayanidhi|vijay|seeman|eps|ops)\b|ஸ்டாலின்|மோடி|ராகுல்|காந்தி|அமித்ஷா|அண்ணாமலை|உதயநிதி|விஜய்|சீமான்/i;

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function validatePromptQuality(prompt: string, scene: string): { ok: boolean; reason: string } {
  if (wordCount(prompt) < 20) return { ok: false, reason: "less_than_20_words" };
  if (!scene.trim() || VAGUE_ONLY_RE.test(scene.trim())) return { ok: false, reason: "vague_scene" };
  if (POLITICAL_OR_PERSON_NAME_RE.test(scene) && !CONCRETE_SCENE_RE.test(scene)) {
    return { ok: false, reason: "person_or_political_name_only" };
  }
  if (!CONCRETE_SCENE_RE.test(prompt)) return { ok: false, reason: "missing_concrete_scene" };
  return { ok: true, reason: "ok" };
}

function buildStructuredPrompt(input: ArticleImageGenerationInput, attempt: number): { prompt: string; scene: string; location: string; rule: CategoryPromptRule } {
  const { headline, category, summary, district, source = "", keywords = [] } = input;
  const location = detectLocation(headline, summary, district);
  const rule = getCategoryRule(category);
  const searchText = `${headline} ${summary} ${keywords.join(" ")}`;
  const topicScene = attempt === 0 ? detectTopicScene(searchText) : null;
  const categoryScene = rule.scenes[stableIndex(`${headline} ${summary} ${category} ${district || ""} ${attempt}`, rule.scenes.length)];
  const scene = topicScene || categoryScene;
  const locationContext = location === "Tamil Nadu" ? "Tamil Nadu context" : `${location}, Tamil Nadu context`;
  const sourceContext = source ? "regional source context considered without publisher logos" : "regional Tamil Nadu news source context";
  const focus = articleFocusFor(searchText, rule);

  const prompt = [
    "Photorealistic news photography, newspaper editorial style, highly detailed, realistic lighting, natural colors",
    "landscape orientation, 16:9 wide editorial composition",
    locationContext,
    `Scene: ${scene}`,
    `Article focus: ${focus}`,
    sourceContext,
    rule.avoid,
    "No text in image, no watermark, no logo, no poster design, no readable signage",
    "Negative prompt: no close-up face, no portrait, no selfie, no celebrity, no politician face, no floating heads, no anime, no cartoon, no illustration, no AI art style, no typography, no recognizable people",
  ].join(". ");

  return { prompt, scene, location, rule };
}

export function buildImagePrompt(input: ArticleImageGenerationInput): string {
  const first = buildStructuredPrompt(input, 0);
  const firstValidation = validatePromptQuality(first.prompt, first.scene);
  let result = first;
  let validation = firstValidation;

  if (!firstValidation.ok) {
    console.warn(`[IMAGE FALLBACK] reason=${firstValidation.reason} category=${input.category} regenerating_prompt=true`);
    result = buildStructuredPrompt(input, 1);
    validation = validatePromptQuality(result.prompt, result.scene);
  }

  if (!validation.ok) {
    console.warn(`[IMAGE FALLBACK] reason=${validation.reason} category=${input.category} using_safe_default=true`);
    result = {
      ...result,
      scene: DEFAULT_RULE.scenes[0],
      prompt: [
        "Photorealistic news photography, newspaper editorial style, highly detailed, realistic lighting, natural colors",
        "landscape orientation, 16:9 wide editorial composition",
        "Tamil Nadu context",
        `Scene: ${DEFAULT_RULE.scenes[0]}`,
        "Article focus: district public activity and civic news context",
        DEFAULT_RULE.avoid,
        "No text in image, no watermark, no logo, no poster design, no readable signage",
        "Negative prompt: no close-up face, no portrait, no selfie, no celebrity, no politician face, no floating heads, no anime, no cartoon, no illustration, no AI art style, no typography, no recognizable people",
      ].join(". "),
    };
  }

  console.log(`[IMAGE CATEGORY] category=${input.category} resolved=${result.rule.canonical} location=${result.location} source=${input.source || "unknown"}`);
  console.log(`[IMAGE PROMPT] category=${input.category} words=${wordCount(result.prompt)} scene="${result.scene.slice(0, 120)}" prompt="${result.prompt.slice(0, 260)}"`);
  return result.prompt;
}

export function imageUrlFromPrompt(prompt: string): string {
  return localAiImageUrl(prompt);
}

const URL_REGEX = /^(?:\/api\/ai-image\?|https:\/\/image\.pollinations\.ai\/prompt\/)/;

export function isValidImageUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  if (trimmed === "null" || trimmed === "undefined") return false;
  return URL_REGEX.test(trimmed) || trimmed.startsWith("https://") || trimmed.startsWith("http://");
}

export async function verifyImageUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  if (!isValidImageUrl(url)) return false;
  if (url.startsWith("/api/ai-image?")) return true;
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
  const topicImage = getArticleTopicImage(input);
  const prompt = topicImage.prompt || buildImagePrompt(input);
  const url = topicImage.url || imageUrlFromPrompt(prompt);
  if (!isValidImageUrl(url)) {
    console.error(`[IMAGE] INVALID_URL generated for category=${input.category} url=${url.slice(0, 80)}`);
  }
  console.log(`[IMAGE GENERATED] category=${input.category} topic=${topicImage.topicKey} url=${url.slice(0, 120)}`);
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
  console.warn(`[IMAGE FALLBACK] category=${input.category} reason=verification_failed`);
  const fallback = generateArticleImage({ headline: "Tamil Nadu news", category: input.category, summary: input.category });
  return fallback;
}
