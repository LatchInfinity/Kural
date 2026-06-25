import { NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
import { NEWS_RETENTION_MS, TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";
import { ensureFreshNewsAvailable } from "@/lib/news-bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 120;

export async function GET() {
  try {
    const db = getDbInstance();
    await ensureFreshNewsAvailable();
    const freshCutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();

    const allowedCategoryPlaceholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");
    const rows = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM articles
      WHERE retention != 'archived' AND category IN (${allowedCategoryPlaceholders}) AND published_at >= ?
      GROUP BY category
      ORDER BY count DESC
    `).all(...TAMIL_NADU_NEWS_CATEGORIES, freshCutoff) as { category: string; count: number }[];

    const allCategories = [...TAMIL_NADU_NEWS_CATEGORIES];

    const countMap = new Map(rows.map(r => [r.category, r.count]));
    const categories = allCategories.map(name => ({
      name,
      count: countMap.get(name) || 0,
    }));

    return NextResponse.json({ categories, total: rows.reduce((s, r) => s + r.count, 0) });
  } catch (err) {
    console.error("[API Categories] Error:", err instanceof Error ? err.stack || err.message : err);
    return NextResponse.json({ categories: [], total: 0 }, { status: 500 });
  }
}
