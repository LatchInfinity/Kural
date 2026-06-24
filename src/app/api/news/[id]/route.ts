import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
import { type ArticleDbRow, mapArticleRow } from "@/lib/api-utils";
import { NEWS_RETENTION_MS, TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";
import { isDisplayableNewsItem } from "@/lib/news-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDbInstance();
  const freshCutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();
  const allowedCategoryPlaceholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");

  const row = db.prepare(`
    SELECT id, title, headline, summary, content, source, source_url, source_logo_url,
           image_url, image_source, ai_image_url, ai_image_prompt, ai_image_generated_at,
           ai_video_url, video_status, video_prompt, video_generated_at, video_duration, video_thumbnail,
           animation_scene, animation_embed_url, district,
           plays_count, shares_count, saves_count, reactions_count,
           category, published_at, language, audio_generated, retention, created_at, updated_at,
           slug, search_keywords, tags
    FROM articles WHERE id = ? AND category IN (${allowedCategoryPlaceholders}) AND published_at >= ?
  `).get(id, ...TAMIL_NADU_NEWS_CATEGORIES, freshCutoff) as ArticleDbRow | undefined;

  if (!row || !isDisplayableNewsItem(mapArticleRow(row))) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json(mapArticleRow(row));
}
