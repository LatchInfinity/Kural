export const SCENE_LIBRARY: Record<string, string> = {
  "Politics": "Modern Tamil Nadu Legislative Assembly interior, elegant wooden desks, microphones, official atmosphere, editorial photography, cinematic lighting, realistic, 16:9.",
  "Government": "Government Secretariat building with official administrative environment, premium editorial photography, 16:9.",
  "Press Conference": "Government press conference hall with podium and clustered microphones, editorial style, 16:9.",
  "Election": "Polling booth with EVM machine and voting queue, realistic editorial photography, 16:9.",
  "Temple": "Magnificent Dravidian temple gopuram, architectural photography, blue sky, 16:9.",
  "Festival": "Traditional South Indian temple festival with decorative lights and cultural atmosphere, editorial photography, 16:9.",
  "Chennai City": "Modern Chennai skyline with traffic and urban life, editorial photography, 16:9.",
  "Coimbatore": "Clean modern city roads with western Tamil Nadu atmosphere, editorial photography, 16:9.",
  "Madurai": "Historic urban streets with iconic architecture, editorial photography, 16:9.",
  "Rain": "Heavy monsoon over Tamil Nadu city, wet roads, dark clouds, editorial photography, 16:9.",
  "Flood": "Urban flooding with emergency response vehicles, non-graphic, editorial photography, 16:9.",
  "Cyclone": "Storm clouds approaching coastline, dramatic weather scene, editorial photography, 16:9.",
  "Heatwave": "Bright sun over city skyline with summer atmosphere, editorial photography, 16:9.",
  "Agriculture": "Green paddy fields and irrigation canals, aerial editorial photography, 16:9.",
  "Farmer": "Farmer standing in lush agricultural field, editorial photography, 16:9.",
  "Education": "Modern university campus and library, editorial photography, 16:9.",
  "School": "School building and playground, educational atmosphere, editorial photography, 16:9.",
  "Exam": "Students studying in examination hall, editorial photography, 16:9.",
  "Health": "Modern hospital corridor with clean environment, editorial photography, 16:9.",
  "Doctor": "Medical consultation room with healthcare equipment, editorial photography, 16:9.",
  "Technology": "Modern AI data center with illuminated servers, editorial technology photography, 16:9.",
  "Artificial Intelligence": "Futuristic neural network visualization and digital computing environment, editorial photography, 16:9.",
  "Startup": "Modern collaborative office with technology workspace, editorial photography, 16:9.",
  "Business": "Glass-and-steel corporate buildings in an Indian business district, editorial photography, 16:9.",
  "Stock Market": "Financial district with digital market visualization, editorial photography, 16:9.",
  "Banking": "Modern banking hall and financial services environment, editorial photography, 16:9.",
  "Crime": "Police headquarters exterior with patrol vehicles, editorial photography, 16:9.",
  "Court": "Historic courthouse with judicial architecture, editorial photography, 16:9.",
  "Corruption": "Government documents, investigation desk, official files, editorial photography, 16:9.",
  "Arrest": "Police investigation scene without identifiable people or violence, editorial photography, 16:9.",
  "Electricity": "High-voltage transmission towers and electrical substation, editorial photography, 16:9.",
  "Power Cut": "Electric poles and transformers against an evening skyline, editorial photography, 16:9.",
  "Metro": "Modern elevated metro train in an Indian city, editorial photography, 16:9.",
  "Railway": "Indian railway station with train arriving, editorial transportation photography, 16:9.",
  "Bridge": "Large modern bridge spanning a river, architectural editorial photography, 16:9.",
  "Highway": "Multi-lane expressway with flyover infrastructure, editorial photography, 16:9.",
  "Airport": "Modern airport terminal with aircraft on runway, editorial transportation photography, 16:9.",
  "Bus Transport": "State transport bus terminal with organized platforms, editorial photography, 16:9.",
  "Traffic": "Busy urban intersection with signal lights and vehicles, editorial photography, 16:9.",
  "Protest": "Peaceful public demonstration with security barricades, editorial photography, 16:9.",
  "Rally": "Large organized political rally from aerial perspective, editorial news photography, 16:9.",
  "Cricket": "Professional cricket stadium with bat, ball, and stumps, editorial sports photography, 16:9.",
  "Football": "Football stadium under floodlights with ball on grass, editorial sports photography, 16:9.",
  "Chess": "Elegant wooden chessboard with king and queen pieces in focus, dramatic lighting, editorial photography, 16:9.",
  "Kabaddi": "Professional kabaddi arena with sports atmosphere, editorial sports photography, 16:9.",
  "Tourism": "Beautiful Tamil Nadu tourist destination with scenic landscape, editorial travel photography, 16:9.",
  "Environment": "Forest, rivers, and green hills in Tamil Nadu, documentary photography, 16:9.",
  "Wildlife": "Protected wildlife sanctuary with natural landscape, editorial photography, 16:9.",
  "Industrial Accident": "Factory emergency response with safety crews outside an industrial plant, no victims shown, non-graphic editorial photography, 16:9.",
  "Fire Accident": "Fire service vehicles responding to an incident, no victims shown, editorial photography, 16:9.",
  "Road Accident": "Emergency vehicles managing a highway incident, no injuries or graphic content, editorial photography, 16:9.",
  "Water Supply": "Large reservoir, dam, or water treatment infrastructure, editorial photography, 16:9.",
  "Industry": "Modern manufacturing plant and industrial complex, editorial photography, 16:9.",
  "Fishing": "Fishing boats along the Tamil Nadu coastline at sunrise, editorial photography, 16:9.",
  "Port": "Modern cargo port with cranes and shipping containers, editorial photography, 16:9.",
  "Default": "Premium broadcast studio with professional microphone, audio waveform display, elegant lighting, modern AI news environment, 16:9.",
};

export const DEFAULT_SCENE = "Default";

export function getAllSceneNames(): string[] {
  return Object.keys(SCENE_LIBRARY);
}

export function getSceneSlug(sceneName: string): string {
  return sceneName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^-+|-+$/g, "");
}

export function getSceneFilename(sceneName: string): string {
  return `${getSceneSlug(sceneName)}.webp`;
}

export function getSceneImageUrl(sceneName: string): string {
  return `/generated-scenes/${getSceneFilename(sceneName)}`;
}

export function getScenePrompt(sceneName: string): string {
  return SCENE_LIBRARY[sceneName] || SCENE_LIBRARY[DEFAULT_SCENE];
}

export function isValidScene(sceneName: string): boolean {
  return sceneName in SCENE_LIBRARY;
}

const KEYWORD_SCENE_MAP: [string[], string][] = [
  [["politics", "minister", "mla", "speaker", "சட்டமன்றம்", "சட்டப்பேரவை", "வாக்கெடுப்பு"], "Politics"],
  [["secretariat", "செயலகம்"], "Government"],
  [["press conference", "press meet", "செய்தியாளர் சந்திப்பு"], "Press Conference"],
  [["election", "by-election", "byelection", "by poll", "தேர்தல்", "வாக்குப்பதிவு", "polling", "evm"], "Election"],
  [["temple", "கோயில்", "கோவில்", "gopuram", "deity", "பூஜை"], "Temple"],
  [["festival", "விழா", "திருவிழா", "celebration", "தீபம்", "deepavali", "pongal"], "Festival"],
  [["chennai", "சென்னை", "மெரினா", "marina"], "Chennai City"],
  [["coimbatore", "கோயம்புத்தூர்"], "Coimbatore"],
  [["madurai", "மதுரை", "meenakshi", "மீனாட்சி"], "Madurai"],
  [["rainfall", "rain", "மழை", "monsoon", "downpour", "drizzle", "showers"], "Rain"],
  [["flood", "வெள்ளம்", "waterlog", "inundat", "submerge"], "Flood"],
  [["cyclone", "storm", "புயல்", "சூறாவளி", "hurricane", "typhoon"], "Cyclone"],
  [["heatwave", "summer", "கோடை", "hot", "வெயில்", "scorching"], "Heatwave"],
  [["agriculture", "paddy", "விவசாயம்", "நெல்", "irrigation", "harvest", "crop"], "Agriculture"],
  [["farmer", "விவசாயி", "ryot", "agri producer"], "Farmer"],
  [["university", "education", "கல்வி", "college", "பல்கலைக்கழகம்"], "Education"],
  [["school", "பள்ளி", "kg", "kindergarten", "high school"], "School"],
  [["exam", "தேர்வு", "neet", "jee", "test", "examination", "board exam"], "Exam"],
  [["hospital", "மருத்துவமனை", "clinic", "healthcare"], "Health"],
  [["doctor", "மருத்துவர்", "physician", "surgeon", "specialist"], "Doctor"],
  [["technology", "software", "it ", "digital", "data center", "தொழில்நுட்பம்", "மென்பொருள்"], "Technology"],
  [["artificial intelligence", "machine learning", "neural", "gpt", "llm", "chatgpt"], "Artificial Intelligence"],
  [["startup", "founder", "funding", "venture", "incubator"], "Startup"],
  [["business", "corporate", "வணிகம்", "பொருளாதாரம்", "company", "industry leader"], "Business"],
  [["stock", "share", "nse", "bse", "sensex", "nifty"], "Stock Market"],
  [["bank", "banking", "loan", "வங்கி", "rbi", "வட்டி"], "Banking"],
  [["crime", "theft", "murder", "குற்றம்", "திருட்டு", "கொலை", "robbery"], "Crime"],
  [["court", "judge", "verdict", "நீதிமன்றம்", "வழக்கு", "தீர்ப்பு", "நீதிபதி"], "Court"],
  [["corruption", "bribery", "cbi", "vigilance", "scam", "fraud", "ஊழல்", "லஞ்சம்"], "Corruption"],
  [["arrest", "கைது", "apprehend", "detained", "nabbed"], "Arrest"],
  [["electricity", "tangedco", "tneb", "மின்சாரம்", "power plant", "substation", "transmission"], "Electricity"],
  [["power cut", "load shedding", "மின்தடை", "மின்வெட்டு", "outage", "blackout"], "Power Cut"],
  [["metro", "மெட்ரோ", "chennai metro"], "Metro"],
  [["railway", "train", "rail", "station", "ரயில்", "இரயில்", "தொடருந்து"], "Railway"],
  [["bridge", "பாலம்", "flyover", "overpass"], "Bridge"],
  [["highway", "expressway", "நெடுஞ்சாலை", "சாலை", "road"], "Highway"],
  [["airport", "flight", "airline", "விமான நிலையம்", "விமானம்", "aviation"], "Airport"],
  [["bus", "state transport", "tnstc", "பேருந்து"], "Bus Transport"],
  [["traffic", "சாலை போக்குவரத்து", "signal", "congestion", "jam"], "Traffic"],
  [["protest", "போராட்டம்", "demonstration", "strike", "வேலை நிறுத்தம்", "எதிர்ப்பு"], "Protest"],
  [["rally", "public meeting", "பேரணி", "கூட்டம்", "mass gathering", "மாநாடு"], "Rally"],
  [["cricket", "ipl", "கிரிக்கெட்", "test match", "t20", "odi"], "Cricket"],
  [["football", "கால்பந்து", "fifa", "world cup"], "Football"],
  [["chess", "சதுரங்கம்", "grandmaster", "chessboard"], "Chess"],
  [["kabaddi", "கபடி", "pro kabaddi"], "Kabaddi"],
  [["tourism", "tourist", "travel", "destination", "சுற்றுலா", "பயணம்"], "Tourism"],
  [["environment", "forest", "conservation", "சூழல்", "வனம்", "tree planting", "pollution"], "Environment"],
  [["wildlife", "sanctuary", "tiger", "elephant", "national park", "வனவிலங்கு", "மான்"], "Wildlife"],
  [["factory accident", "industrial accident", "gas leak", "ammonia", "chemical leak", "boiler blast", "தொழிற்சாலை விபத்து", "வாயு கசிவு", "அமோனியா", "ரசாயன கசிவு"], "Industrial Accident"],
  [["fire", "தீ விபத்து", "blaze", "inferno"], "Fire Accident"],
  [["accident", "விபத்து", "collision", "crash", "மோதலு", "lorry"], "Road Accident"],
  [["water supply", "reservoir", "dam", "நீர் தேக்கம்", "அணை", "treatment plant"], "Water Supply"],
  [["industry", "factory", "manufacturing", "தொழிற்சாலை", "plant"], "Industry"],
  [["fishing", "மீன்பிடி", "fisherman", "boat", "trawler"], "Fishing"],
  [["port", "cargo", "ship", "container", "வர்த்தக துறைமுகம்", "மும்பை துறைமுகம்"], "Port"],
];

export function detectScene(
  title: string,
  summary: string,
  content: string,
  category: string,
): string {
  const text = ` ${(title || "").toLowerCase()} ${(summary || "").toLowerCase()} ${(content || "").toLowerCase()} `;

  let bestScore = 0;
  let bestScene: string = DEFAULT_SCENE;

  for (const [keywords, scene] of KEYWORD_SCENE_MAP) {
    let score = 0;
    for (const kw of keywords) {
      const needle = kw.toLowerCase().trim();
      if (!needle) continue;
      if (text.includes(needle)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestScene = scene;
    }
  }

  if (bestScore > 0) return bestScene;

  switch ((category || "").toLowerCase()) {
    case "politics": return "Politics";
    case "weather": return "Rain";
    case "agriculture": return "Agriculture";
    case "education": return "Education";
    case "health": return "Health";
    case "business": return "Business";
    case "technology": return "Technology";
    case "accident": return "Industrial Accident";
    case "தமிழ்நாடு விபத்து": return "Industrial Accident";
    case "crime": return "Crime";
    case "sports": return "Cricket";
    case "tamil nadu": return "Politics";
    case "chennai": return "Chennai City";
    case "madurai": return "Madurai";
    case "coimbatore": return "Coimbatore";
    default: return DEFAULT_SCENE;
  }
}
