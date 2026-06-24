import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const db = getDbInstance();
  const body = await request.json();
  const { articleId, action } = body;

  if (!articleId || !action) {
    return NextResponse.json({ error: "articleId and action required" }, { status: 400 });
  }

  const validActions = ["play", "share", "save", "unsave", "react"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const colMap: Record<string, string> = {
    play: "plays_count",
    share: "shares_count",
    save: "saves_count",
    unsave: "saves_count",
    react: "reactions_count",
  };

  const col = colMap[action];
  const delta = action === "unsave" ? -1 : 1;

  db.prepare(`UPDATE articles SET ${col} = MAX(0, ${col} + ?), updated_at = datetime('now') WHERE id = ?`).run(delta, articleId);

  return NextResponse.json({ success: true });
}
