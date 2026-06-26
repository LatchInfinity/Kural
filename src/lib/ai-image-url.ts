const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 450;

export interface ArticleTopicImageInput {
  headline?: string | null;
  title?: string | null;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  district?: string | null;
  source?: string | null;
  keywords?: string[];
}

export function stableImageSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function externalAiImageUrl(
  prompt: string,
  options: { width?: number; height?: number; seed?: number } = {},
): string {
  const width = options.width || DEFAULT_WIDTH;
  const height = options.height || DEFAULT_HEIGHT;
  const seed = options.seed ?? stableImageSeed(prompt);
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    nofeed: "true",
    nologo: "true",
    seed: String(seed),
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

export function localAiImageUrl(
  prompt: string,
  options: { width?: number; height?: number; seedSource?: string; topicKey?: string } = {},
): string {
  const width = options.width || DEFAULT_WIDTH;
  const height = options.height || DEFAULT_HEIGHT;
  const seedSource = options.seedSource || options.topicKey || prompt;
  const seed = stableImageSeed(seedSource);
  const params = new URLSearchParams({
    prompt,
    width: String(width),
    height: String(height),
    seed: String(seed),
  });
  if (options.topicKey) params.set("topic", options.topicKey);
  return `/api/ai-image?${params.toString()}`;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s\u0B80-\u0BFF-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value: string, maxLength: number): string {
  const cleaned = value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).replace(/\s+\S*$/, "")}`;
}

function slug(value: string): string {
  return normalizeText(value)
    .replace(/[\u0B80-\u0BFF]+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function categorySlug(category: string): string {
  const normalized = normalizeText(category);
  if (normalized.includes("அரசியல்") || normalized.includes("politics")) return "politics";
  if (normalized.includes("வானிலை") || normalized.includes("weather")) return "weather";
  if (normalized.includes("வேளாண்மை") || normalized.includes("agriculture")) return "agriculture";
  if (normalized.includes("வணிகம்") || normalized.includes("business")) return "business";
  if (normalized.includes("கல்வி") || normalized.includes("education")) return "education";
  if (normalized.includes("விபத்து") || normalized.includes("accident")) return "accident";
  if (normalized.includes("குற்றம்") || normalized.includes("crime")) return "crime";
  if (normalized.includes("அரசு") || normalized.includes("government")) return "government";
  if (normalized.includes("போக்குவரத்து") || normalized.includes("transport")) return "transport";
  if (normalized.includes("விளையாட்டு") || normalized.includes("sports")) return "sports";
  if (normalized.includes("தொழில்நுட்பம்") || normalized.includes("technology")) return "technology";
  if (normalized.includes("உள்ளூர்") || normalized.includes("local")) return "local";
  return slug(category) || "local";
}

const TOPIC_RULES: { category?: string; key: string; label: string; scene: string; patterns: RegExp[] }[] = [
  { category: "weather", key: "rain", label: "rain alert", scene: "heavy rain over Tamil Nadu city roads, wet streets, storm clouds, slow traffic, no close-up people", patterns: [/rain|rainfall|monsoon|மழை|கனமழை/i] },
  { category: "weather", key: "flood", label: "flood impact", scene: "urban flooding in Tamil Nadu with waterlogged streets, rescue equipment, barricades, no random people", patterns: [/flood|waterlog|வெள்ளம்|நீர்ப்பெருக்கு/i] },
  { category: "weather", key: "cyclone", label: "cyclone warning", scene: "cyclone clouds near Tamil Nadu coast, emergency preparedness, wet roads, realistic weather impact", patterns: [/cyclone|storm|புயல்|சூறாவளி/i] },
  { category: "weather", key: "heatwave", label: "heatwave", scene: "Tamil Nadu road under harsh summer sunlight, heat haze, sparse traffic, no people close-up", patterns: [/heat|summer|வெப்ப|வெயில்|கோடை/i] },

  { category: "business", key: "gold-price", label: "gold price", scene: "Tamil Nadu jewelry market with gold ornaments in display cases, traders only as distant silhouettes, no logos", patterns: [/gold|jewel|bullion|தங்கம்|நகை/i] },
  { category: "business", key: "market-price", label: "market price", scene: "Tamil Nadu wholesale market and commerce activity, price movement context, no readable text or faces", patterns: [/price|rate|market|inflation|விலை|சந்தை|பணவீக்கம்/i] },
  { category: "business", key: "factory-industry", label: "factory industry", scene: "Tamil Nadu factory floor and industrial zone with machinery, trucks, safety equipment, no businessman faces", patterns: [/factory|industry|manufacturing|plant|தொழிற்சாலை|தொழில்/i] },
  { category: "business", key: "stock-finance", label: "stock finance", scene: "financial district and blurred stock market displays, office complex, investment news atmosphere, no faces", patterns: [/stock|share|bank|finance|investment|பங்கு|வங்கி|முதலீடு/i] },

  { category: "education", key: "exam", label: "exam", scene: "Tamil Nadu exam hall with rows of desks and answer sheets, students from behind, no readable papers", patterns: [/exam|test|neet|result|தேர்வு|முடிவு/i] },
  { category: "education", key: "school", label: "school", scene: "Tamil Nadu school building and classroom learning atmosphere, students only from behind or far away", patterns: [/school|teacher|student|பள்ளி|மாணவர்|ஆசிரியர்/i] },
  { category: "education", key: "college", label: "college", scene: "Tamil Nadu college campus and academic building, students walking as distant silhouettes, no portraits", patterns: [/college|university|campus|admission|கல்லூரி|பல்கலை|சேர்க்கை/i] },

  { category: "crime", key: "police-investigation", label: "police investigation", scene: "Tamil Nadu police vehicles near an investigation scene, forensic markers, cordoned area, no victim or accused faces", patterns: [/police|investigation|காவல்|விசாரணை/i] },
  { category: "crime", key: "arrest", label: "arrest", scene: "police station exterior with patrol vehicles and security activity, no suspect faces, no victim faces", patterns: [/arrest|detain|கைது/i] },
  { category: "crime", key: "court-case", label: "court case", scene: "Tamil Nadu court building exterior with police vehicle and legal institution atmosphere, no faces", patterns: [/court|judge|verdict|case|நீதிமன்றம்|வழக்கு|தீர்ப்பு/i] },
  { category: "crime", key: "fraud-theft", label: "fraud theft", scene: "police investigation desk with evidence markers and official files, no people close-up, no readable text", patterns: [/theft|robbery|fraud|scam|திருட்டு|கொள்ளை|மோசடி|ஊழல்/i] },

  { category: "government", key: "welfare-scheme", label: "welfare scheme", scene: "Tamil Nadu public service center with counters, forms, citizens seen from behind, no politician portraits", patterns: [/scheme|welfare|subsidy|ration|pension|திட்டம்|மானியம்|ரேஷன்|ஓய்வூதியம்/i] },
  { category: "government", key: "administration", label: "administration", scene: "Tamil Nadu government office exterior and administrative service counters, official vehicles, no politician portraits", patterns: [/government|office|collector|secretariat|அரசு|ஆட்சியர்|செயலகம்/i] },
  { category: "government", key: "inspection", label: "official inspection", scene: "official inspection at a public infrastructure site with administrative staff seen far away, no faces", patterns: [/inspection|review|ஆய்வு|காவல்|அமைச்சர்/i] },

  { category: "transport", key: "bus", label: "bus transport", scene: "Tamil Nadu bus terminus with state buses lined up, platform activity from wide angle, no driver portraits", patterns: [/bus|tnstc|பேருந்து|பஸ்/i] },
  { category: "transport", key: "railway", label: "railway", scene: "Tamil Nadu railway station platform with train arriving, commuters only as distant silhouettes, no readable signs", patterns: [/rail|train|station|ரயில்|இரயில்|நிலையம்/i] },
  { category: "transport", key: "metro", label: "metro", scene: "Chennai metro train at station platform, modern transit infrastructure, no passenger close-ups", patterns: [/metro|மெட்ரோ/i] },
  { category: "transport", key: "traffic-road", label: "traffic road", scene: "Tamil Nadu highway or city traffic infrastructure with flyover, vehicles, road work, no driver portraits", patterns: [/traffic|road|highway|flyover|சாலை|நெடுஞ்சாலை|மேம்பாலம்/i] },

  { category: "sports", key: "cricket", label: "cricket", scene: "Tamil Nadu cricket ground with bat, ball, stumps, crowd atmosphere, no recognizable athletes", patterns: [/cricket|ipl|கிரிக்கெட்/i] },
  { category: "sports", key: "football", label: "football", scene: "football stadium match action from wide angle, ball on grass, crowd atmosphere, no recognizable athletes", patterns: [/football|கால்பந்து/i] },
  { category: "sports", key: "chess", label: "chess", scene: "chess tournament hall with boards and clocks, players only as distant silhouettes, no faces", patterns: [/chess|சதுரங்கம்/i] },
  { category: "sports", key: "run-marathon", label: "run event", scene: "public running event on Tamil Nadu city road with runners from behind, sports atmosphere, no recognizable athletes", patterns: [/run|marathon|race|ஓட்டம்|ரன்/i] },
  { category: "sports", key: "match", label: "sports match", scene: "Tamil Nadu stadium match action, sports equipment, crowd atmosphere, no recognizable athletes", patterns: [/match|tournament|game|போட்டி|விளையாட்டு/i] },

  { category: "accident", key: "road-accident", label: "road accident", scene: "Tamil Nadu road accident response scene with ambulance, traffic cones, police vehicles, no victims visible", patterns: [/road accident|crash|collision|lorry|truck|சாலை விபத்து|மோதல்|லாரி/i] },
  { category: "accident", key: "industrial-accident", label: "industrial accident", scene: "factory emergency response with safety barriers and fire service vehicles, no victims visible", patterns: [/ammonia|gas leak|factory|industrial|boiler|அமோனியா|வாயு|தொழிற்சாலை/i] },
  { category: "accident", key: "fire-accident", label: "fire accident", scene: "fire service vehicles responding to a building incident in Tamil Nadu, smoke in distance, no victims visible", patterns: [/fire|blaze|தீ/i] },
  { category: "accident", key: "emergency-response", label: "emergency response", scene: "emergency response scene with ambulance, safety cones, rescue equipment, no injured people or faces", patterns: [/death|drown|rescue|பலியான|மரணம்|மீட்பு/i] },

  { category: "agriculture", key: "crop-field", label: "crop field", scene: "Tamil Nadu paddy fields, irrigation channels, crop rows, farming tools, workers only as distant silhouettes", patterns: [/crop|paddy|harvest|field|பயிர்|நெல்|அறுவடை|வயல்/i] },
  { category: "agriculture", key: "farm-market", label: "farm market", scene: "Tamil Nadu agricultural market with produce crates and wholesale activity, no close-up faces", patterns: [/market|price|vegetable|சந்தை|விலை|காய்கறி/i] },
  { category: "agriculture", key: "irrigation", label: "irrigation", scene: "Tamil Nadu farmland irrigation channel, water pump, crop rows, realistic rural news photo", patterns: [/water|irrigation|dam|நீர்|பாசனம்|அணை/i] },

  { category: "politics", key: "election", label: "election", scene: "Tamil Nadu polling station and election administration setup, ballots and queue from behind, no politician portraits", patterns: [/election|poll|vote|தேர்தல்|வாக்கு/i] },
  { category: "politics", key: "assembly", label: "assembly", scene: "Tamil Nadu legislative assembly session atmosphere from wide angle, desks and microphones, no recognizable faces", patterns: [/assembly|bill|சட்டமன்றம்|மசோதா/i] },
  { category: "politics", key: "public-meeting", label: "public meeting", scene: "public meeting stage in Tamil Nadu with podium and distant crowd from behind, no politician portraits", patterns: [/meeting|rally|campaign|கூட்டம்|பேரணி|பிரசாரம்/i] },

  { category: "local", key: "market-street", label: "market street", scene: "Tamil Nadu district market street with shops, vehicles, local public activity, no random close-up faces", patterns: [/market|street|shop|சந்தை|தெரு|கடை/i] },
  { category: "local", key: "civic-issue", label: "civic issue", scene: "Tamil Nadu neighborhood civic scene with road, public buildings, service vehicles, community activity from wide angle", patterns: [/road|water|drainage|civic|சாலை|குடிநீர்|வடிகால்/i] },
];

function detectTopic(category: string, text: string): { key: string; label: string; scene: string } {
  const cat = categorySlug(category);
  for (const rule of TOPIC_RULES) {
    if (rule.category && rule.category !== cat) continue;
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return { key: rule.key, label: rule.label, scene: rule.scene };
    }
  }
  if (cat === "local") {
    for (const rule of TOPIC_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(text))) {
        return { key: rule.key, label: rule.label, scene: rule.scene };
      }
    }
  }

  const defaults: Record<string, { key: string; label: string; scene: string }> = {
    politics: { key: "policy-event", label: "policy event", scene: "government building or public policy announcement setup in Tamil Nadu, no politician portraits" },
    weather: { key: "weather-impact", label: "weather impact", scene: "Tamil Nadu weather impact on city roads, clouds, rain or sunlight, no random people" },
    agriculture: { key: "farm-news", label: "farm news", scene: "Tamil Nadu paddy fields and agricultural tools, wide rural editorial photograph" },
    business: { key: "business-news", label: "business news", scene: "Tamil Nadu factory, office complex, or industrial zone, no businessman faces" },
    education: { key: "education-news", label: "education news", scene: "Tamil Nadu school or college campus with classroom atmosphere, no teacher portraits" },
    accident: { key: "safety-response", label: "safety response", scene: "Tamil Nadu emergency response with ambulance and safety barriers, no victims visible" },
    crime: { key: "crime-investigation", label: "crime investigation", scene: "Tamil Nadu police vehicles and investigation scene, no victim or accused faces" },
    government: { key: "public-service", label: "public service", scene: "Tamil Nadu government office and public service counters, no politician portraits" },
    transport: { key: "transport-service", label: "transport service", scene: "Tamil Nadu transport infrastructure with bus, train, road, or metro scene, no driver portraits" },
    sports: { key: "sports-event", label: "sports event", scene: "Tamil Nadu stadium match action and sports equipment, no recognizable athletes" },
    technology: { key: "technology-news", label: "technology news", scene: "Chennai IT park or computer lab with digital infrastructure, no logos or readable text" },
    local: { key: "local-community", label: "local community", scene: "Tamil Nadu district street, market, landmark, or public community activity from wide angle" },
  };
  return defaults[cat] || defaults.local;
}

export function getArticleTopicImage(input: ArticleTopicImageInput): { topicKey: string; prompt: string; url: string } {
  const category = input.category || "தமிழ்நாடு உள்ளூர்";
  const cat = categorySlug(category);
  const headline = compactText(input.headline || input.title || "", 140);
  const summary = compactText(input.summary || input.content || "", 180);
  const source = compactText(input.source || "", 40);
  const district = compactText(input.district || "Tamil Nadu", 50);
  const searchText = normalizeText([
    input.headline,
    input.title,
    input.summary,
    input.content,
    ...(input.keywords || []),
  ].filter(Boolean).join(" "));
  const topic = detectTopic(category, searchText);
  const topicKey = `${cat}-${topic.key}`;
  const context = compactText([headline, summary].filter(Boolean).join(". "), 220);
  const prompt = [
    "Photorealistic Tamil Nadu newspaper editorial photograph, landscape 16:9, highly detailed, realistic lighting, natural colors",
    `Topic: ${topic.label}`,
    `Location context: ${district || "Tamil Nadu"}`,
    `Scene: ${topic.scene}`,
    context ? `Article context: ${context}` : "Article context: Tamil Nadu public news event",
    source ? `Source considered: ${source}, no publisher logo` : "Regional news source context, no publisher logo",
    "No text in image, no watermark, no logo, no poster design, no readable signage",
    "Negative prompt: no close-up face, no portrait, no selfie, no celebrity, no politician face, no floating heads, no anime, no cartoon, no illustration, no AI art style, no typography, no recognizable people",
  ].join(". ");

  return {
    topicKey,
    prompt,
    url: localAiImageUrl(prompt, { topicKey, seedSource: topicKey }),
  };
}
