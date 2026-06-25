import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
import { resolveArticleImage } from "@/lib/article-image";
import { type ArticleDbRow, errorStack, mapArticleRow } from "@/lib/api-utils";
import { balanceSources } from "@/lib/rss/balancer";
import { MAX_ARTICLES_HOME, NEWS_RETENTION_MS, TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";
import { isDisplayableNewsItem } from "@/lib/news-policy";
import { ensureFreshNewsAvailable } from "@/lib/news-bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  try {
    const db = getDbInstance();
    await ensureFreshNewsAvailable();
    const url = new URL(request.url);
    const limit = Math.min(MAX_ARTICLES_HOME, parseInt(url.searchParams.get("limit") || "10", 10));
    const since = url.searchParams.get("since") || "";
    const freshCutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();

    const allowedCategoryPlaceholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");
    let where = `retention != 'archived' AND category IN (${allowedCategoryPlaceholders}) AND published_at >= ?`;
    const params: unknown[] = [...TAMIL_NADU_NEWS_CATEGORIES, freshCutoff];

    if (since) {
      where += " AND created_at > ?";
      params.push(since);
    }

    params.push(limit);

    const rows = db.prepare(`
      SELECT id, title, headline, summary, content, source, source_url, source_logo_url,
             image_url, image_source, ai_image_url, ai_image_prompt, ai_image_generated_at,
             ai_video_url, video_status, video_prompt, video_generated_at, video_duration, video_thumbnail,
             animation_scene, animation_embed_url,
             district, plays_count, shares_count, saves_count, reactions_count,
             category, published_at, language, audio_generated, retention, created_at, updated_at,
             slug, search_keywords, tags
      FROM articles
      WHERE ${where}
      ORDER BY published_at DESC
      LIMIT ?
    `).all(...params) as ArticleDbRow[];

    const articles = balanceSources(rows.map((row) => mapArticleRow(row, {
      resolveImage: (article) => resolveArticleImage({
        imageUrl: article.image_url || "",
        imageSource: article.image_source || "",
        category: article.category || "",
        sceneName: article.ai_image_prompt || "",
      }),
    })).filter(isDisplayableNewsItem), { maxConsecutive: 1 });

    return NextResponse.json({ articles, total: articles.length });
  } catch (err: unknown) {
    console.error("[API Latest] Error:", errorStack(err));
    return NextResponse.json({ articles: [], total: 0 });
  }
}
