import { getDbInstance } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isValidScene } from "@/lib/scenes";

export interface ArticleAnalysis {
  category: string;
  keywords: string[];
  location: string;
  scene: string;
  summary: string;
}

export interface TtsNarrationInput {
  title: string;
  summary: string;
  content: string;
}

const FALLBACK_CATEGORIES = [
  "தமிழ்நாடு அரசியல்",
  "தமிழ்நாடு அரசு",
  "தமிழ்நாடு கல்வி",
  "தமிழ்நாடு வணிகம்",
  "தமிழ்நாடு தொழில்நுட்பம்",
  "தமிழ்நாடு விளையாட்டு",
  "தமிழ்நாடு விபத்து",
  "தமிழ்நாடு குற்றம்",
  "தமிழ்நாடு வானிலை",
  "தமிழ்நாடு போக்குவரத்து",
  "தமிழ்நாடு வேளாண்மை",
  "தமிழ்நாடு உள்ளூர்",
] as const;

const GROQ_ALLOWED_CATEGORIES = [
  "agriculture",
  "business",
  "court",
  "crime",
  "education",
  "electricity",
  "environment",
  "government",
  "health",
  "infrastructure",
  "politics",
  "railway",
  "sports",
  "technology",
  "weather",
] as const;

type GroqCategory = typeof GROQ_ALLOWED_CATEGORIES[number];

const GROQ_CATEGORY_TO_PROJECT_CATEGORY: Record<string, string> = {
  agriculture: "தமிழ்நாடு வேளாண்மை",
  business: "தமிழ்நாடு வணிகம்",
  court: "தமிழ்நாடு குற்றம்",
  crime: "தமிழ்நாடு குற்றம்",
  education: "தமிழ்நாடு கல்வி",
  electricity: "தமிழ்நாடு அரசு",
  environment: "தமிழ்நாடு உள்ளூர்",
  government: "தமிழ்நாடு அரசு",
  health: "தமிழ்நாடு அரசு",
  infrastructure: "தமிழ்நாடு போக்குவரத்து",
  politics: "தமிழ்நாடு அரசியல்",
  railway: "தமிழ்நாடு போக்குவரத்து",
  sports: "தமிழ்நாடு விளையாட்டு",
  technology: "தமிழ்நாடு தொழில்நுட்பம்",
  weather: "தமிழ்நாடு வானிலை",
  accident: "தமிழ்நாடு விபத்து",
  "தமிழ்நாடு அரசியல்": "தமிழ்நாடு அரசியல்",
  "தமிழ்நாடு அரசு": "தமிழ்நாடு அரசு",
  "தமிழ்நாடு கல்வி": "தமிழ்நாடு கல்வி",
  "தமிழ்நாடு வணிகம்": "தமிழ்நாடு வணிகம்",
  "தமிழ்நாடு தொழில்நுட்பம்": "தமிழ்நாடு தொழில்நுட்பம்",
  "தமிழ்நாடு விளையாட்டு": "தமிழ்நாடு விளையாட்டு",
  "தமிழ்நாடு விபத்து": "தமிழ்நாடு விபத்து",
  "தமிழ்நாடு குற்றம்": "தமிழ்நாடு குற்றம்",
  "தமிழ்நாடு வானிலை": "தமிழ்நாடு வானிலை",
  "தமிழ்நாடு போக்குவரத்து": "தமிழ்நாடு போக்குவரத்து",
  "தமிழ்நாடு வேளாண்மை": "தமிழ்நாடு வேளாண்மை",
  "தமிழ்நாடு உள்ளூர்": "தமிழ்நாடு உள்ளூர்",
};

const PROJECT_CATEGORY_TO_GROQ_CATEGORY: Record<string, GroqCategory> = {
  "தமிழ்நாடு அரசியல்": "politics",
  "தமிழ்நாடு அரசு": "government",
  "தமிழ்நாடு கல்வி": "education",
  "தமிழ்நாடு வணிகம்": "business",
  "தமிழ்நாடு தொழில்நுட்பம்": "technology",
  "தமிழ்நாடு விளையாட்டு": "sports",
  "தமிழ்நாடு விபத்து": "infrastructure",
  "தமிழ்நாடு குற்றம்": "crime",
  "தமிழ்நாடு வானிலை": "weather",
  "தமிழ்நாடு போக்குவரத்து": "infrastructure",
  "தமிழ்நாடு வேளாண்மை": "agriculture",
  "தமிழ்நாடு உள்ளூர்": "government",
};

const SYSTEM_PROMPT = `You are a Tamil Nadu news analyst. Analyze the given news article and return ONLY valid JSON with these fields:

{
  "category": "one of: agriculture, business, court, crime, education, electricity, environment, government, health, infrastructure, politics, railway, sports, technology, weather",
  "keywords": ["array of 3-7 important keywords from the article, mix English and Tamil"],
  "location": "main location (Tamil Nadu city/district, or empty string if unknown)",
  "scene": "ONE of the predefined visual scene types from the Tamil Nadu news scene library. Choose the BEST match for this article",
  "summary": "concise 1-2 sentence summary of the article in English"
}

Select the scene from this list. Return the EXACT scene name:
Politics, Government, Press Conference, Election, Temple, Festival, Chennai City, Coimbatore, Madurai, Rain, Flood, Cyclone, Heatwave, Agriculture, Farmer, Education, School, Exam, Health, Doctor, Technology, Artificial Intelligence, Startup, Business, Stock Market, Banking, Crime, Court, Corruption, Arrest, Electricity, Power Cut, Metro, Railway, Bridge, Highway, Airport, Bus Transport, Traffic, Protest, Rally, Cricket, Football, Chess, Kabaddi, Tourism, Environment, Wildlife, Industrial Accident, Fire Accident, Road Accident, Water Supply, Industry, Fishing, Port, Default

Rules:
- CRITICAL TAGGING RULES:
- Read the complete article before classifying.
- Do NOT classify based only on keywords.
- Return EXACTLY ONE category from the allowed list.
- Allowed categories ONLY: agriculture, business, court, crime, education, electricity, environment, government, health, infrastructure, politics, railway, sports, technology, weather.
- Never invent new categories.
- Never return multiple categories.
- Never return an empty category.
- Always choose the article's PRIMARY topic.
- Factory accident is NOT crime. Choose business, unless the main story is medical treatment or public health.
- Road accident is NOT crime. Choose infrastructure, unless the main story is medical treatment.
- Building collapse is NOT crime. Choose infrastructure.
- Bridge collapse -> infrastructure.
- Hospital news -> health.
- Flood -> weather.
- Heavy rain -> weather.
- Cyclone -> weather.
- Pollution -> environment.
- Climate change -> environment.
- Electricity outage -> electricity.
- Government announcement -> government.
- Election -> politics.
- Court judgment -> court.
- Railway incident -> railway.
- Agriculture news -> agriculture.
- Company news -> business.
- Technology launch -> technology.
- Sports event -> sports.
- Crime ONLY for intentional illegal acts such as murder, theft, robbery, fraud, corruption, assault, kidnapping, smuggling, or cybercrime.
- Pick EXACTLY ONE primary scene. Never combine multiple scenes.
- "MK Stalin announces scheme" → scene: Government (not Politics)
- "CM inaugurates new building" → scene: Government
- "Assembly passes bill" → scene: Politics
- "Rain in Chennai" → scene: Rain
- "Cyclone approaching" → scene: Cyclone
- "Road accident" → scene: Road Accident
- "Factory ammonia leak" → scene: Industrial Accident
- "Fire in building" → scene: Fire Accident
- "Electricity tariff hike" → scene: Electricity
- "Power cut in city" → scene: Power Cut
- "Metro rail project" → scene: Metro
- "Train service" → scene: Railway
- "Temple festival" → scene: Festival (not Temple)
- "Temple opening" → scene: Temple
- "Stock market crash" → scene: Stock Market
- "AI / ChatGPT" → scene: Artificial Intelligence
- "IT company" → scene: Technology
- "Startup funding" → scene: Startup
- "Bank loan" → scene: Banking
- "Doctor arrested" → scene: Arrest (not Doctor)
- "School exam results" → scene: Exam
- "Wildlife in forest" → scene: Wildlife
- If uncertain, choose the closest match from the list above
- Extract 3-7 keywords mixing English and Tamil terms from the article
- Return ONLY valid JSON, no other text or markdown`;

const TTS_NARRATION_PROMPT = `நீங்கள் தொழில்முறை தமிழ் செய்தி வாசிப்பாளர்.

கொடுக்கப்பட்ட செய்தியிலிருந்து முழுமையான தமிழ் ஒலி வாசிப்பு உரையை மட்டும் உருவாக்கவும்.

கட்டாய விதிகள்:
- கட்டுரையின் தொடக்கம், நடுப்பகுதி, இறுதி தகவல் ஆகியவை காக்கப்பட வேண்டும்.
- 95 முதல் 100 தமிழ் சொற்கள் மட்டும் இருக்க வேண்டும்.
- 40 முதல் 45 விநாடி பேச்சு நீளத்திற்கு ஏற்றதாக இருக்க வேண்டும்.
- இயல்பான, தொழில்முறை செய்தி வாசிப்பு நடை.
- வணக்கம் வேண்டாம்.
- அறிமுகம் வேண்டாம்.
- "இப்போது", "இதோ", "இந்த செய்தி" போன்ற அறிமுக தொடக்கங்கள் வேண்டாம்.
- தனி முடிவு உரை, முடிவு வாழ்த்து, கருத்துரை வேண்டாம்.
- நிரப்பு சொற்கள் வேண்டாம்.
- ஒரே வாக்கியம் மீண்டும் வரக்கூடாது.
- பாதியில் நிற்கும் வாக்கியம் இருக்கக்கூடாது.
- வெளியீடு முழுவதும் தமிழ் செய்தி வாசிப்பு உரை மட்டுமே.
- வேறு விளக்கம், தலைப்பு, குறிப்பு, Markdown எதுவும் வேண்டாம்.`;

function isValidCategory(cat: string): boolean {
  return FALLBACK_CATEGORIES.includes(cat as typeof FALLBACK_CATEGORIES[number]);
}

function normalizeCanonicalCategory(value: unknown): GroqCategory | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return GROQ_ALLOWED_CATEGORIES.includes(normalized as GroqCategory) ? normalized as GroqCategory : null;
}

function normalizeTextForRules(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\sஅ-௯]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryByRules(text: string): GroqCategory | null {
  const normalized = normalizeTextForRules(text);

  if (/\b(flood|heavy rain|rain alert|cyclone|storm|weather|monsoon)\b|வெள்ளம்|கனமழை|மழை|புயல்|வானிலை/u.test(normalized)) return "weather";
  if (/\b(pollution|climate change|environment|waste dumping|sewage)\b|மாசு|சுற்றுச்சூழல்|கழிவு/u.test(normalized)) return "environment";
  if (/\b(bridge collapse|building collapse|road accident|road crash|traffic accident|highway accident|flyover|bridge|infrastructure)\b|பாலம் இடிந்து|கட்டிடம் இடிந்து|சாலை விபத்து|நெடுஞ்சாலை|மேம்பாலம்/u.test(normalized)) return "infrastructure";
  if (/\b(railway|railroad|train|metro rail|rail incident|railway station)\b|ரயில்|இரயில்|தொடருந்து/u.test(normalized)) return "railway";
  if (/\b(factory accident|industrial accident|industrial explosion|gas leak|ammonia leak|boiler blast|plant accident)\b|தொழிற்சாலை விபத்து|வாயு கசிவு|அமோனியா|வெடிப்பு/u.test(normalized)) return "business";
  if (/\b(court verdict|court judgment|court order|high court|supreme court|judge|judgment|verdict)\b|நீதிமன்றம்|தீர்ப்பு|நீதிபதி/u.test(normalized)) return "court";
  if (/\b(murder|homicide|theft|robbery|fraud|corruption|assault|kidnapping|smuggling|cybercrime|arrested for)\b|கொலை|திருட்டு|கொள்ளை|மோசடி|ஊழல்|தாக்குதல்|கடத்தல்|கள்ளக்கடத்தல்/u.test(normalized)) return "crime";
  if (/\b(hospital|doctor|medical college|public health|health department|clinic|patient)\b|மருத்துவமனை|மருத்துவர்|சுகாதாரம்|நோயாளி/u.test(normalized)) return "health";
  if (/\b(election|poll|vote|candidate|constituency|campaign)\b|தேர்தல்|வாக்கு|வேட்பாளர்|தொகுதி|பிரசாரம்/u.test(normalized)) return "politics";
  if (/\b(power cut|electricity|tangedco|tneb|tariff|substation|power outage)\b|மின்சாரம்|மின் தடை|மின்வாரியம்|மின் கட்டணம்/u.test(normalized)) return "electricity";
  if (/\b(government announcement|government order|govt order|scheme|subsidy|minister announces|chief minister announces)\b|அரசு அறிவிப்பு|அரசாணை|அரசு திட்டம்|திட்டம்|மானியம்|அமைச்சர் அறிவித்த|முதல்வர் அறிவித்த/u.test(normalized)) return "government";
  if (/\b(agriculture|farmer|crop|paddy|irrigation|fertilizer|harvest)\b|வேளாண்மை|விவசாய|விவசாயி|பயிர்|நெல்|நீர்ப்பாசனம்/u.test(normalized)) return "agriculture";
  if (/\b(technology|artificial intelligence|startup|software|digital|app launch|internet|cyber security)\b|தொழில்நுட்பம்|செயற்கை நுண்ணறிவு|மென்பொருள்|டிஜிட்டல்/u.test(normalized)) return "technology";
  if (/\b(sports|cricket|football|kabaddi|chess|match|tournament|athlete|player)\b|விளையாட்டு|கிரிக்கெட்|கால்பந்து|கபடி|சதுரங்கம்|போட்டி/u.test(normalized)) return "sports";
  if (/\b(school|college|university|exam|result|student|teacher|education)\b|பள்ளி|கல்லூரி|பல்கலைக்கழகம்|தேர்வு|மாணவர்|கல்வி/u.test(normalized)) return "education";
  if (/\b(company|market|stock|bank|business|industry|investment|factory|trade|gst|tax)\b|வணிகம்|தொழில்|சந்தை|முதலீடு|நிறுவனம்|வரி/u.test(normalized)) return "business";

  return null;
}

function normalizeAnalysisCategory(value: unknown, fallbackCategory: string, sourceText = ""): GroqCategory {
  return categoryByRules(sourceText)
    || normalizeCanonicalCategory(value)
    || normalizeCanonicalCategory(fallbackCategory)
    || PROJECT_CATEGORY_TO_GROQ_CATEGORY[fallbackCategory]
    || "government";
}

function projectCategoryFor(value: string): string {
  if (isValidCategory(value)) return value;
  const canonical = normalizeCanonicalCategory(value);
  const mapped = canonical ? GROQ_CATEGORY_TO_PROJECT_CATEGORY[canonical] : GROQ_CATEGORY_TO_PROJECT_CATEGORY[value.trim().toLowerCase()];
  return mapped && isValidCategory(mapped) ? mapped : "தமிழ்நாடு உள்ளூர்";
}

function parseAnalysis(raw: string, fallbackCategory: string, sourceText = ""): ArticleAnalysis {
  try {
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const category = normalizeAnalysisCategory(parsed.category, fallbackCategory, sourceText);
    const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.filter((k: unknown) => typeof k === "string" && k.length > 0) : [];
    const location = typeof parsed.location === "string" ? parsed.location : "";
    const scene = typeof parsed.scene === "string" && isValidScene(parsed.scene) ? parsed.scene : "Default";
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";

    return { category, keywords, location, scene, summary };
  } catch {
    return { category: normalizeAnalysisCategory(null, fallbackCategory, sourceText), keywords: [], location: "", scene: "Default", summary: "" };
  }
}

export async function analyzeWithGroq(
  title: string,
  summary: string,
  content: string,
  fallbackCategory: string,
): Promise<ArticleAnalysis | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn("Groq", "GROQ_API_KEY not set, skipping analysis");
    return null;
  }

  try {
    const text = `Title: ${title}\nSummary: ${summary}\nContent: ${(content || summary || "").slice(0, 2000)}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      logger.error("Groq", "API error", { status: response.status, statusText: response.statusText });
      return null;
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      logger.error("Groq", "Empty response");
      return null;
    }

    return parseAnalysis(raw, fallbackCategory, `${title} ${summary} ${content}`);
  } catch (err) {
    logger.error("Groq", "Analysis failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

function normalizeNarration(value: string): string {
  return value
    .replace(/```(?:tamil|text)?/gi, "")
    .replace(/```/g, "")
    .replace(/^\s*["“]|["”]\s*$/g, "")
    .replace(/^(?:வணக்கம்|இப்போது|இதோ|இந்த செய்தி|செய்தி வாசிப்பு|குரல் செய்தி)[\s,.:;!।-]+/iu, "")
    .replace(/(?:இதுவே இந்த செய்தியின் முக்கிய அம்சம்|மேலும் விவரங்களுக்கு தொடர்ந்து இணைந்திருங்கள்|இத்துடன் செய்தி முடிகிறது|நன்றி)\.?$/iu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceParts(value: string): string[] {
  return normalizeNarration(value)
    .split(/(?<=[.!?।]|[.?!])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function wordCount(value: string): number {
  return normalizeNarration(value).split(/\s+/).filter(Boolean).length;
}

function words(value: string): string[] {
  return normalizeNarration(value).split(/\s+/).filter(Boolean);
}

function removeRepeatedSentences(value: string): string {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const sentence of sentenceParts(value)) {
    const key = sentence.toLowerCase().replace(/[^\wஅ-௯]/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(sentence);
  }

  return unique.length > 0 ? unique.join(" ") : normalizeNarration(value);
}

function wordExcerpt(value: string, minWords = 95, maxWords = 100): string {
  const allWords = words(removeRepeatedSentences(value));
  if (allWords.length <= maxWords) return allWords.join(" ");

  const target = Math.min(maxWords, Math.max(minWords, 98));
  const startCount = 36;
  const middleCount = 30;
  const endCount = target - startCount - middleCount;
  const middleStart = Math.max(startCount, Math.floor((allWords.length - middleCount) / 2));
  const endStart = Math.max(middleStart + middleCount, allWords.length - endCount);

  if (middleStart + middleCount >= endStart) {
    return allWords.slice(0, maxWords).join(" ");
  }

  return [
    ...allWords.slice(0, startCount),
    ...allWords.slice(middleStart, middleStart + middleCount),
    ...allWords.slice(endStart),
  ].slice(0, maxWords).join(" ");
}

function boundedNarration(value: string, fallback = ""): string {
  const deduped = removeRepeatedSentences(normalizeNarration(value));
  const count = wordCount(deduped);
  if (count >= 95 && count <= 100) return deduped;
  if (count < 95 && fallback) {
    const fallbackNarration = wordExcerpt(fallback);
    const fallbackCount = wordCount(fallbackNarration);
    if (fallbackCount >= 95 && fallbackCount <= 100) return fallbackNarration;
  }
  if (count <= 100) return deduped;

  const selected: string[] = [];
  for (const sentence of sentenceParts(deduped)) {
    const candidate = [...selected, sentence].join(" ");
    if (wordCount(candidate) > 100) break;
    selected.push(sentence);
  }

  const trimmed = selected.length > 0 ? selected.join(" ") : wordExcerpt(deduped);
  return wordCount(trimmed) >= 95 ? trimmed : wordExcerpt(deduped);
}

function fallbackTamilNarration(input: TtsNarrationInput): string {
  const text = normalizeNarration([input.title, input.summary, input.content].filter(Boolean).join(". "));
  const sentences = sentenceParts(removeRepeatedSentences(text));
  const selected: string[] = [];

  for (const sentence of sentences) {
    const candidate = [...selected, sentence].join(" ");
    if (wordCount(candidate) > 100) break;
    selected.push(sentence);
    if (wordCount(candidate) >= 95) break;
  }

  const narration = selected.length > 0 ? selected.join(" ") : text;
  return boundedNarration(narration || input.title, text);
}

export async function generateTamilTtsNarration(input: TtsNarrationInput): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const fallback = fallbackTamilNarration(input);
  if (!apiKey) return fallback;

  try {
    const text = `தலைப்பு: ${input.title}\nசுருக்கம்: ${input.summary}\nமுழு செய்தி: ${(input.content || input.summary || input.title).slice(0, 4500)}`;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: TTS_NARRATION_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.2,
        max_tokens: 420,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      logger.error("Groq", "TTS narration API error", { status: response.status, statusText: response.statusText });
      return fallback;
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const narration = data.choices?.[0]?.message?.content;
    return narration ? boundedNarration(narration, fallback) : fallback;
  } catch (err) {
    logger.error("Groq", "TTS narration failed", { error: err instanceof Error ? err.message : String(err) });
    return fallback;
  }
}

interface PendingAnalysisArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
}

export function getArticlesPendingAnalysis(): PendingAnalysisArticle[] {
  try {
    const db = getDbInstance();
    return db.prepare(`
      SELECT id, title, summary, content, category
      FROM articles
      WHERE (ai_image_prompt IS NULL OR ai_image_prompt = '')
        AND retention != 'archived'
      ORDER BY published_at DESC
      LIMIT 5
    `).all() as PendingAnalysisArticle[];
  } catch {
    return [];
  }
}

export function updateArticleAnalysis(
  id: string,
  analysis: ArticleAnalysis,
): void {
  try {
    const db = getDbInstance();
    const keywords = analysis.keywords.join(", ");
    const projectCategory = projectCategoryFor(analysis.category);
    db.prepare(`
      UPDATE articles
      SET category = ?,
          district = ?,
          ai_image_prompt = ?,
          search_keywords = ?
      WHERE id = ?
    `).run(projectCategory, analysis.location, analysis.scene, keywords, id);
    logger.info("Groq", `Analysis stored for article ${id}`, { category: analysis.category, storedCategory: projectCategory, location: analysis.location, scene: analysis.scene });
  } catch (err) {
    logger.error("Groq", "DB update error", { error: err instanceof Error ? err.message : String(err) });
  }
}
