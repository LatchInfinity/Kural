export type NewsTextLanguage = "ta" | "en";

export interface NewsTextInput {
  title?: string;
  headline?: string;
  englishHeadline?: string;
  summary?: string;
  tamilSummary?: string;
  englishSummary?: string;
  content?: string;
  category?: string;
}

const TAMIL_RE = /[\u0B80-\u0BFF]/;
const SPEECH_TEXT_LIMITS: Record<NewsTextLanguage, number> = {
  ta: 560,
  en: 680,
};

const BOILERPLATE_MARKERS: RegExp[] = [
  /\b(?:Advertisement|Advertise with us|Newsletter|WhatsApp|Facebook|Twitter|Instagram|YouTube|Youtube|Telegram|Threads|Arattai|Google News|Podcast|White Paper|News and Views|Valaipechu|Updated On|Published On|Follow us|Share this|Read more|Also Read|Related News|E-Paper|Summary)\b/i,
  /(?:விளம்பரம்|விளம்பரங்கள்|விளம்பர|வாட்ஸ்அப்|ஃபேஸ்புக்|ட்விட்டர்|இன்ஸ்டாகிராம்|யூடியூப்|டெலிகிராம்|தினமணியை|தினமணி செய்திமடலைப் பெற|செய்திமடலைப் பெற|தமிழ் செய்தி மடல்|இ-பேப்பர்|முகப்பு தற்போதைய செய்திகள்|தற்போதைய செய்திகள் திரை|லைஃப்ஸ்டைல் ஜோதிடம்|இந்தியா உலகம் முகப்பு|செய்திகளை அறிய|மேலும் படிக்க|இணையதள செய்திப் பிரிவு|செய்திப் பிரிவு|புதுப்பிக்கப்பட்டது|தொடர்புடைய செய்திகள்)/,
];

const EXPLICIT_CUT_MARKERS: RegExp[] = [
  /\b(?:Advertisement|Advertise with us|Newsletter|Updated On|Published On|E-Paper|Summary)\b/i,
  /(?:விளம்பரம்|புதுப்பிக்கப்பட்டது|தினமணி செய்திமடலைப் பெற|செய்திமடலைப் பெற|தமிழ் செய்தி மடல்|இ-பேப்பர்|முகப்பு தற்போதைய செய்திகள்|இணையதள செய்திப் பிரிவு)/,
];

const ARTICLE_BODY_START_MARKERS: RegExp[] = [
  /இணையதள(?:ச்)?\s*செய்திப்\s+பிரிவு/u,
  /\b(?:Online Desk|Web Desk|Digital Desk|Express News Service|PTI|ANI|IANS)\b/i,
];

const ENGLISH_CATEGORY_LABELS: Record<string, string> = {
  "தமிழ்நாடு அரசியல்": "politics",
  "தமிழ்நாடு அரசு": "government",
  "தமிழ்நாடு கல்வி": "education",
  "தமிழ்நாடு வணிகம்": "business",
  "தமிழ்நாடு தொழில்நுட்பம்": "technology",
  "தமிழ்நாடு விளையாட்டு": "sports",
  "தமிழ்நாடு விபத்து": "accident",
  "தமிழ்நாடு குற்றம்": "crime",
  "தமிழ்நாடு வானிலை": "weather",
  "தமிழ்நாடு போக்குவரத்து": "transport",
  "தமிழ்நாடு வேளாண்மை": "agriculture",
  "தமிழ்நாடு உள்ளூர்": "local",
};

const ENGLISH_TOPIC_HINTS: [RegExp, string][] = [
  [/முதல்வர்|அமைச்சர்|அரசு|சட்டப்பேரவை|ஆளுநர்|government|minister|assembly/i, "government"],
  [/தேர்தல்|வாக்கு|கட்சி|அரசியல்|election|party|politics/i, "politics"],
  [/பள்ளி|கல்லூரி|மாணவர்|மாணவி|கல்வி|தேர்வு|neet|நீட்|education|exam|college|school/i, "education"],
  [/மழை|வானிலை|புயல்|வெள்ளம்|weather|rain|cyclone|flood/i, "weather"],
  [/மெட்ரோ|ரயில்|பேருந்து|சாலை|போக்குவரத்து|metro|rail|bus|road|transport/i, "transport"],
  [/விபத்து|வாயு கசிவு|அமோனியா|தீ விபத்து|வெடிப்பு|உயிரிழப்பு|உயிரிழந்த|பலி|accident|gas leak|ammonia|explosion|fatal/i, "accident"],
  [/கைது|குற்றம்|கொலை|திருட்டு|கொள்ளை|மோசடி|நீதிமன்றம்|வழக்கு|arrest|crime|murder|theft|robbery|fraud|court/i, "crime"],
  [/விவசாய|விவசாயி|பயிர்|வேளாண்மை|farmer|agriculture|crop/i, "agriculture"],
  [/வணிக|தொழில்|முதலீடு|வரி|business|industry|investment|market/i, "business"],
  [/தொழில்நுட்ப|செயற்கை நுண்ணறிவு|இணைய|technology|digital|ai|startup/i, "technology"],
  [/விளையாட்டு|கிரிக்கெட்|football|cricket|sports|match/i, "sports"],
  [/சுகாதாரம்|மருத்துவ|மருத்துவமனை|health|hospital|doctor/i, "health"],
];

const IMPORTANT_PHRASES: [RegExp, string][] = [
  [/தமிழ்த்தாய் வாழ்த்து/i, "Tamil Thai Valthu"],
  [/சட்டப்பேரவை/i, "Legislative Assembly"],
  [/முதல்வர்/i, "Chief Minister"],
  [/தமிழ்நாடு அரசு|தமிழக அரசு/i, "Tamil Nadu government"],
  [/நீட்/i, "NEET"],
  [/தற்கொலை/i, "suicide"],
  [/இரு பாலர்/i, "co-educational status"],
  [/கல்லூரி/i, "college"],
  [/மாணவி/i, "female student"],
  [/மாணவர்/i, "student"],
  [/மெட்ரோ/i, "Metro"],
  [/மழை/i, "rain"],
  [/வானிலை/i, "weather"],
  [/கைது/i, "arrest"],
  [/நீதிமன்றம்/i, "court"],
  [/முதலீடு/i, "investment"],
];

const TAMIL_DIRECT_TRANSLATIONS: [RegExp, string][] = [
  [/தமிழகத்தில்|தமிழ்நாட்டில்/gu, "in Tamil Nadu"],
  [/தமிழகத்தின்|தமிழ்நாட்டின்/gu, "Tamil Nadu's"],
  [/தமிழ்நாடு|தமிழகம்|தமிழக/gu, "Tamil Nadu"],
  [/சென்னையில்|சென்னை/gu, "Chennai"],
  [/கோயம்புத்தூர்|கோவை/gu, "Coimbatore"],
  [/மதுரையில்|மதுரை/gu, "Madurai"],
  [/திருச்சியில்|திருச்சி/gu, "Tiruchirappalli"],
  [/சேலத்தில்|சேலம்/gu, "Salem"],
  [/திருநெல்வேலியில்|திருநெல்வேலி/gu, "Tirunelveli"],
  [/ஈரோட்டில்|ஈரோடு/gu, "Erode"],
  [/முதல்வர்|முதலமைச்சர்/gu, "Chief Minister"],
  [/அமைச்சர்/gu, "Minister"],
  [/அரசு/gu, "government"],
  [/மத்திய/gu, "central"],
  [/புதிய/gu, "new"],
  [/தொழில் கொள்கை/gu, "industrial policy"],
  [/தொழில்/gu, "industry"],
  [/கொள்கை/gu, "policy"],
  [/அறிவிப்பு|அறிவித்துள்ளது|அறிவித்தார்|அறிவிக்கப்பட்டுள்ளது/gu, "announced"],
  [/தொடக்கம்|தொடங்கப்பட்டுள்ளது|தொடங்குகிறது/gu, "launched"],
  [/திட்டம்/gu, "project"],
  [/வேலை வாய்ப்புகள்|வேலைவாய்ப்புகள்/gu, "jobs"],
  [/உருவாகும்/gu, "will be created"],
  [/எதிர்பார்க்கப்படுகிறது/gu, "is expected"],
  [/முதலீட்டாளர்கள்|முதலீட்டாளர்/gu, "investors"],
  [/சலுகைகள்/gu, "benefits"],
  [/மெட்ரோ ரயில்|மெட்ரோ/gu, "Metro rail"],
  [/ரயில்/gu, "rail"],
  [/போக்குவரத்து/gu, "transport"],
  [/புறநகர் பகுதிகள்|புறநகர்/gu, "suburban areas"],
  [/மின் உற்பத்தியில்/gu, "in power generation"],
  [/மின் உற்பத்தி|மின்சாரம்/gu, "power generation"],
  [/பசுமை எரிசக்தி/gu, "green energy"],
  [/காற்றாலை/gu, "wind power"],
  [/சூரிய சக்தி/gu, "solar power"],
  [/சாதனை/gu, "record"],
  [/சர்வதேச விமான நிலையம்/gu, "international airport"],
  [/விமான நிலையம்/gu, "airport"],
  [/விரிவாக்கம்|விரிவாக்க/gu, "expansion"],
  [/பணிகள்/gu, "work"],
  [/விரைவில்/gu, "soon"],
  [/முனையம்/gu, "terminal"],
  [/ஓடுபாதை/gu, "runway"],
  [/நிறைவடையும்/gu, "will be completed"],
  [/பல்கலைக்கழகம்/gu, "university"],
  [/ஆராய்ச்சி மையம்/gu, "research center"],
  [/செயற்கை நுண்ணறிவில்/gu, "in artificial intelligence"],
  [/செயற்கை நுண்ணறிவு/gu, "artificial intelligence"],
  [/நிதி ஒதுக்கியுள்ளது|நிதி ஒதுக்கப்பட்டுள்ளது|ஒதுக்கீடு/gu, "funding allocated"],
  [/பருவமழை/gu, "monsoon"],
  [/மழை/gu, "rain"],
  [/கனமழை/gu, "heavy rain"],
  [/எச்சரிக்கை/gu, "alert"],
  [/வெள்ள பாதிப்பு/gu, "flood-affected"],
  [/நிவாரண பணிகள்/gu, "relief work"],
  [/பொருளாதார உச்சி மாநாடு/gu, "economic summit"],
  [/ஒப்பந்தங்கள்/gu, "agreements"],
  [/கையெழுத்தாகின/gu, "signed"],
  [/உலக தமிழ் மாநாடு/gu, "World Tamil Conference"],
  [/தமிழ் அறிஞர்கள்/gu, "Tamil scholars"],
  [/மொழி வளர்ச்சி/gu, "language development"],
  [/சென்னை சூப்பர் கிங்ஸ்/gu, "Chennai Super Kings"],
  [/ஐபிஎல்/gu, "IPL"],
  [/பிளேஆஃப்|இறுதிச்சுற்று/gu, "playoffs"],
  [/இறுதிப்போட்டி/gu, "final"],
  [/முன்னேற்றம்|முன்னேறியது/gu, "advanced"],
  [/5ஜி சேவை/gu, "5G service"],
  [/சேவை/gu, "service"],
  [/நகரங்கள்/gu, "cities"],
  [/கிராமப்புறங்கள்/gu, "rural areas"],
  [/தொலைத்தொடர்பு நிறுவனங்கள்/gu, "telecom companies"],
  [/கோயில்|கோவில்/gu, "temple"],
  [/தேரோட்டம்/gu, "chariot festival"],
  [/பக்தர்கள்/gu, "devotees"],
  [/பாதுகாப்பு ஏற்பாடுகள்/gu, "security arrangements"],
  [/எண்ணெய் விலை/gu, "oil prices"],
  [/சரிவு/gu, "drop"],
  [/இந்தியாவுக்கு நல்ல செய்தி/gu, "good news for India"],
  [/பெட்ரோல்|டீசல்/gu, "petrol and diesel"],
  [/கடற்கரை/gu, "beach"],
  [/சுற்றுலா/gu, "tourism"],
  [/மேம்பாட்டு/gu, "development"],
  [/நடைபாதை/gu, "walkway"],
  [/விளையாட்டு மைதானம்/gu, "playground"],
  [/கலாச்சார மையம்/gu, "cultural center"],
  [/உலக தரவரிசை/gu, "global ranking"],
  [/முன்னணி/gu, "leading"],
  [/பள்ளி மாணவர்கள்|மாணவர்கள்/gu, "students"],
  [/இலவச மடிக்கணினி/gu, "free laptop"],
  [/பயனடைவார்கள்/gu, "will benefit"],
  [/உலக கோப்பை கால்பந்து/gu, "Football World Cup"],
  [/இந்திய அணி/gu, "Indian team"],
  [/இரண்டாவது சுற்று/gu, "second round"],
  [/வேகமாக|தீவிரம்|தீவிரமடைந்துள்ளது/gu, "intensified"],
  [/லட்சம்/gu, "lakh"],
  [/கோடி/gu, "crore"],
  [/ரூபாய்|ரூ\./gu, "rupees"],
  [/நடைபெறும்|நடைபெற்றது|நடைபெற்ற/gu, "held"],
  [/உள்ளது|உள்ளன|இருக்கும்/gu, "is"],
  [/மூலம்/gu, "through"],
  [/மற்றும்/gu, "and"],
  [/வருகிற/gu, "upcoming"],
  [/இன்று/gu, "today"],
  [/அடுத்த ஆண்டு/gu, "next year"],
  [/இந்த ஆண்டு/gu, "this year"],
  [/மூன்றாவது கட்ட/gu, "third phase"],
  [/ஐந்தாவது முறையாக/gu, "for the fifth time"],
];

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

export function stripHtml(value: string): string {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function firstBoilerplateIndex(text: string): number {
  let index = -1;
  for (const marker of BOILERPLATE_MARKERS) {
    const match = marker.exec(text);
    if (!match || match.index < 0) continue;
    const explicit = EXPLICIT_CUT_MARKERS.some((explicitMarker) => explicitMarker.test(match[0]));
    if (!explicit && match.index < 80) continue;
    index = index === -1 ? match.index : Math.min(index, match.index);
  }
  return index;
}

function truncateAtBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength);
  const boundary = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf("!"),
    clipped.lastIndexOf("?"),
    clipped.lastIndexOf("।"),
    clipped.lastIndexOf(" "),
  );
  return `${clipped.slice(0, boundary > 120 ? boundary : maxLength).trim()}...`;
}

function extractArticleBodyFromPageDump(value: string): string {
  for (const marker of ARTICLE_BODY_START_MARKERS) {
    const match = marker.exec(value);
    if (!match || match.index < 0) continue;
    const body = value.slice(match.index + match[0].length).trim();
    if (body.length > 80) return body;
  }
  return value;
}

function lastSentenceBoundary(value: string): number {
  let index = -1;
  for (const match of value.matchAll(/[.!।](?=\s+)/g)) {
    index = match.index ?? index;
  }
  return index;
}

function trimTrailingSourceBlocks(value: string): string {
  const summaryMatch = /\bSummary\b/i.exec(value);
  if (!summaryMatch || summaryMatch.index < 120) return value;

  const beforeSummary = value.slice(0, summaryMatch.index).trim();
  const lastFullStop = lastSentenceBoundary(beforeSummary);
  const possibleRelatedHeadline = lastFullStop >= 0 ? beforeSummary.slice(lastFullStop + 1).trim() : "";

  if (
    lastFullStop > 120 &&
    possibleRelatedHeadline.length > 12 &&
    possibleRelatedHeadline.length < 260 &&
    /[?!]|(?:முதல்வர்|அமைச்சர்|விஜய்|நீட்|தேர்தல்|வழக்கு|அறிவுறுத்தல்)/.test(possibleRelatedHeadline)
  ) {
    return beforeSummary.slice(0, lastFullStop + 1).trim();
  }

  const lastSentenceEnd = Math.max(
    beforeSummary.lastIndexOf("."),
    beforeSummary.lastIndexOf("!"),
    beforeSummary.lastIndexOf("।"),
  );
  const trailing = lastSentenceEnd >= 0 ? beforeSummary.slice(lastSentenceEnd + 1).trim() : "";

  if (lastSentenceEnd > 120 && trailing.length > 12 && trailing.length < 240) {
    return beforeSummary.slice(0, lastSentenceEnd + 1).trim();
  }

  return beforeSummary;
}

function removeTamilSeoTail(value: string): string {
  if (!TAMIL_RE.test(value)) return value;
  return value
    .replace(/\s+\|?\s*[A-Za-z][A-Za-z0-9\s'’.,:()/-]{2,}\s*\|.*$/u, "")
    .replace(/\s+\|\s*[A-Za-z][A-Za-z0-9\s'’.,:()/-]{2,}$/u, "")
    .trim();
}

export function isMostlyTamil(value: string): boolean {
  return TAMIL_RE.test(value);
}

export function isLikelyBoilerplateText(value: string): boolean {
  const text = cleanNewsText(value, { maxLength: 240, preserveBoilerplateCut: true });
  return text.length < 24 || BOILERPLATE_MARKERS.some((marker) => marker.test(text));
}

export function cleanNewsText(
  value: string | null | undefined,
  options: { maxLength?: number; preserveBoilerplateCut?: boolean } = {},
): string {
  if (!value) return "";
  let text = normalizeWhitespace(stripHtml(value));
  text = extractArticleBodyFromPageDump(text);
  text = trimTrailingSourceBlocks(text);
  text = text
    .replace(/\b(?:Updated|Published)\s+(?:On|At)\s*:?.*$/i, "")
    .replace(/\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|ஜனவரி|பிப்ரவரி|மார்ச்|ஏப்ரல்|மே|ஜூன்|ஜூலை|ஆகஸ்ட்|செப்டம்பர்|அக்டோபர்|நவம்பர்|டிசம்பர்)\s+\d{4},?\s+\d{1,2}:\d{2}\s*(?:am|pm)?\s*IST\b/gi, "")
    .replace(/\b(?:Image|Photo|Video)\s+Courtesy\s*:?.*$/i, "");

  if (!options.preserveBoilerplateCut) {
    const index = firstBoilerplateIndex(text);
    if (index >= 0) text = text.slice(0, index);
  }

  text = removeTamilSeoTail(text);
  text = normalizeWhitespace(text);
  return truncateAtBoundary(text, options.maxLength ?? 1200);
}

export function cleanNewsTitle(value: string | null | undefined): string {
  return cleanNewsText(value, { maxLength: 180 })
    .replace(/\s*\|\s*.*$/g, "")
    .trim();
}

export function buildNewsSummary(summary: string | undefined, content: string | undefined, title = ""): string {
  const cleanedSummary = cleanNewsText(summary, { maxLength: 520 });
  const cleanedContent = buildNewsContent(summary, content, title, 520);

  if (cleanedSummary && cleanedSummary !== title && cleanedSummary.length >= 80) return cleanedSummary;
  if (cleanedContent && cleanedContent !== title) return cleanedContent;
  if (cleanedSummary && cleanedSummary !== title) return cleanedSummary;

  return cleanNewsText(title, { maxLength: 220 });
}

export function buildNewsContent(
  summary: string | undefined,
  content: string | undefined,
  title = "",
  maxLength = 5000,
): string {
  const cleanedContent = cleanNewsText(content, { maxLength });
  if (cleanedContent && cleanedContent !== title) return cleanedContent;

  const cleanedSummary = cleanNewsText(summary, { maxLength });
  if (cleanedSummary && cleanedSummary !== title) return cleanedSummary;

  return cleanNewsText(title, { maxLength: Math.min(maxLength, 220) });
}

function englishCategory(category?: string): string {
  if (!category) return "Tamil Nadu";
  return ENGLISH_CATEGORY_LABELS[category] || category.replace("தமிழ்நாடு ", "Tamil Nadu ");
}

function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export function getCategoryDisplayText(category: string | undefined, language: NewsTextLanguage): string {
  if (!category) return "News";
  if (language === "ta") return category.replace("தமிழ்நாடு ", "") || "செய்திகள்";
  return titleCase(englishCategory(category));
}

function extractNumbers(text: string): string[] {
  return Array.from(new Set(text.match(/(?:₹|ரூ\.?|Rs\.?)\s?[\d.,]+(?:\s?(?:கோடி|லட்சம்|crore|lakh))?|\d+(?:\.\d+)?\s?(?:கோடி|லட்சம்|crore|lakh|%|km|கி\.மீ)/gi) || [])).slice(0, 3);
}

function sentenceCase(value: string): string {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function translateTamilTextDirectly(value: string | null | undefined, maxLength: number): string {
  const source = cleanNewsText(value, { maxLength });
  if (!source || !TAMIL_RE.test(source)) return source;

  let translated = ` ${source} `;
  for (const [pattern, replacement] of TAMIL_DIRECT_TRANSLATIONS) {
    translated = translated.replace(pattern, replacement);
  }

  translated = translated
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return truncateAtBoundary(sentenceCase(translated), maxLength);
}

function isGenericEnglishSummary(value: string): boolean {
  return /^Tamil Nadu .+ update from this report\./i.test(value.trim());
}

export function buildEnglishSummary(item: NewsTextInput): string {
  const existing = cleanNewsText(item.englishSummary, { maxLength: 520 });
  if (existing && !isGenericEnglishSummary(existing)) return existing;

  const sourceText = cleanNewsText(`${item.summary || ""} ${item.tamilSummary || ""} ${item.content || ""}`, { maxLength: 900 });
  if (sourceText && !isMostlyTamil(sourceText)) return truncateAtBoundary(sourceText, 520);

  const directTranslation = translateTamilTextDirectly(sourceText || item.headline || item.title, 520);
  if (directTranslation) return directTranslation;

  const topics = Array.from(new Set(ENGLISH_TOPIC_HINTS.filter(([pattern]) => pattern.test(sourceText)).map(([, label]) => label))).slice(0, 3);
  const phrases = Array.from(new Set(IMPORTANT_PHRASES.filter(([pattern]) => pattern.test(sourceText)).map(([, label]) => label))).slice(0, 4);
  const numbers = extractNumbers(sourceText);
  const category = englishCategory(item.category);
  const topicText = topics.length > 0 ? topics.join(", ") : category;

  const details: string[] = [];
  if (phrases.length > 0) details.push(`Key references include ${phrases.join(", ")}`);
  if (numbers.length > 0) details.push(`figures mentioned include ${numbers.join(", ")}`);

  return [
    `Tamil Nadu ${topicText} update from this report.`,
    details.length > 0 ? `${details.join("; ")}.` : "Open the source for the full details.",
  ].join(" ");
}

export function getArticleDisplayText(item: NewsTextInput, language: NewsTextLanguage, maxLength = 520): string {
  if (language === "en") {
    return cleanNewsText(buildEnglishSummary(item), { maxLength });
  }

  return buildNewsSummary(item.summary || item.tamilSummary, item.content, item.headline || item.title || "");
}

function firstSentence(value: string, maxLength: number): string {
  const text = cleanNewsText(value, { maxLength: Math.max(maxLength * 2, 260) });
  if (!text) return "";

  const boundary = text.search(/[.!?।](?:\s|$)/);
  const sentence = boundary >= 40 ? text.slice(0, boundary + 1) : text;
  return truncateAtBoundary(sentence, maxLength);
}

function completeSpeechBrief(value: string, maxLength: number): string {
  const text = cleanNewsText(value, { maxLength: maxLength * 3 });
  if (text.length <= maxLength) return text;

  const sentences = Array.from(text.matchAll(/[^.!?।]+[.!?।]?/g))
    .map((match) => normalizeWhitespace(match[0]))
    .filter((sentence) => sentence.length > 0);

  let brief = "";
  for (const sentence of sentences) {
    const candidate = brief ? `${brief} ${sentence}` : sentence;
    if (candidate.length > maxLength) break;
    brief = candidate;
  }

  if (brief.length >= 90) return brief;
  return truncateAtBoundary(text, maxLength);
}

export function getArticleHeadlineText(item: NewsTextInput, language: NewsTextLanguage, maxLength = 180): string {
  const fallbackHeadline = cleanNewsTitle(item.headline || item.title || "");
  if (language === "ta") return fallbackHeadline;

  const englishHeadline = cleanNewsTitle(item.englishHeadline || "");
  if (englishHeadline && !isMostlyTamil(englishHeadline)) {
    return truncateAtBoundary(englishHeadline, maxLength);
  }

  if (fallbackHeadline && isMostlyTamil(fallbackHeadline)) {
    return translateTamilTextDirectly(fallbackHeadline, maxLength);
  }

  if (fallbackHeadline) return firstSentence(fallbackHeadline, maxLength);

  return fallbackHeadline;
}

export function getArticleContentText(item: NewsTextInput, language: NewsTextLanguage, maxLength = 5000): string {
  if (language === "en") {
    return cleanNewsText(buildEnglishSummary(item), { maxLength: Math.min(maxLength, 1200) });
  }

  return buildNewsContent(item.summary || item.tamilSummary, item.content, item.headline || item.title || "", maxLength);
}

export function getArticleSpeechText(item: NewsTextInput, language: NewsTextLanguage): string {
  const maxLength = SPEECH_TEXT_LIMITS[language];
  const headline = getArticleHeadlineText(item, language, 150);
  const sourceText = language === "en"
    ? buildEnglishSummary(item)
    : buildNewsSummary(item.summary || item.tamilSummary, item.content, item.headline || item.title || "");
  let articleText = completeSpeechBrief(sourceText, maxLength);

  if (headline && articleText.toLowerCase().startsWith(headline.toLowerCase())) {
    articleText = articleText.slice(headline.length).replace(/^[\s.।:;-]+/, "");
  }

  if (articleText.length < 90 && item.content) {
    articleText = completeSpeechBrief(item.content, maxLength);
    if (headline && articleText.toLowerCase().startsWith(headline.toLowerCase())) {
      articleText = articleText.slice(headline.length).replace(/^[\s.।:;-]+/, "");
    }
  }

  return completeSpeechBrief(articleText || headline, maxLength);
}
