import { localAiImageUrl } from "@/lib/ai-image-url";

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

const FALLBACK_STYLE =
  "Photorealistic news photography, newspaper editorial style, highly detailed, realistic lighting, natural colors, landscape orientation, 16:9 wide composition, Tamil Nadu context";

const FALLBACK_NEGATIVE =
  "Negative prompt: no close-up face, no portrait, no selfie, no celebrity, no politician face, no floating heads, no anime, no cartoon, no illustration, no AI art style, no watermark, no text, no typography, no logo, no poster design, no recognizable people";

const CATEGORY_FALLBACK_PROMPTS: Record<string, string> = {
  "Tamil Nadu": "district public street scene with civic activity, markets, roads, and local buildings, people only as distant background silhouettes",
  "Chennai": "Chennai city road and public infrastructure near Marina beach, realistic daylight, no readable signs",
  "Madurai": "Madurai district landmark street and temple architecture context, wide editorial frame, no close-up faces",
  "Coimbatore": "Coimbatore industrial city road, office buildings, and transport infrastructure, wide editorial frame",
  "Tiruchirappalli": "Tiruchirappalli city landmark and public street infrastructure, realistic daylight, no portraits",
  "Salem": "Salem industrial and agricultural district landscape, roads and public buildings, no close-up people",
  "Tirunelveli": "Tirunelveli district street and public buildings, wide news photograph, no portraits",
  "Erode": "Erode agriculture market and farmlands, produce crates and public activity, faces not visible",
  "தமிழ்நாடு அரசு": "government offices, public service counters, administrative buildings, and official inspection activity, no politician portraits",
  "Government": "government offices, public service counters, administrative buildings, and official inspection activity, no politician portraits",
  "தமிழ்நாடு அரசியல்": "government building, assembly session atmosphere, public meeting stage, or policy announcement setup, never politician portraits",
  "Politics": "government building, assembly session atmosphere, public meeting stage, or policy announcement setup, never politician portraits",
  "தமிழ்நாடு வணிகம்": "factory, industrial zone, office complex, manufacturing activity, investment project site, no businessman faces",
  "Business": "factory, industrial zone, office complex, manufacturing activity, investment project site, no businessman faces",
  "தமிழ்நாடு விளையாட்டு": "stadium match action, sports equipment, crowd atmosphere, wide angle, avoid recognizable athletes",
  "Sports": "stadium match action, sports equipment, crowd atmosphere, wide angle, avoid recognizable athletes",
  "Chess": "chess tournament hall with boards and clocks, players only as distant silhouettes, no faces",
  "தமிழ்நாடு தொழில்நுட்பம்": "IT park, computer lab, data center, and digital infrastructure, screens blurred without readable text",
  "Technology": "IT park, computer lab, data center, and digital infrastructure, screens blurred without readable text",
  "தமிழ்நாடு கல்வி": "classroom, students studying from behind, school building, college campus, or exam hall, no teacher portraits",
  "Education": "classroom, students studying from behind, school building, college campus, or exam hall, no teacher portraits",
  "Health": "government hospital exterior, health camp, ambulance bay, and medical equipment, no doctor or patient portraits",
  "தமிழ்நாடு வேளாண்மை": "paddy fields, irrigation channels, farming equipment, crop rows, workers only as distant silhouettes",
  "Agriculture": "paddy fields, irrigation channels, farming equipment, crop rows, workers only as distant silhouettes",
  "தமிழ்நாடு வானிலை": "rain, storm clouds, flooding, sunshine, heatwave, and weather impact on city roads, no random people",
  "Weather": "rain, storm clouds, flooding, sunshine, heatwave, and weather impact on city roads, no random people",
  "தமிழ்நாடு விபத்து": "road accident response, ambulance, traffic cones, police vehicles, safety barriers, no victims visible",
  "Accident": "road accident response, ambulance, traffic cones, police vehicles, safety barriers, no victims visible",
  "தமிழ்நாடு குற்றம்": "police vehicles, investigation scene, forensic markers, court building, and security activity, no victim faces",
  "Crime": "police vehicles, investigation scene, forensic markers, court building, and security activity, no victim faces",
  "தமிழ்நாடு போக்குவரத்து": "bus, train, metro, railway station, highway, flyover, traffic infrastructure, no driver portraits",
  "Transport": "bus, train, metro, railway station, highway, flyover, traffic infrastructure, no driver portraits",
  "தமிழ்நாடு உள்ளூர்": "district landmarks, markets, streets, public events, and community activity, avoid random faces",
  "Local": "district landmarks, markets, streets, public events, and community activity, avoid random faces",
  "Temple": "ancient Tamil temple architecture and public heritage site, wide editorial frame, no close-up devotees",
  "Environment": "forest, river, pollution control equipment, and conservation activity in Tamil Nadu, no portraits",
  "Electricity": "electricity power lines, transformer, substation, and service vehicles, workers only as distant silhouettes",
  "Power Cut": "power transformer, electrical infrastructure, repair vehicles, and street lighting context, no close-up workers",
  "Railway": "railway station, train tracks, platform infrastructure, commuters only as distant silhouettes",
  "Airport": "airport terminal building, runway service vehicles, and transport infrastructure, no passenger close-ups",
  "Infrastructure": "bridge, road construction, flyover, highway project, engineering activity, no worker portraits",
  "Tourism": "Tamil Nadu heritage destination, public streets, and tourist infrastructure, no close-up faces",
  "Court": "court building exterior, police vehicle, legal institution context, no accused or victim faces",
  "Culture": "Tamil cultural public event from a wide editorial angle, crowd shown from behind",
  "Spiritual": "temple religious site and public heritage architecture, wide editorial frame, no close-up faces",
  "World": "international news scene with government building or public infrastructure, no portraits",
  "India": "Indian government building and public administrative infrastructure, no politician portraits",
};

export function getCategoryFallbackImageUrl(category: string, skipLog?: boolean): string {
  if (!category) {
    const defaultPrompt = `${FALLBACK_STYLE}. district public street scene with civic activity and local buildings. ${FALLBACK_NEGATIVE}`;
    return localAiImageUrl(defaultPrompt, { seedSource: "category-default" });
  }
  const prompt = CATEGORY_FALLBACK_PROMPTS[category];
  if (!prompt) {
    const lower = category.toLowerCase().replace(/\s+/g, "");
    const matched = Object.keys(CATEGORY_FALLBACK_PROMPTS).find(
      k => k.toLowerCase().replace(/\s+/g, "") === lower
    );
    if (matched) return getCategoryFallbackImageUrl(matched, true);
  }
  const resolvedPrompt = prompt || "district public street scene with civic activity and local buildings";
  const shortPrompt = `${FALLBACK_STYLE}. Scene: ${resolvedPrompt}. ${FALLBACK_NEGATIVE}`;
  const url = localAiImageUrl(shortPrompt, { seedSource: category });
  if (!skipLog) console.log(`[IMAGE FALLBACK] category="${category}" prompt="${shortPrompt.slice(0, 180)}" url=${url.slice(0, 120)}`);
  return url;
}

export function getCategoryImageUrl(category: string): string {
  return getCategoryIconPath(category);
}
