import type { NewsItem } from "@/types";
import { buildEnglishSummary, buildNewsContent, buildNewsSummary, cleanNewsTitle } from "@/lib/news-text";
import { resolveArticleVideo } from "@/lib/news-video";
import { getArticleTopicImage } from "@/lib/ai-image-url";

export interface ArticleDbRow {
  id: string;
  title: string;
  headline: string | null;
  summary: string | null;
  content: string | null;
  source: string;
  source_url: string | null;
  source_logo_url: string | null;
  image_url: string | null;
  image_source?: string | null;
  ai_image_url: string | null;
  ai_image_prompt?: string | null;
  ai_image_generated_at?: string | null;
  ai_video_url?: string | null;
  video_status?: NewsItem["videoStatus"] | null;
  video_prompt?: string | null;
  video_generated_at?: string | null;
  video_duration?: number | null;
  video_thumbnail?: string | null;
  animation_scene?: string | null;
  animation_embed_url?: string | null;
  district: string | null;
  plays_count: number | null;
  shares_count: number | null;
  saves_count: number | null;
  reactions_count: number | null;
  category: string | null;
  published_at: string;
  language?: string | null;
  audio_generated?: number | null;
  retention: NewsItem["retention"] | null;
  created_at?: string | null;
  updated_at?: string | null;
  slug?: string | null;
  search_keywords?: string | null;
  tags?: string | null;
}

export interface ArticleApiItem extends NewsItem {
  imageSource?: string;
  slug?: string;
  searchKeywords?: string;
  tags?: string;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function errorStack(error: unknown): string {
  return error instanceof Error ? error.stack || error.message : String(error);
}

export function mapArticleRow(
  row: ArticleDbRow,
  _options: { resolveImage?: (row: ArticleDbRow) => string } = {},
): ArticleApiItem {
  const headline = cleanNewsTitle(row.headline || row.title);
  const title = cleanNewsTitle(row.title);
  const content = buildNewsContent(row.summary || "", row.content || "", headline);
  const summary = buildNewsSummary(row.summary || "", content, headline);
  const category = (row.category || "தமிழ்நாடு உள்ளூர்") as NewsItem["category"];
  const retention = row.retention || "recent";
  const topicImage = getArticleTopicImage({
    headline,
    title,
    summary,
    content,
    category,
    district: row.district || "",
    source: row.source,
    keywords: [row.search_keywords || "", row.tags || ""],
  });
  const englishSummary = buildEnglishSummary({ headline, summary, content, category });
  const resolvedVideo = resolveArticleVideo({
    id: row.id,
    title,
    headline,
    summary,
    content,
    category,
    district: row.district || "",
    keywords: [row.search_keywords || "", row.tags || ""],
    thumbnailUrl: topicImage.url,
  });
  const aiVideoUrl = row.ai_video_url || resolvedVideo.aiVideoUrl;
  const videoThumbnail = topicImage.url;

  return {
    id: row.id,
    title,
    headline,
    summary,
    tamilSummary: summary,
    englishSummary,
    content,
    source: row.source,
    sourceUrl: row.source_url || "",
    sourceLogoUrl: row.source_logo_url || "",
    imageUrl: topicImage.url,
    aiImageUrl: topicImage.url,
    aiVideoUrl,
    videoStatus: row.video_status || resolvedVideo.videoStatus,
    videoPrompt: row.video_prompt || resolvedVideo.videoPrompt,
    videoGeneratedAt: row.video_generated_at || row.created_at || resolvedVideo.videoGeneratedAt,
    videoDuration: row.video_duration || resolvedVideo.videoDuration,
    videoThumbnail,
    animationScene: row.animation_scene || "",
    animationEmbedUrl: row.animation_embed_url || "",
    district: row.district || "",
    playsCount: row.plays_count || 0,
    sharesCount: row.shares_count || 0,
    savesCount: row.saves_count || 0,
    reactionsCount: row.reactions_count || 0,
    category,
    publishedAt: row.published_at,
    publishedHour: new Date(row.published_at).getHours(),
    retention,
    audioDuration: "",
    isBreaking: retention === "breaking",
    trending: retention === "breaking",
    imageSource: row.image_source || "",
    slug: row.slug || "",
    searchKeywords: row.search_keywords || "",
    tags: row.tags || "",
  };
}
