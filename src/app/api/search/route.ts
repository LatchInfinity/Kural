import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
import { resolveArticleImage } from "@/lib/article-image";
import { type ArticleDbRow, errorStack, mapArticleRow } from "@/lib/api-utils";
import { NEWS_RETENTION_MS, TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";
import { isDisplayableNewsItem } from "@/lib/news-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDbInstance();
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20", 10));

    if (!q.trim()) {
      return NextResponse.json({ articles: [], query: q });
    }

    const searchTerm = `%${q}%`;
    const freshCutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();
    const allowedCategoryPlaceholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");
    const rows = db.prepare(`
      SELECT id, title, headline, summary, content, source, source_url, source_logo_url,
             image_url, image_source, ai_image_url, ai_image_prompt, ai_image_generated_at,
             ai_video_url, video_status, video_prompt, video_generated_at, video_duration, video_thumbnail,
             animation_scene, animation_embed_url,
             district, plays_count, shares_count, saves_count, reactions_count,
             category, published_at, language, audio_generated, retention, created_at, updated_at,
             slug, search_keywords, tags
      FROM articles
      WHERE retention != 'archived'
        AND category IN (${allowedCategoryPlaceholders})
        AND published_at >= ?
        AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR source LIKE ? OR category LIKE ? OR search_keywords LIKE ?)
      ORDER BY published_at DESC
      LIMIT ?
    `).all(...TAMIL_NADU_NEWS_CATEGORIES, freshCutoff, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit) as ArticleDbRow[];

    const articles = rows.map((row) => mapArticleRow(row, {
      resolveImage: (article) => resolveArticleImage({
        imageUrl: article.image_url || "",
        imageSource: article.image_source || "",
        category: article.category || "",
        sceneName: article.ai_image_prompt || "",
      }),
    })).filter(isDisplayableNewsItem);

    return NextResponse.json({ articles, query: q, total: articles.length });
  } catch (err: unknown) {
    console.error("[API Search] Error:", errorStack(err));
    return NextResponse.json({ articles: [], query: "", total: 0 });
  }
}
