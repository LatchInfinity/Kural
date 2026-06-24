import { NextRequest, NextResponse } from "next/server";
import { scanMissingImages, repairArticleImages } from "@/lib/image-pipeline";
import { getErrorMessage, getErrorStack } from "@/lib/api-errors";
import { isCronAuthorized } from "@/lib/route-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ status: "error", error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 10, 1), 500);
    const maxRetries = Math.min(Math.max(Number(url.searchParams.get("retries")) || 3, 0), 5);

    console.log(`[IMAGE] BACKFILL starting limit=${limit} maxRetries=${maxRetries}`);

    const { missingImage, missingAiImage, total, rows } = scanMissingImages(limit);

    if (rows.length === 0) {
      console.log(`[IMAGE] BACKFILL complete - no articles need repair`);
      return NextResponse.json({
        status: "ok",
        scanned: 0,
        generated: 0,
        failed: 0,
        fallbackUsed: 0,
        remaining: 0,
        dbStats: { total, missingImage, missingAiImage },
        message: "No articles need images",
      });
    }

    const result = repairArticleImages(rows, maxRetries);

    console.log(`[IMAGE] BACKFILL complete scanned=${result.scanned} generated=${result.generated} failed=${result.failed} fallback=${result.fallbackUsed} remaining=${result.remaining}`);

    return NextResponse.json({
      status: "ok",
      ...result,
      dbStats: { total, missingImage, missingAiImage },
    });
  } catch (err: unknown) {
    console.error("[IMAGE] BACKFILL error:", getErrorStack(err));
    return NextResponse.json({ status: "error", error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
