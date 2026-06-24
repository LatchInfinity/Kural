const CATEGORY_EMOJIS: Record<string, string> = {
  "Tamil Nadu": "🌴",
  "Chennai": "🌴",
  "Madurai": "🛕",
  "Coimbatore": "🌉",
  "Tiruchirappalli": "🛕",
  "Salem": "🌾",
  "Tirunelveli": "🛕",
  "Erode": "🌾",
  "Government": "🏢",
  "Politics": "🏛️",
  "Business": "🏙️",
  "Sports": "🏏",
  "Chess": "♔",
  "Technology": "🧠",
  "Education": "🎓",
  "Health": "🏥",
  "Agriculture": "🌾",
  "Weather": "🌧️",
  "Accident": "⚠️",
  "Crime": "🛡️",
  "Temple": "🛕",
  "Environment": "🌳",
  "Electricity": "⚡",
  "Power Cut": "🔌",
  "Railway": "🚆",
  "Airport": "✈️",
  "Infrastructure": "🌉",
  "Tourism": "🏖️",
  "Court": "⚖️",
  "Culture": "🛕",
  "Spiritual": "🛕",
  "World": "🏛️",
  "India": "🏢",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Tamil Nadu": "government",
  "Chennai": "government",
  "Madurai": "temple",
  "Coimbatore": "infrastructure",
  "Tiruchirappalli": "temple",
  "Salem": "agriculture",
  "Tirunelveli": "temple",
  "Erode": "agriculture",
  "Government": "government",
  "Politics": "politics",
  "Business": "business",
  "Sports": "sports",
  "Chess": "chess",
  "Technology": "technology",
  "Education": "education",
  "Health": "health",
  "Agriculture": "agriculture",
  "Weather": "weather",
  "Accident": "accident",
  "Crime": "crime",
  "Temple": "temple",
  "Environment": "environment",
  "Electricity": "electricity",
  "Power Cut": "powercut",
  "Railway": "railway",
  "Airport": "airport",
  "Infrastructure": "infrastructure",
  "Tourism": "tourism",
  "Court": "court",
  "Culture": "temple",
  "Spiritual": "temple",
  "World": "politics",
  "India": "government",
};

export function getCategoryEmoji(category: string): string {
  const emoji = CATEGORY_EMOJIS[category];
  if (emoji) return emoji;
  const lower = category?.toLowerCase().replace(/\s+/g, "");
  if (lower) {
    const matched = Object.keys(CATEGORY_EMOJIS).find(
      k => k.toLowerCase().replace(/\s+/g, "") === lower
    );
    if (matched) return CATEGORY_EMOJIS[matched];
  }
  return "📰";
}

export function getCategoryIconPath(category: string): string {
  const slug = CATEGORY_ICONS[category];
  if (slug) return `/icons/categories/${slug}.svg`;
  const lower = category?.toLowerCase().replace(/\s+/g, "");
  if (lower) {
    const matched = Object.keys(CATEGORY_ICONS).find(
      k => k.toLowerCase().replace(/\s+/g, "") === lower
    );
    if (matched) return `/icons/categories/${CATEGORY_ICONS[matched]}.svg`;
  }
  return "/icons/categories/default.svg";
}

const CATEGORY_FALLBACK_PROMPTS: Record<string, string> = {
  "Tamil Nadu": "Wide-angle newspaper photograph of Tamil Nadu scenic landscape natural beauty",
  "Chennai": "Wide-angle newspaper photograph of Chennai city skyline Marina beach",
  "Madurai": "Wide-angle newspaper photograph of Madurai Meenakshi temple architecture",
  "Coimbatore": "Wide-angle newspaper photograph of Coimbatore city urban landscape",
  "Tiruchirappalli": "Wide-angle newspaper photograph of Tiruchirappalli rockfort temple",
  "Salem": "Wide-angle newspaper photograph of Salem steel city landscape",
  "Tirunelveli": "Wide-angle newspaper photograph of Tirunelveli cityscape",
  "Erode": "Wide-angle newspaper photograph of Erode agriculture farmlands",
  "தமிழ்நாடு அரசு": "Wide-angle newspaper photograph of Tamil Nadu government Secretariat building Chennai",
  "Government": "Wide-angle newspaper photograph of Tamil Nadu government Secretariat building Chennai",
  "தமிழ்நாடு அரசியல்": "Wide-angle newspaper photograph of Tamil Nadu legislative assembly building exterior",
  "Politics": "Wide-angle newspaper photograph of Tamil Nadu legislative assembly building exterior",
  "தமிழ்நாடு வணிகம்": "Wide-angle newspaper photograph of Tamil Nadu business factory industry",
  "Business": "Wide-angle newspaper photograph of Tamil Nadu business factory industry",
  "தமிழ்நாடு விளையாட்டு": "Wide-angle newspaper photograph of Tamil Nadu cricket stadium",
  "Sports": "Wide-angle newspaper photograph of Tamil Nadu cricket stadium",
  "Chess": "Wide-angle newspaper photograph of chess board game competition",
  "தமிழ்நாடு தொழில்நுட்பம்": "Wide-angle newspaper photograph of Tamil Nadu IT park technology",
  "Technology": "Wide-angle newspaper photograph of Tamil Nadu IT park technology",
  "தமிழ்நாடு கல்வி": "Wide-angle newspaper photograph of Tamil Nadu university campus education",
  "Education": "Wide-angle newspaper photograph of Tamil Nadu university campus education",
  "Health": "Wide-angle newspaper photograph of hospital medical building exterior",
  "தமிழ்நாடு வேளாண்மை": "Wide-angle newspaper photograph of Tamil Nadu paddy fields agriculture",
  "Agriculture": "Wide-angle newspaper photograph of Tamil Nadu paddy fields agriculture",
  "தமிழ்நாடு வானிலை": "Wide-angle newspaper photograph of Tamil Nadu rain cyclone storm clouds",
  "Weather": "Wide-angle newspaper photograph of Tamil Nadu rain cyclone storm clouds",
  "தமிழ்நாடு விபத்து": "Wide-angle newspaper photograph of Tamil Nadu road accident scene",
  "Accident": "Wide-angle newspaper photograph of Tamil Nadu road accident scene",
  "தமிழ்நாடு குற்றம்": "Wide-angle newspaper photograph of Tamil Nadu police station exterior",
  "Crime": "Wide-angle newspaper photograph of Tamil Nadu police station exterior",
  "தமிழ்நாடு போக்குவரத்து": "Wide-angle newspaper photograph of Tamil Nadu bus railway station transport",
  "Transport": "Wide-angle newspaper photograph of Tamil Nadu bus railway station transport",
  "தமிழ்நாடு உள்ளூர்": "Wide-angle newspaper photograph of Tamil Nadu local town market daily life",
  "Local": "Wide-angle newspaper photograph of Tamil Nadu local town market daily life",
  "Temple": "Wide-angle newspaper photograph of ancient Tamil temple architecture",
  "Environment": "Wide-angle newspaper photograph of forest nature green landscape Tamil Nadu",
  "Electricity": "Wide-angle newspaper photograph of electricity power lines grid Tamil Nadu",
  "Power Cut": "Wide-angle newspaper photograph of power transformer electrical infrastructure",
  "Railway": "Wide-angle newspaper photograph of railway station train tracks Tamil Nadu",
  "Airport": "Wide-angle newspaper photograph of airport terminal building Tamil Nadu",
  "Infrastructure": "Wide-angle newspaper photograph of bridge road construction Tamil Nadu",
  "Tourism": "Wide-angle newspaper photograph of tourist heritage destination Tamil Nadu",
  "Court": "Wide-angle newspaper photograph of court of law justice building Tamil Nadu",
  "Culture": "Wide-angle newspaper photograph of Tamil cultural heritage festival",
  "Spiritual": "Wide-angle newspaper photograph of spiritual temple religious site Tamil Nadu",
  "World": "Wide-angle newspaper photograph of global international news scene",
  "India": "Wide-angle newspaper photograph of Indian parliament government building",
};

export function getCategoryFallbackImageUrl(category: string, skipLog?: boolean): string {
  if (!category) {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent("NO HUMAN FACES. SCENE ONLY. Wide-angle newspaper photograph: Tamil Nadu news landscape")}?width=800&height=450&nofeed=true`;
  }
  const prompt = CATEGORY_FALLBACK_PROMPTS[category];
  if (!prompt) {
    const lower = category.toLowerCase().replace(/\s+/g, "");
    const matched = Object.keys(CATEGORY_FALLBACK_PROMPTS).find(
      k => k.toLowerCase().replace(/\s+/g, "") === lower
    );
    if (matched) return getCategoryFallbackImageUrl(matched, true);
  }
  const resolvedPrompt = prompt || "NO HUMAN FACES. SCENE ONLY. Wide-angle newspaper photograph: Tamil Nadu news landscape";
  const shortPrompt = `NO HUMAN FACES. SCENE ONLY. ${resolvedPrompt}`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}?width=800&height=450&nofeed=true`;
  if (!skipLog) console.log(`[IMAGE] FALLBACK category="${category}" prompt="${shortPrompt.slice(0, 80)}" url=${url}`);
  return url;
}

export function getCategoryImageUrl(category: string): string {
  return getCategoryIconPath(category);
}
