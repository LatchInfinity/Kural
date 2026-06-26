import { NextRequest, NextResponse } from "next/server";
import { cleanupStoredArticles, getDbInstance } from "@/lib/db";
import { type ArticleDbRow, mapArticleRow } from "@/lib/api-utils";
import { balanceSources } from "@/lib/rss/balancer";
import { MAX_ARTICLES_HOME, NEWS_PER_CATEGORY, NEWS_RETENTION_MS, TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";
import { isDisplayableNewsCategory, isDisplayableNewsItem } from "@/lib/news-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SORT_OPTIONS = {
  published_at: "published_at DESC",
  trending: "plays_count + shares_count + saves_count + reactions_count DESC, published_at DESC",
} as const;

const ARTICLE_SELECT_FIELDS = `
  id, title, headline, summary, content, source, source_url, source_logo_url,
  image_url, image_source, ai_image_url, ai_image_prompt, ai_image_generated_at,
  ai_video_url, video_status, video_prompt, video_generated_at, video_duration, video_thumbnail,
  animation_scene, animation_embed_url, district,
  plays_count, shares_count, saves_count, reactions_count,
  category, published_at, language, audio_generated, retention, created_at, updated_at,
  slug, search_keywords, tags
`;

function limitArticlesPerCategory<T extends { category?: string }>(items: T[]): T[] {
  const counts = new Map<string, number>();
  return items.filter((item) => {
    const category = item.category || "unknown";
    const count = counts.get(category) || 0;
    if (count >= NEWS_PER_CATEGORY) return false;
    counts.set(category, count + 1);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const db = getDbInstance();

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(MAX_ARTICLES_HOME, Math.max(1, parseInt(url.searchParams.get("limit") || String(MAX_ARTICLES_HOME), 10)));
  const offset = (page - 1) * limit;
  const retention = url.searchParams.get("retention") || "active";
  const category = url.searchParams.get("category") || "";
  const source = url.searchParams.get("source") || "";
  const search = url.searchParams.get("search") || "";
  const since = url.searchParams.get("since") || "";
  const timeFilter = url.searchParams.get("timeFilter") || "";
  const district = url.searchParams.get("district") || "";
  const sort = url.searchParams.get("sort") || "published_at";
  const freshCutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCutoff = todayStart.toISOString();
  const maxCategoryArticles = NEWS_PER_CATEGORY * TAMIL_NADU_NEWS_CATEGORIES.length;

  cleanupStoredArticles(db);

  const allowedCategoryPlaceholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");
  let where = `category IN (${allowedCategoryPlaceholders})`;
  const params: unknown[] = [...TAMIL_NADU_NEWS_CATEGORIES];

  where += " AND published_at >= ?";
  params.push(freshCutoff);

  if (retention === "active") {
    where += " AND retention != 'archived'";
  } else if (retention !== "all") {
    where += " AND retention = ?";
    params.push(retention);
  }

  if (category) {
    if (!isDisplayableNewsCategory(category)) {
      return NextResponse.json({
        articles: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      });
    }
    where += " AND category = ?";
    params.push(category);
  }

  if (source) {
    where += " AND source = ?";
    params.push(source);
  }

  if (search) {
    where += " AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR search_keywords LIKE ?)";
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  if (since) {
    where += " AND created_at > ?";
    params.push(since);
  }

  if (district) {
    where += " AND district = ?";
    params.push(district);
  }

  if (timeFilter) {
    const now = new Date();
    let sinceDate: Date;
    switch (timeFilter) {
      case "last-hour":
        sinceDate = new Date(now.getTime() - 60 * 60 * 1000);
        where += " AND published_at >= ?";
        params.push(sinceDate.toISOString());
        break;
      case "today": {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        where += " AND published_at >= ?";
        params.push(startOfDay.toISOString());
        break;
      }
      case "last-3-days":
        sinceDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        where += " AND published_at >= ?";
        params.push(sinceDate.toISOString());
        break;
    }
  }

  const orderBy = sort === "trending" ? SORT_OPTIONS.trending : SORT_OPTIONS.published_at;

  const rankedParams: unknown[] = [todayCutoff, ...params, NEWS_PER_CATEGORY];
  const countRow = db.prepare(`
    WITH ranked_articles AS (
      SELECT category,
             ROW_NUMBER() OVER (
               PARTITION BY category
               ORDER BY CASE WHEN published_at >= ? THEN 0 ELSE 1 END, ${orderBy}
             ) as category_rank
      FROM articles
      WHERE ${where}
    )
    SELECT COUNT(*) as total
    FROM ranked_articles
    WHERE category_rank <= ?
  `).get(...rankedParams) as { total: number };
  const total = countRow.total;

  const rows = db.prepare(`
    WITH ranked_articles AS (
      SELECT ${ARTICLE_SELECT_FIELDS},
             ROW_NUMBER() OVER (
               PARTITION BY category
               ORDER BY CASE WHEN published_at >= ? THEN 0 ELSE 1 END, ${orderBy}
             ) as category_rank
      FROM articles
      WHERE ${where}
    )
    SELECT ${ARTICLE_SELECT_FIELDS}
    FROM ranked_articles
    WHERE category_rank <= ?
    ORDER BY CASE WHEN published_at >= ? THEN 0 ELSE 1 END, ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...rankedParams, todayCutoff, Math.max(limit, maxCategoryArticles), offset) as ArticleDbRow[];

  const mapped = rows.map((row) => mapArticleRow(row)).filter(isDisplayableNewsItem);
  const balanced = balanceSources(mapped, { maxConsecutive: 1, sortByRecency: sort !== "trending" });
  const articles = limitArticlesPerCategory(balanced).slice(0, limit);

  return NextResponse.json({
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    },
  });
}
