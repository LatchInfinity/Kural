const CATEGORY_VISUALS: Record<string, string[]> = {
  "தமிழ்நாடு அரசியல்": ["Tamil Nadu Assembly", "Government Building", "Political Meeting", "Legislature"],
  "தமிழ்நாடு அரசு": ["Government Office Chennai", "Secretariat Building", "Government Scheme"],
  "தமிழ்நாடு கல்வி": ["School Classroom", "University Campus", "Students Studying", "College Library"],
  "தமிழ்நாடு வணிகம்": ["Stock Market Chart", "Factory", "Business Office", "Shopping Mall"],
  "தமிழ்நாடு தொழில்நுட்பம்": ["AI Robotics", "Modern Office Tech", "Computer Lab", "IT Park"],
  "தமிழ்நாடு விளையாட்டு": ["Cricket Stadium", "Athlete Running", "Sports Match", "Football Ground"],
  "தமிழ்நாடு விபத்து": ["Industrial Safety Response", "Factory Emergency Response", "Rescue Team at Incident Site", "Fire and Safety Crew"],
  "தமிழ்நாடு குற்றம்": ["Police Station", "Court Building", "Investigation"],
  "தமிழ்நாடு வானிலை": ["Rainy Season", "Sunny Weather", "Cyclone Satellite", "Flooded Area"],
  "தமிழ்நாடு போக்குவரத்து": ["Metro Train", "Bus Terminal", "Highway Road", "Bridge"],
  "தமிழ்நாடு வேளாண்மை": ["Farm Field", "Farmer Harvesting", "Paddy Crop", "Agriculture Land"],
  "தமிழ்நாடு உள்ளூர்": ["Local Market", "Village Scene", "Park", "Neighborhood"],
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

export function buildImagePrompt(input: ArticleImageGenerationInput): string {
  const { headline, category, summary, district, keywords = [] } = input;
  const location = detectLocation(headline, summary, district);
  const visuals = CATEGORY_VISUALS[category] || ["Tamil Nadu News", "Scenic View", "Modern India"];
  const visual = visuals[stableIndex(`${headline} ${category} ${district || ""}`, visuals.length)];
  const keywordText = keywords.filter(Boolean).slice(0, 5).join(", ");
  const context = [headline.slice(0, 90), summary.slice(0, 140), keywordText].filter(Boolean).join(". ");

  return [
    "Realistic editorial Tamil Nadu news photograph",
    `${visual} in ${location}`,
    context,
    "natural daylight, documentary photojournalism, high quality, 16:9 aspect ratio",
    "no text, no logos, no watermarks, no recognizable faces",
  ].join(", ");
}

export function imageUrlFromPrompt(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=450&nofeed=true`;
}

export function generateArticleImage(input: ArticleImageGenerationInput): ArticleImageGeneration {
  const prompt = buildImagePrompt(input);
  return {
    prompt,
    url: imageUrlFromPrompt(prompt),
  };
}

export function generateImageUrl(headline: string, category: string, summary: string, district?: string): string {
  return generateArticleImage({ headline, category, summary, district }).url;
}
