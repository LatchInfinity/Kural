export const NEWS_RETENTION_DAYS = 2;
export const NEWS_PER_CATEGORY = 5;
export const SYNC_INTERVAL_MINUTES = 5;
export const MAX_ARTICLES_HOME = 50;
export const VIDEO_ENABLED = true;
export const VIDEO_DURATION_SECONDS = 5;
export const VIDEO_RESOLUTION = "720p";
export const VIDEO_STYLE = "3d-cartoon";
export const VIDEO_STORAGE = "local";
export const VIDEO_AUTO_DELETE_DAYS = NEWS_RETENTION_DAYS;

export const NEWS_RETENTION_HOURS = NEWS_RETENTION_DAYS * 24;
export const NEWS_RETENTION_MS = NEWS_RETENTION_HOURS * 60 * 60 * 1000;
export const SYNC_INTERVAL_MS = SYNC_INTERVAL_MINUTES * 60 * 1000;

export const TAMIL_NADU_NEWS_CATEGORIES = [
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

export const BLOCKED_NEWS_CATEGORIES = [
  "தமிழ்நாடு பொழுதுபோக்கு",
  "பொழுதுபோக்கு",
  "entertainment",
  "cinema",
  "movies",
  "movie",
  "kollywood",
] as const;

export const ENTERTAINMENT_KEYWORDS = [
  "cinema",
  "kollywood",
  "celebrity",
  "movie review",
  "movie reviews",
  "movie",
  "film",
  "films",
  "ott",
  "tv show",
  "tv shows",
  "serial",
  "actor",
  "actress",
  "music launch",
  "audio launch",
  "trailer",
  "teaser",
  "box office",
  "film promotion",
  "film promotions",
  "திரைப்படம்",
  "திரைப்படங்கள்",
  "சினிமா",
  "கோலிவுட்",
  "நடிகர்",
  "நடிகை",
  "இயக்குனர்",
  "ஓடிடி",
  "தொலைக்காட்சி தொடர்",
  "சீரியல்",
  "டிரெய்லர்",
  "டீசர்",
  "பாக்ஸ் ஆபிஸ்",
  "இசை வெளியீடு",
  "பட விமர்சனம்",
  "திரை விமர்சனம்",
] as const;
