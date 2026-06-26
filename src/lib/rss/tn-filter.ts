import { containsEntertainmentContent } from "@/lib/news-policy";

const TN_DISTRICTS = [
  "சென்னை", "chennai", "coimbatore", "கோயம்புத்தூர்", "madurai", "மதுரை",
  "trichy", "திருச்சி", "tiruchirappalli", "salem", "சேலம்", "erode", "ஈரோடு",
  "tirunelveli", "திருநெல்வேலி", "thoothukudi", "தூத்துக்குடி", "vellore", "வேலூர்",
  "kanchipuram", "காஞ்சிபுரம்", "tiruppur", "திருப்பூர்", "nagapattinam", "நாகப்பட்டினம்",
  "cuddalore", "கடலூர்", "kanyakumari", "கன்னியாகுமரி", "dharmapuri", "தர்மபுரி",
  "krishnagiri", "கிருஷ்ணகிரி", "sivagangai", "சிவகங்கை", "ramanathapuram", "ராமநாதபுரம்",
  "dindigul", "திண்டுக்கல்", "karur", "கரூர்", "namakkal", "நாமக்கல்",
  "virudhunagar", "விருதுநகர்", "ariyalur", "அரியலூர்", "mayiladuthurai", "மயிலாடுதுறை",
  "theni", "தேனி", "tiruvannamalai", "திருவண்ணாமலை", "viluppuram", "விழுப்புரம்",
  "perambalur", "பெரம்பலூர்", "pudukkottai", "புதுக்கோட்டை", "ranipet", "ராணிப்பேட்டை",
  "tenkasi", "தென்காசி", "thirupathur", "திருப்பத்தூர்", "kallakurichi", "கள்ளக்குறிச்சி",
  "tiruvallur", "திருவள்ளூர்", "chengalpattu", "செங்கல்பட்டு",
];

const TN_CITIES = [
  "சென்னை", "chennai", "coimbatore", "madurai", "trichy", "salem",
  "tirunelveli", "tiruppur", "erode", "vellore", "thoothukudi",
  "dindigul", "thanjavur", "தஞ்சாவூர்", "kumbakonam", "கும்பகோணம்",
  "hosur", "ஓசூர்", "ambur", "ஆம்பூர்", "kodaikanal", "கொடைக்கானல்",
  "ooty", "ஊட்டி", "udhagamandalam", "velankanni", "வேளாங்கண்ணி",
  "mahabalipuram", "மகாபலிபுரம்", "rameshwaram", "இராமேஸ்வரம்",
  "kanyakumari", "avadi", "ஆவடி", "chromepet", "tambaram", "தாம்பரம்",
];

const TN_KEYWORDS_TA = [
  "தமிழ்நாடு", "தமிழக", "சென்னை", "முதல்வர்", "அமைச்சர்", "ஆளுநர்",
  "சட்டப்பேரவை", "சட்டமன்ற", "மாவட்டம்", "மாவட்ட ஆட்சியர்", "கலெக்டர்",
  "தமிழக அரசு", "தமிழ்நாடு அரசு", "சென்னை உயர் நீதிமன்றம்",
  "சென்னைப் பல்கலைக்கழகம்", "அண்ணா பல்கலைக்கழகம்",
  "சென்னை மாநகராட்சி", "பெருநகர சென்னை", "மாநகர போக்குவரத்து",
  "சென்னை புறநகர்", "சென்னை மெட்ரோ", "மெட்ரோ ரெயில்",
  "தமிழக போக்குவரத்து", "அரசு பேருந்து", "மின்சார வாரியம்",
  "TANGEDCO", "தமிழ்நாடு மின்சார வாரியம்", "TNEB",
  "காவல் துறை", "தமிழக காவல்", "சென்னை காவல்",
  "வேளாண்மை", "விவசாயம்", "நீர்ப்பாசனம்", "கால்வாய்",
  "தமிழக தொழில்", "சிறு தொழில்", "தொழில் வளர்ச்சி",
  "சுற்றுலா", "சுற்றுலா தலங்கள்", "கோயில்", "கோவில்",
  "தமிழக சுகாதாரம்", "மருத்துவமனை", "ஆரம்ப சுகாதார நிலையம்",
  "தமிழக கல்வி", "பள்ளி கல்வி", "கல்லூரி", "பல்கலைக்கழகம்",
  "தேர்வு முடிவு", "தேர்வு மதிப்பெண்", "TNPSC", "tnpsc",
  "வேலைவாய்ப்பு", "அரசு பணி", "கிராம சபை", "ஊரக வளர்ச்சி",
  "முத்திரை பதிவு", "வரி", "சென்னை வருவாய்",
  "இளைஞர் நலன்", "விளையாட்டு மேம்பாடு", "தமிழக விளையாட்டு",
  "தமிழக பொருளாதாரம்", "நிதி நிலை", "வரவு செலவு",
  "சாலை", "நெடுஞ்சாலை", "உள்வட்ட சாலை", "பாலம்",
  "வானிலை", "மழை", "வெப்பநிலை", "புயல்", "வெள்ளம்",
  "நீர்மட்டம்", "குடிநீர்", "ஏரி", "அணை",
  "குற்றம்", "கொலை", "விபத்து", "திருட்டு", "கடத்தல்",
  "சிறை", "நீதிமன்றம்", "நீதிபதி",
];

const TN_KEYWORDS_EN = [
  "tamil nadu", "tamilnadu", "tamil nadu government", "tn government",
  "chennai", "madras", "chief minister", "cm stalin", "mk stalin",
  "minister", "tamil nadu assembly", "legislative assembly",
  "governor", "tn police", "chennai police", "greater chennai",
  "chennai corporation", "gcc", "metro rail", "chennai metro",
  "tnstc", "mtc bus", "state transport", "tneb", "tangedco",
  "tamil nadu electricity", "tn education", "school education",
  "tnpsc", "tamil nadu psc", "public service commission",
  "high court", "madras high court", "chennai high court",
  "anna university", "madras university", "tn agriculture",
  "tamil nadu agriculture", "tourism tamil nadu",
  "tamil nadu tourism", "tn industrial", "tamil nadu industrial",
  "guidance tamil nadu", "tn business", "tamil nadu business",
  "tamil nadu health", "tn health", "tamil nadu police",
  "state highway", "tn highway", "tamil nadu road",
  "northeast monsoon", "southwest monsoon", "chennai rain",
  "tamil nadu rain", "cyclone", "bay of bengal",
  "kalaignar", "udhayamit stalin", "tamil nadu congress",
  "dmk", "admk", "bjp tamil nadu", "ntk", "tamil maanila",
  "pmk", "vck", "tvk", "vijay tamil nadu",
];

const EXCLUSION_KEYWORDS = [
  "pakistan", "china", "usa", "united states", "america", "europe",
  "ukraine", "russia", "north korea", "south korea", "japan",
  "australia", "canada", "germany", "france", "uk", "britain",
  "israel", "palestine", "iran", "afghanistan", "bangladesh",
  "sri lanka", "nepal", "bhutan", "myanmar", "thailand",
  "dubai", "saudi", "qatar", "kuwait", "oman", "bahrain",
  "africa", "european", "nato", "united nations", "who",
  "world bank", "imf", "global", "international", "world",
  "bollywood", "hollywood",
  "delhi", "new delhi", "mumbai", "kolkata", "bangalore",
  "bengaluru", "hyderabad", "ahmedabad", "pune", "lucknow", "jaipur",
  "chandigarh", "bhopal", "indore", "gurgaon", "noida",
  "uttar pradesh", "up ", "bihar", "rajasthan", "gujarat",
  "madhya pradesh", "mp ", "west bengal", "jharkhand",
  "odisha", "orissa", "chhattisgarh", "haryana", "punjab", "himachal",
  "uttarakhand", "assam", "north east", "kerala", "karnataka",
  "andhra pradesh", "andhra", "telangana", "goa", "maharashtra",
  "manipur", "meghalaya", "mizoram", "nagaland", "tripura", "sikkim",
  "lok sabha", "parliament", "prime minister", "modi",
  "amit shah", "narendra modi",
  "பாகிஸ்தான்", "சீனா", "அமெரிக்கா", "ஐரோப்பா", "உக்ரைன்", "ரஷ்யா",
  "இலங்கை", "நேபாளம்", "வங்கதேசம்", "துபாய்", "சவுதி", "கத்தார்",
  "உலக", "சர்வதேச", "வெளிநாடு", "உலகம்", "பாலிவுட்", "ஹாலிவுட்",
  "டெல்லி", "புதுடெல்லி", "மும்பை", "கொல்கத்தா", "பெங்களூரு", "ஹைதராபாத்",
  "கேரளா", "கர்நாடகா", "ஆந்திரா", "தெலுங்கானா", "மகாராஷ்டிரா", "குஜராத்",
  "உத்தர பிரதேசம்", "பீகார்", "ராஜஸ்தான்", "மேற்கு வங்கம்", "ஒடிசா",
  "பிரதமர்", "நாடாளுமன்றம்", "மக்களவை",
];

const EXCLUSION_EXCEPTIONS = [
  "tamil nadu", "தமிழ்நாடு", "chennai", "சென்னை",
  "madras high court", "சென்னை உயர் நீதிமன்றம்",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "தமிழ்நாடு அரசியல்": [
    "முதல்வர்", "அமைச்சர்", "சட்டப்பேரவை", "சட்டமன்ற", "தேர்தல்",
    "கட்சி", "அரசியல்", "வாக்கு", "எம்.எல்.ஏ", "எம்பி",
    "dmk", "admk", "bjp", "திமுக", "அதிமுக", "பாஜக",
    "காங்கிரஸ்", "தேமுதிக", "நாம் தமிழர்", "விசிக",
    "மக்கள் நலன்", "கூட்டணி", "எதிர்க்கட்சி",
    "ஆட்சி", "பதவியேற்பு", "மாநாடு", "பிரசாரம்",
    "chief minister", "minister", "assembly", "election", "party",
  ],
  "தமிழ்நாடு அரசு": [
    "தமிழக அரசு", "தமிழ்நாடு அரசு", "tn government",
    "ஆளுநர்", "governor", "secretariat", "செயலகம்",
    "அரசாணை", "உத்தரவு", "திட்டம்", "நிதி ஒதுக்கீடு",
    "நலத்திட்டம்", "சலுகை", "உதவித்தொகை", "மானியம்",
    "அரசு திட்டம்", "govt scheme", "government order",
    "துறை", "அமைப்பு", "ஆணைக்குழு", "commission",
  ],
  "தமிழ்நாடு கல்வி": [
    "பள்ளி", "கல்வி", "கல்லூரி", "பல்கலைக்கழகம்", "universit",
    "தேர்வு", "மதிப்பெண்", "result", "exam", "tnpsc",
    "கல்வி ஆண்டு", "வகுப்பு", "மாணவர்", "ஆசிரியர்",
    "கற்றல்", "பாடத்திட்டம்", "இட ஒதுக்கீடு", "scholarship",
    "college", "school", "education", "university",
  ],
  "தமிழ்நாடு வணிகம்": [
    "வணிகம்", "தொழில்", "சந்தை", "வர்த்தக", "முதலீடு",
    "வரி", "ஜிஎஸ்டி", "gst", "பங்குச்சந்தை", "stock",
    "தொழில் வளர்ச்சி", "தொழில் முதலீடு", "guidance",
    "தொழிற்சாலை", "factory", "industry", "business",
    "வர்த்தக", "நிறுவனம்", "company", "சிறு தொழில்",
    "விவசாய பொருள்", "ஏற்றுமதி", "இறக்குமதி",
    "investment", "trade", "commerce", "industrial",
  ],
  "தமிழ்நாடு தொழில்நுட்பம்": [
    "தொழில்நுட்பம்", "technology", "டிஜிட்டல்", "digital",
    "தகவல் தொழில்நுட்பம்", "it ", "தொழில்நுட்ப",
    "செயற்கை நுண்ணறிவு", "artificial intelligence", "ai ",
    "tech", "startup", "ஸ்டார்ட்அப்", "இணையதளம்",
    "சென்னை ஐடி", "கோயம்புத்தூர் ஐடி", "டெக் பூங்கா",
    "it park", "tech park", "software", "மென்பொருள்",
  ],
  "தமிழ்நாடு விளையாட்டு": [
    "விளையாட்டு", "sports", "கிரிக்கெட்", "cricket",
    "கபடி", "kabaddi", "கால்பந்து", "football",
    "ஒலிம்பிக்", "olympic", "உலகக் கோப்பை", "world cup",
    "சதுரங்கம்", "chess", "டென்னிஸ்", "tennis",
    "பயிற்சியாளர்",
    "விளையாட்டு வீரர்", "athlete", "player", "coach",
    "சென்னை சூப்பர் கிங்ஸ்", "csk", "super king",
  ],
  "தமிழ்நாடு விபத்து": [
    "விபத்து", "மோதல்", "மோதி", "மோதியதில்", "கவிழ்ந்து", "தடம் புரண்டு",
    "accident", "crash", "collision", "mishap", "hit by", "overturned",
    "வாயு கசிவு", "gas leak", "அமோனியா", "ammonia", "தீ விபத்து",
    "வெடிப்பு", "explosion", "fire accident", "தொழிற்சாலை விபத்து",
    "factory accident", "chemical leak", "boiler blast", "plant accident",
    "உயிரிழப்பு", "உயிரிழந்த", "உயிரிழந்தார்", "உயிரிழந்தனர்",
    "பலி", "பலியான", "பலி எண்ணிக்கை", "மரணம்", "இறப்பு",
    "dead", "death", "death toll", "died", "fatal",
  ],
  "தமிழ்நாடு குற்றம்": [
    "குற்றம்", "கொலை", "murder", "homicide", "stabbed",
    "திருட்டு", "theft", "கடத்தல்", "smuggling",
    "சிறை", "jail", "prison", "நீதிமன்றம்", "court",
    "காவல் நிலையம்", "police station", "போலீஸ் விசாரணை", "வழக்கு", "criminal case",
    "கைது", "arrest", "தாக்குதல்", "attack", "assault",
    "மோசடி", "fraud", "கொள்ளை", "robbery",
  ],
  "தமிழ்நாடு வானிலை": [
    "வானிலை", "weather", "மழை", "rain", "வெப்பநிலை",
    "temperature", "புயல்", "cyclone", "storm",
    "வெள்ளம்", "flood", "நீர்மட்டம்", "water level",
    "குடிநீர்", "drinking water", "ஏரி", "lake",
    "அணை", "dam", "வறட்சி", "drought", "மிதமான",
    "bay of bengal", "வங்கக் கடல்", "மழை அளவு",
    "northeast monsoon", "southwest monsoon",
  ],
  "தமிழ்நாடு போக்குவரத்து": [
    "போக்குவரத்து", "transport", "சாலை", "road",
    "நெடுஞ்சாலை", "highway", "பேருந்து", "bus",
    "மெட்ரோ", "metro", "ரயில்", "rail", "train",
    "சென்னை புறநகர்", "suburban", "விமான நிலையம்",
    "airport", "tnstc", "mtc", "பாலம்", "bridge",
    "சாலை விரிவாக்கம்", "road widening", "flyover",
    "மேம்பாலம்", "சாலை பணி", "போக்குவரத்து கழகம்",
  ],
  "தமிழ்நாடு வேளாண்மை": [
    "வேளாண்மை", "விவசாயம்", "agriculture", "farmer",
    "உழவர்", "விவசாயி", "பயிர்", "crop", "நெல்",
    "rice", "paddy", "தோட்டம்", "garden", "நீர்ப்பாசனம்",
    "irrigation", "கால்வாய்", "canal", "உரம்", "fertilizer",
    "மானியம்", "subsidy", "விதை", "seed", "அறுவடை",
    "harvest", "மழை அளவு", "மண்", "soil",
  ],
  "தமிழ்நாடு உள்ளூர்": [
    "உள்ளூர்", "local", "வார்டு", "ward", "பஞ்சாயத்து",
    "panchayat", "நகராட்சி", "municipality", "கிராமம்",
    "village", "பகுதி", "area", "தெரு", "street",
    "சாலை", "road", "வளாகம்", "complex", "சந்தை",
    "market", "கடை", "shop", "வணிக வளாகம்",
    "குடியிருப்பு", "residential", "பொது இடம்",
    "சமுதாய", "community", "பூங்கா", "park",
    "திருவிழா", "விழா", "festival", "food festival", "உணவு திருவிழா",
    "கண்காட்சி", "exhibition", "அருங்காட்சியகம்", "museum", "fair",
  ],
};

const SOURCE_CATEGORY_MAP: Record<string, string> = {
  politics: "தமிழ்நாடு அரசியல்",
  government: "தமிழ்நாடு அரசு",
  education: "தமிழ்நாடு கல்வி",
  business: "தமிழ்நாடு வணிகம்",
  technology: "தமிழ்நாடு தொழில்நுட்பம்",
  sports: "தமிழ்நாடு விளையாட்டு",
  accident: "தமிழ்நாடு விபத்து",
  crime: "தமிழ்நாடு குற்றம்",
  weather: "தமிழ்நாடு வானிலை",
  transport: "தமிழ்நாடு போக்குவரத்து",
  railway: "தமிழ்நாடு போக்குவரத்து",
  agriculture: "தமிழ்நாடு வேளாண்மை",
  local: "தமிழ்நாடு உள்ளூர்",
};

const FATALITY_KEYWORDS = [
  "உயிரிழப்பு", "உயிரிழந்த", "உயிரிழந்தார்", "உயிரிழந்தனர்",
  "பலி", "பலியான", "பலியானார்", "பலியானார்கள்", "பலி எண்ணிக்கை",
  "மரணம்", "இறப்பு", "சாவு", "சடலம்", "பிணம்",
  "dead", "death", "death toll", "died", "dies", "killed", "fatal",
];

const ACCIDENT_KEYWORDS = [
  "விபத்து", "மோதல்", "மோதி", "மோதியதில்", "கவிழ்ந்து", "தடம் புரண்டு",
  "accident", "crash", "collision", "mishap", "hit by", "overturned",
  "gas leak", "ammonia leak", "explosion", "fire accident",
  "வாயு கசிவு", "அமோனியா", "தீ விபத்து", "வெடிப்பு",
  "தொழிற்சாலை விபத்து", "factory accident", "chemical leak", "boiler blast", "plant accident",
];

const CRIME_PRIORITY_KEYWORDS = [
  "குற்றம்", "கொலை", "murder", "homicide", "stabbed",
  "திருட்டு", "theft", "கடத்தல்", "smuggling",
  "காவல் நிலையம்", "police station", "போலீஸ் விசாரணை",
  "கைது", "arrest", "தாக்குதல்", "attack", "assault",
  "மோசடி", "fraud", "கொள்ளை", "robbery",
  "சிறை", "jail", "prison", "நீதிமன்றம்", "court", "criminal case",
];

const LOCAL_EVENT_KEYWORDS = [
  "திருவிழா", "விழா", "festival", "food festival", "உணவு திருவிழா",
  "கண்காட்சி", "exhibition", "அருங்காட்சியகம்", "museum", "fair",
];

const ANIMAL_KEYWORDS = [
  "விலங்கு", "யானை", "மாடு", "நாய்", "ஆடு பலி", "மான்", "புலி", "சிறுத்தை",
  "animal", "elephant", "cattle", "cow", "dog", "goat", "deer", "tiger", "leopard",
];

const POLITICAL_FORUM_KEYWORDS = [
  "சட்டப்பேரவை", "சட்டசபை", "சட்டமன்ற", "assembly", "legislative",
];

const POLITICAL_PRIORITY_KEYWORDS = [
  "தேர்தல்", "வேட்பாளர்", "தொகுதி", "கட்சி", "வாக்கு", "பிரசாரம்",
  "election", "candidate", "constituency", "party", "campaign",
];

const SPORTS_PRIORITY_KEYWORDS = [
  "விளையாட்டு", "sports", "கிரிக்கெட்", "cricket", "கபடி", "kabaddi",
  "கால்பந்து", "football", "athlete", "player",
  "சென்னை சூப்பர் கிங்ஸ்", "csk",
];

export interface TNFilterResult {
  relevant: boolean;
  category: string;
  district: string | null;
  score: number;
  reason: string;
}

export function detectDistrict(text: string): string | null {
  const normalized = normalize(text);
  for (const district of TN_DISTRICTS) {
    if (normalized.includes(district)) {
      if (district === "சென்னை" || district === "chennai") return "Chennai";
      if (district === "coimbatore" || district === "கோயம்புத்தூர்") return "Coimbatore";
      if (district === "madurai" || district === "மதுரை") return "Madurai";
      if (district === "trichy" || district === "திருச்சி" || district === "tiruchirappalli") return "Trichy";
      if (district === "salem" || district === "சேலம்") return "Salem";
      if (district === "erode" || district === "ஈரோடு") return "Erode";
      if (district === "tirunelveli" || district === "திருநெல்வேலி") return "Tirunelveli";
      if (district === "thoothukudi" || district === "தூத்துக்குடி") return "Thoothukudi";
      if (district === "vellore" || district === "வேலூர்") return "Vellore";
      if (district === "kanyakumari" || district === "கன்னியாகுமரி") return "Kanyakumari";
      if (district === "tiruppur" || district === "திருப்பூர்") return "Tiruppur";
      if (district === "kanchipuram" || district === "காஞ்சிபுரம்") return "Kanchipuram";
      if (district === "nagapattinam" || district === "நாகப்பட்டினம்") return "Nagapattinam";
      if (district === "cuddalore" || district === "கடலூர்") return "Cuddalore";
      if (district === "dharmapuri" || district === "தர்மபுரி") return "Dharmapuri";
      if (district === "krishnagiri" || district === "கிருஷ்ணகிரி") return "Krishnagiri";
      if (district === "sivagangai" || district === "சிவகங்கை") return "Sivagangai";
      if (district === "ramanathapuram" || district === "ராமநாதபுரம்") return "Ramanathapuram";
      if (district === "dindigul" || district === "திண்டுக்கல்") return "Dindigul";
      if (district === "karur" || district === "கரூர்") return "Karur";
      if (district === "namakkal" || district === "நாமக்கல்") return "Namakkal";
      if (district === "virudhunagar" || district === "விருதுநகர்") return "Virudhunagar";
      if (district === "ariyalur" || district === "அரியலூர்") return "Ariyalur";
      if (district === "mayiladuthurai" || district === "மயிலாடுதுறை") return "Mayiladuthurai";
      if (district === "theni" || district === "தேனி") return "Theni";
      if (district === "tiruvannamalai" || district === "திருவண்ணாமலை") return "Tiruvannamalai";
      if (district === "viluppuram" || district === "விழுப்புரம்") return "Viluppuram";
      if (district === "perambalur" || district === "பெரம்பலூர்") return "Perambalur";
      if (district === "pudukkottai" || district === "புதுக்கோட்டை") return "Pudukkottai";
      if (district === "ranipet" || district === "ராணிப்பேட்டை") return "Ranipet";
      if (district === "tenkasi" || district === "தென்காசி") return "Tenkasi";
      if (district === "thirupathur" || district === "திருப்பத்தூர்") return "Thirupathur";
      if (district === "kallakurichi" || district === "கள்ளக்குறிச்சி") return "Kallakurichi";
      if (district === "tiruvallur" || district === "திருவள்ளூர்") return "Tiruvallur";
      if (district === "chengalpattu" || district === "செங்கல்பட்டு") return "Chengalpattu";
    }
  }
  return null;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\sஅ-௯]/g, " ").replace(/\s+/g, " ").trim();
}

const STRICT_TN_THRESHOLD = 10;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasKeyword(text: string, keyword: string): boolean {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return false;
  if (/^[a-z0-9 ]+$/.test(normalizedKeyword)) {
    const pattern = new RegExp(`(^|\\s)${escapeRegex(normalizedKeyword)}($|\\s)`);
    return pattern.test(text);
  }
  return text.includes(normalizedKeyword);
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => hasKeyword(text, keyword));
}

function countKeywords(text: string, keywords: string[]): number {
  return keywords.reduce((score, keyword) => score + (hasKeyword(text, keyword) ? 1 : 0), 0);
}

function detectPriorityCategory(text: string): string | null {
  if (hasAnyKeyword(text, POLITICAL_FORUM_KEYWORDS)) return "தமிழ்நாடு அரசியல்";
  if (hasAnyKeyword(text, POLITICAL_PRIORITY_KEYWORDS)) return "தமிழ்நாடு அரசியல்";

  const sportsHits = countKeywords(text, SPORTS_PRIORITY_KEYWORDS);
  if (sportsHits >= 1 && !hasAnyKeyword(text, FATALITY_KEYWORDS)) return "தமிழ்நாடு விளையாட்டு";

  const hasFatality = hasAnyKeyword(text, FATALITY_KEYWORDS);
  const hasAccident = hasAnyKeyword(text, ACCIDENT_KEYWORDS);
  const hasAnimal = hasAnyKeyword(text, ANIMAL_KEYWORDS);
  const hasCrime = hasAnyKeyword(text, CRIME_PRIORITY_KEYWORDS);

  if (hasAnimal && hasFatality) return "தமிழ்நாடு உள்ளூர்";
  if (hasAccident) return "தமிழ்நாடு விபத்து";
  if (hasCrime) return "தமிழ்நாடு குற்றம்";
  if (hasFatality) return "தமிழ்நாடு விபத்து";
  if (hasAnyKeyword(text, LOCAL_EVENT_KEYWORDS)) return "தமிழ்நாடு உள்ளூர்";

  return null;
}

function scoreTamilNadu(text: string): number {
  let score = 0;
  const normalized = normalize(text);

  for (const district of TN_DISTRICTS) {
    if (hasKeyword(normalized, district)) score += 15;
  }
  for (const city of TN_CITIES) {
    if (hasKeyword(normalized, city)) score += 10;
  }
  for (const kw of TN_KEYWORDS_TA) {
    if (hasKeyword(normalized, kw)) score += 8;
  }
  for (const kw of TN_KEYWORDS_EN) {
    if (hasKeyword(normalized, kw)) score += 8;
  }

  return score;
}

function scoreExclusions(text: string): number {
  let score = 0;
  const normalized = normalize(text);

  for (const kw of EXCLUSION_KEYWORDS) {
    if (hasKeyword(normalized, kw)) {
      const hasException = EXCLUSION_EXCEPTIONS.some((exc) => hasKeyword(normalized, exc));
      if (!hasException) {
        score += 20;
      }
    }
  }

  return score;
}

export function detectCategory(title: string, summary: string, content = ""): string {
  const primaryText = normalize(`${title} ${summary}`);
  const text = normalize(`${title} ${summary} ${content}`);

  const primaryCategory = scoreCategoryKeywords(primaryText);
  if (primaryCategory.score > 0) return primaryCategory.category;

  const primaryPriorityCategory = detectPriorityCategory(primaryText);
  if (primaryPriorityCategory) return primaryPriorityCategory;

  const priorityCategory = detectPriorityCategory(text);
  if (priorityCategory) return priorityCategory;

  return scoreCategoryKeywords(text).category;
}

function scoreCategoryKeywords(text: string): { category: string; score: number } {
  let bestCategory = "தமிழ்நாடு உள்ளூர்";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (hasKeyword(text, kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return { category: bestCategory, score: bestScore };
}

function categoryFromSource(value?: string): string | null {
  const normalized = normalize(value || "");
  return SOURCE_CATEGORY_MAP[normalized] || null;
}

export function filterTamilNadu(article: {
  title: string;
  summary: string;
  content: string;
  source: string;
  category?: string;
}): TNFilterResult {
  const text = `${article.title} ${article.summary} ${article.content}`;

  if (containsEntertainmentContent(article)) {
    return { relevant: false, category: "excluded", district: null, score: -100, reason: "Entertainment/cinema content is excluded" };
  }

  const tnScore = scoreTamilNadu(text);
  const exclusionScore = scoreExclusions(text);
  const district = detectDistrict(text);

  if (exclusionScore > 30) {
    return { relevant: false, category: "excluded", district: null, score: -exclusionScore, reason: "Contains non-TN related content" };
  }

  if (district || tnScore >= STRICT_TN_THRESHOLD) {
    const detectedCategory = detectCategory(article.title, article.summary, article.content);
    const sourceCategory = categoryFromSource(article.category);
    const category = sourceCategory && detectedCategory === "தமிழ்நாடு உள்ளூர்" ? sourceCategory : detectedCategory;
    return { relevant: true, category, district, score: tnScore, reason: "Strict Tamil Nadu relevance confirmed" };
  }

  return { relevant: false, category: "excluded", district: null, score: tnScore, reason: "No strict Tamil Nadu relevance detected" };
}
