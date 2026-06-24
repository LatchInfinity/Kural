import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
import { NEWS_RETENTION_MS, TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const db = getDbInstance();
  const url = new URL(request.url);
  const since = url.searchParams.get("since") || "";
  const freshCutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();

  const allowedCategoryPlaceholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");
  let where = `retention != 'archived' AND category IN (${allowedCategoryPlaceholders}) AND published_at >= ?`;
  const params: unknown[] = [...TAMIL_NADU_NEWS_CATEGORIES, freshCutoff];

  if (since) {
    where += " AND created_at > ?";
    params.push(since);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM articles WHERE ${where}`).get(...params) as { total: number };

  return NextResponse.json({
    count: countRow.total,
    timestamp: new Date().toISOString(),
  });
}
