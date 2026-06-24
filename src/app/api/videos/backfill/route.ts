import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
import { backfillArticleVideos } from "@/lib/news-video";
import { repairArticleCategoriesAndVideos } from "@/lib/news-repair";
import { isAdminAuthorized } from "@/lib/route-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function runBackfill(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Admin API disabled" }, { status: 404 });
  }

  const db = getDbInstance();
  const url = new URL(request.url);
  if (url.searchParams.get("repair") === "1") {
    const result = repairArticleCategoriesAndVideos(db);
    return NextResponse.json({
      status: "ok",
      mode: "repair",
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  const updated = backfillArticleVideos(db);
  return NextResponse.json({
    status: "ok",
    mode: "backfill",
    updated,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return runBackfill(request);
}

export async function POST(request: NextRequest) {
  return runBackfill(request);
}
