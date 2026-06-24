import { NextRequest, NextResponse } from "next/server";
import { cleanupStoredArticles, getDbInstance } from "@/lib/db";
import { getErrorMessage, getErrorStack } from "@/lib/api-errors";
import { isCronAuthorized } from "@/lib/route-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ status: "error", error: "Unauthorized cleanup request" }, { status: 401 });
  }

  try {
    const db = getDbInstance();
    const cleanup = cleanupStoredArticles(db);
    const remaining = db.prepare("SELECT COUNT(*) as count FROM articles").get() as { count: number };
    return NextResponse.json({
      status: "ok",
      deleted: cleanup.expired + cleanup.blocked,
      expired: cleanup.expired,
      blocked: cleanup.blocked,
      remaining: remaining.count,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[API Cleanup] Error:", getErrorStack(err));
    return NextResponse.json({ status: "error", error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
