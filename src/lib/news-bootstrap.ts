import type Database from "better-sqlite3";
import { getDbInstance } from "@/lib/db";
import { NEWS_RETENTION_MS, TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";
import { syncAllFeeds } from "@/lib/rss/sync";

let bootstrapPromise: Promise<void> | null = null;

function countFreshDisplayableArticles(db: Database.Database): number {
  const freshCutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();
  const placeholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");
  const row = db.prepare(`
    SELECT COUNT(*) as count
    FROM articles
    WHERE retention != 'archived'
      AND category IN (${placeholders})
      AND published_at >= ?
  `).get(...TAMIL_NADU_NEWS_CATEGORIES, freshCutoff) as { count: number };
  return row.count;
}

export async function ensureFreshNewsAvailable(): Promise<{ before: number; after: number; synced: boolean; error?: string }> {
  const db = getDbInstance();
  const before = countFreshDisplayableArticles(db);
  if (before > 0) return { before, after: before, synced: false };

  if (!bootstrapPromise) {
    bootstrapPromise = syncAllFeeds()
      .then(() => undefined)
      .finally(() => {
        bootstrapPromise = null;
      });
  }

  try {
    await bootstrapPromise;
  } catch (err) {
    return {
      before,
      after: countFreshDisplayableArticles(db),
      synced: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return {
    before,
    after: countFreshDisplayableArticles(db),
    synced: true,
  };
}
