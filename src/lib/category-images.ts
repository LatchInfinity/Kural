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

export function getCategoryImageUrl(category: string): string {
  return getCategoryIconPath(category);
}
