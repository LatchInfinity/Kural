import { NextRequest, NextResponse } from "next/server";
import { cleanupStoredArticles, getDbInstance } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/route-auth";
import { TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SourceRow {
  id: string;
  name: string;
  name_ta: string;
  feed_url: string;
  website_url: string | null;
  logo_url: string | null;
  category: string | null;
  active: number;
  last_fetched_at: string | null;
  error_count: number;
  last_error: string | null;
}

interface SyncLogRow {
  id: string;
  source_id: string | null;
  source_name: string | null;
  started_at: string;
  completed_at: string | null;
  status: string;
  articles_found: number;
  articles_new: number;
  articles_duplicate: number;
  error: string | null;
}

interface FeedErrorRow {
  source_name: string | null;
  error_message: string | null;
  occurred_at: string;
}

interface TrendRow {
  totalPlays: number;
  totalShares: number;
  totalSaves: number;
  totalReactions: number;
}

interface VideoStatusRow {
  status: string;
  count: number;
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Admin API disabled" }, { status: 404 });
  }

  const db = getDbInstance();
  cleanupStoredArticles(db);
  const allowedCategoryPlaceholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };
  const todayRow = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE date(published_at) = date('now') AND category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };
  const breakingRow = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE retention = 'breaking' AND category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };
  const recentRow = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE retention = 'recent' AND category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };
  const archivedRow = db.prepare("SELECT COUNT(*) as count FROM articles WHERE retention = 'archived'").get() as { count: number };

  const categoryBreakdown = db.prepare(`
    SELECT category, COUNT(*) as count FROM articles WHERE category IN (${allowedCategoryPlaceholders}) GROUP BY category ORDER BY count DESC
  `).all(...TAMIL_NADU_NEWS_CATEGORIES) as { category: string; count: number }[];

  const sources = db.prepare(`
    SELECT id, name, name_ta, feed_url, website_url, logo_url, category, active,
           last_fetched_at, error_count, last_error
    FROM rss_sources ORDER BY name
  `).all() as SourceRow[];

  const healthySources = sources.filter((source) => Boolean(source.active) && source.error_count < 3).length;
  const errorSources = sources.filter((source) => source.error_count >= 3).length;

  const recentSyncs = db.prepare(`
    SELECT id, source_id, source_name, started_at, completed_at, status,
           articles_found, articles_new, articles_duplicate, error
    FROM sync_logs ORDER BY started_at DESC LIMIT 30
  `).all() as SyncLogRow[];

  const feedErrors = db.prepare(`
    SELECT source_name, error_message, occurred_at
    FROM feed_errors ORDER BY occurred_at DESC LIMIT 20
  `).all() as FeedErrorRow[];

  const lastSyncRow = db.prepare("SELECT MAX(started_at) as last FROM sync_logs").get() as { last: string | null };

  const trendRow = db.prepare(`
    SELECT COALESCE(SUM(plays_count), 0) as totalPlays,
           COALESCE(SUM(shares_count), 0) as totalShares,
           COALESCE(SUM(saves_count), 0) as totalSaves,
           COALESCE(SUM(reactions_count), 0) as totalReactions
    FROM articles WHERE retention != 'archived' AND category IN (${allowedCategoryPlaceholders})
  `).get(...TAMIL_NADU_NEWS_CATEGORIES) as TrendRow;

  const districtBreakdown = db.prepare(`
    SELECT district, COUNT(*) as count
    FROM articles
    WHERE district IS NOT NULL AND district != '' AND category IN (${allowedCategoryPlaceholders})
    GROUP BY district
    ORDER BY count DESC
    LIMIT 10
  `).all(...TAMIL_NADU_NEWS_CATEGORIES) as { district: string; count: number }[];

  const videoStatusBreakdown = db.prepare(`
    SELECT COALESCE(NULLIF(video_status, ''), 'pending') as status, COUNT(*) as count
    FROM articles
    WHERE retention != 'archived' AND category IN (${allowedCategoryPlaceholders})
    GROUP BY COALESCE(NULLIF(video_status, ''), 'pending')
    ORDER BY count DESC
  `).all(...TAMIL_NADU_NEWS_CATEGORIES) as VideoStatusRow[];

  const videoCompletedCount = videoStatusBreakdown.find((row) => row.status === "completed")?.count || 0;
  const videoPendingCount = videoStatusBreakdown
    .filter((row) => row.status === "pending" || row.status === "generating")
    .reduce((sum, row) => sum + row.count, 0);
  const videoFailedCount = videoStatusBreakdown.find((row) => row.status === "failed")?.count || 0;

  return NextResponse.json({
    totalArticles: totalRow.count,
    todayArticles: todayRow.count,
    breakingCount: breakingRow.count,
    recentCount: recentRow.count,
    archivedCount: archivedRow.count,
    categoryBreakdown,
    healthySources,
    errorSources,
    lastSyncTime: lastSyncRow.last,
    sources: sources.map((source) => ({
      id: source.id,
      name: source.name,
      nameTa: source.name_ta,
      feedUrl: source.feed_url,
      websiteUrl: source.website_url || "",
      logoUrl: source.logo_url || "",
      category: source.category || "general",
      active: Boolean(source.active),
      lastFetchedAt: source.last_fetched_at,
      errorCount: source.error_count,
      lastError: source.last_error,
    })),
    recentSyncs: recentSyncs.map((sync) => ({
      id: sync.id,
      sourceId: sync.source_id || "",
      sourceName: sync.source_name || "All sources",
      startedAt: sync.started_at,
      completedAt: sync.completed_at,
      status: sync.status,
      articlesFound: sync.articles_found,
      articlesNew: sync.articles_new,
      articlesDuplicate: sync.articles_duplicate,
      error: sync.error,
    })),
    feedErrors: feedErrors.map((feedError) => ({
      sourceName: feedError.source_name || "Unknown source",
      errorMessage: feedError.error_message || "Unknown error",
      occurredAt: feedError.occurred_at,
    })),
    totalPlays: trendRow.totalPlays,
    totalShares: trendRow.totalShares,
    totalSaves: trendRow.totalSaves,
    totalReactions: trendRow.totalReactions,
    districtBreakdown,
    videoStatusBreakdown,
    videoCompletedCount,
    videoPendingCount,
    videoFailedCount,
  });
}
