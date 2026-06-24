import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
import { type ArticleDbRow, mapArticleRow } from "@/lib/api-utils";
import { NEWS_RETENTION_MS, TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";
import { isDisplayableNewsItem } from "@/lib/news-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const db = getDbInstance();
  const url = new URL(request.url);
  const limit = Math.min(20, parseInt(url.searchParams.get("limit") || "10", 10));
  const freshCutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();
  const allowedCategoryPlaceholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");

  const rows = db.prepare(`
    SELECT id, title, headline, summary, content, source, source_url, source_logo_url,
           image_url, image_source, ai_image_url, ai_image_prompt, ai_image_generated_at,
           ai_video_url, video_status, video_prompt, video_generated_at, video_duration, video_thumbnail,
           animation_scene, animation_embed_url, district,
           plays_count, shares_count, saves_count, reactions_count,
           category, published_at, retention
    FROM articles
    WHERE retention != 'archived' AND category IN (${allowedCategoryPlaceholders}) AND published_at >= ?
    ORDER BY (plays_count + shares_count + saves_count + reactions_count) DESC, published_at DESC
    LIMIT ?
  `).all(...TAMIL_NADU_NEWS_CATEGORIES, freshCutoff, limit) as ArticleDbRow[];

  return NextResponse.json({ articles: rows.map((row) => ({ ...mapArticleRow(row), trending: true })).filter(isDisplayableNewsItem) });
}
