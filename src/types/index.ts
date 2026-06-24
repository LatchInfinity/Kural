export type NewsCategory =
  | "தமிழ்நாடு அரசியல்"
  | "தமிழ்நாடு அரசு"
  | "தமிழ்நாடு கல்வி"
  | "தமிழ்நாடு வணிகம்"
  | "தமிழ்நாடு தொழில்நுட்பம்"
  | "தமிழ்நாடு விளையாட்டு"
  | "தமிழ்நாடு விபத்து"
  | "தமிழ்நாடு குற்றம்"
  | "தமிழ்நாடு வானிலை"
  | "தமிழ்நாடு போக்குவரத்து"
  | "தமிழ்நாடு வேளாண்மை"
  | "தமிழ்நாடு உள்ளூர்";
export type TimePeriod = "all" | "morning" | "afternoon" | "evening" | "night";
export type ReactionType = "love" | "trending" | "celebrate" | "helpful";
export type RetentionCategory = "breaking" | "latest" | "recent" | "archived";
export type SyncStatus = "running" | "success" | "error";
export type VideoStatus = "pending" | "generating" | "completed" | "failed" | "disabled";

export type TimeFilter = "all" | "last-hour" | "today" | "last-3-days";

export interface NewsItem {
  id: string;
  title: string;
  headline: string;
  englishHeadline?: string;
  summary: string;
  tamilSummary: string;
  englishSummary: string;
  content: string;
  source: string;
  sourceUrl: string;
  sourceLogoUrl?: string;
  imageUrl: string;
  aiImageUrl?: string;
  aiVideoUrl?: string;
  videoStatus?: VideoStatus;
  videoPrompt?: string;
  videoGeneratedAt?: string;
  videoDuration?: number;
  videoThumbnail?: string;
  animationScene?: string;
  animationEmbedUrl?: string;
  district?: string;
  playsCount?: number;
  sharesCount?: number;
  savesCount?: number;
  reactionsCount?: number;
  category: NewsCategory;
  publishedAt: string;
  publishedHour: number;
  audioDuration: string;
  isBreaking?: boolean;
  trending?: boolean;
  retention?: RetentionCategory;
  translationProvider?: "google" | "local";
}

export interface RSSSource {
  id: string;
  name: string;
  nameTa: string;
  feedUrl: string;
  websiteUrl: string;
  logoUrl: string;
  active: boolean;
  lastFetchedAt: string | null;
  errorCount: number;
  lastError: string | null;
}

export interface SyncLog {
  id: string;
  sourceId: string;
  sourceName: string;
  startedAt: string;
  completedAt: string | null;
  status: SyncStatus;
  articlesFound: number;
  articlesNew: number;
  articlesDuplicate: number;
  error: string | null;
}

export interface AdminStats {
  totalArticles: number;
  todayArticles: number;
  breakingCount: number;
  recentCount: number;
  archivedCount: number;
  categoryBreakdown?: { category: string; count: number }[];
  healthySources: number;
  errorSources: number;
  lastSyncTime: string | null;
  sources: RSSSource[];
  recentSyncs: SyncLog[];
  feedErrors: { sourceName: string; errorMessage: string; occurredAt: string }[];
  totalPlays?: number;
  totalShares?: number;
  totalSaves?: number;
  totalReactions?: number;
  districtBreakdown?: { district: string; count: number }[];
  videoStatusBreakdown?: { status: string; count: number }[];
  videoCompletedCount?: number;
  videoPendingCount?: number;
  videoFailedCount?: number;
}

export interface Edition {
  id: string;
  label: string;
  labelTa: string;
  hours: [number, number];
  accent: string;
  accentSoft: string;
  accentGlow: string;
}

export type NewspaperView = "closed" | "opening" | "open" | "closing";
export type AudioMode = "hidden" | "minimized" | "expanded";

export interface Comment {
  id: string;
  newsId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
  replies: Comment[];
  reactions: string[];
  likes: number;
  likedBy: string[];
}

export interface StreakData {
  readingStreak: number;
  listeningStreak: number;
  bestReadingStreak: number;
  bestListeningStreak: number;
  lastReadDate: string | null;
  lastListenDate: string | null;
}

export interface DailyTask {
  id: string;
  label: string;
  labelTa: string;
  points: number;
  progress: number;
  target: number;
  completed: boolean;
}

export interface RewardData {
  points: number;
  level: number;
  dailyTasks: DailyTask[];
  claimedMilestones: number[];
  dailyCompletionBonusClaimed: boolean;
  lastDailyReset: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  password: string;
  profileImage: string;
  createdAt: number;
  streak: StreakData;
  rewards: RewardData;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}
