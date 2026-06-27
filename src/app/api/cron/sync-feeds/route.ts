import { NextRequest, NextResponse } from "next/server";
import { syncAllFeeds } from "@/lib/rss/sync";
import { getErrorMessage } from "@/lib/api-errors";
import { isCronAuthorized } from "@/lib/route-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;


export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ status: "error", error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    const result = await syncAllFeeds({ reason: "cron_endpoint", skipIfFresh: true });
    return NextResponse.json({
      status: "ok",
      syncStatus: result.status,
      totalNew: result.totalNew,
      totalFound: result.totalFound,
      totalFiltered: result.totalFiltered,
      lastSyncStarted: result.lastSyncStarted,
      lastSyncCompleted: result.lastSyncCompleted,
      articlesAdded: result.articlesAdded,
      articlesSkipped: result.articlesSkipped,
      skippedReason: result.skippedReason,
      cleanup: result.cleanup,
      sources: result.sourceResults,
      schedule: request.headers.get("x-vercel-cron-schedule") || "manual",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ status: "error", error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
