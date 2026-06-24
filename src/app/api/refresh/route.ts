import { NextRequest, NextResponse } from "next/server";
import { syncAllFeeds } from "@/lib/rss/sync";
import { logger } from "@/lib/logger";
import { getErrorMessage, getErrorStack } from "@/lib/api-errors";
import { isCronAuthorized } from "@/lib/route-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;


export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ status: "error", error: "Unauthorized refresh request" }, { status: 401 });
  }

  const startTime = Date.now();
  logger.info("API Refresh", "Manual refresh triggered");
  try {
    const result = await syncAllFeeds();
    const duration = Date.now() - startTime;
    logger.info("API Refresh", "Manual refresh completed", {
      durationMs: duration,
      totalNew: result.totalNew,
      totalFound: result.totalFound,
      totalFiltered: result.totalFiltered,
      cleanup: result.cleanup,
    });
    return NextResponse.json({
      status: "ok",
      duration: `${duration}ms`,
      totalNew: result.totalNew,
      totalFound: result.totalFound,
      totalFiltered: result.totalFiltered,
      cleanup: result.cleanup,
      sources: result.sourceResults,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    logger.error("API Refresh", "Manual refresh failed", { error: getErrorStack(err) });
    return NextResponse.json({
      status: "error",
      error: getErrorMessage(err),
      duration: `${Date.now() - startTime}ms`,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
