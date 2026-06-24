import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
import { getSceneStatus } from "@/lib/scene-generator";
import { getArticlesPendingAnalysis } from "@/lib/analyze-with-groq";
import { type ArticleDbRow } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isDiagnosticsEnabled(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.ENABLE_DIAG !== "true") return false;
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(secret && auth === secret);
}

export async function GET(request: NextRequest) {
  if (!isDiagnosticsEnabled(request)) {
    return NextResponse.json({ error: "Diagnostics are disabled" }, { status: 404 });
  }

  const results: Record<string, unknown> = {};

  try {
    results.hasGroqKey = Boolean(process.env.GROQ_API_KEY);
    results.hasOpenaiKey = Boolean(process.env.OPENAI_API_KEY);
    results.nodeEnv = process.env.NODE_ENV || "development";

    try {
      const sceneStatus = await getSceneStatus();
      results.scenes = {
        total: sceneStatus.total,
        existing: sceneStatus.existing,
        missing: sceneStatus.missing,
        ready: sceneStatus.existing === sceneStatus.total,
        list: sceneStatus.scenes,
      };
    } catch (e: unknown) {
      results.scenesError = e instanceof Error ? e.message : String(e);
    }

    try {
      const db = getDbInstance();
      const total = db.prepare("SELECT COUNT(*) as c FROM articles").get() as { c: number };
      results.articlesTotal = total.c;
      const active = db.prepare("SELECT COUNT(*) as c FROM articles WHERE retention != 'archived'").get() as { c: number };
      results.activeArticles = active.c;
      const withScene = db.prepare("SELECT COUNT(*) as c FROM articles WHERE ai_image_prompt IS NOT NULL AND ai_image_prompt != '' AND ai_image_prompt != 'unavailable'").get() as { c: number };
      results.articlesWithScene = withScene.c;
      const samples = db.prepare("SELECT id, title, image_url, image_source, category, ai_image_prompt, source, source_url, source_logo_url, summary, content, headline, ai_image_url, ai_video_url, video_status, video_prompt, video_generated_at, video_duration, video_thumbnail, district, plays_count, shares_count, saves_count, reactions_count, published_at, retention FROM articles WHERE retention != 'archived' ORDER BY published_at DESC LIMIT 5").all() as ArticleDbRow[];
      results.sampleArticles = samples.map((row) => ({
        id: row.id.slice(0, 8),
        title: row.title?.slice(0, 60),
        imageUrl: row.image_url,
        imageSource: row.image_source,
        category: row.category,
        scene: row.ai_image_prompt,
      }));
    } catch (dbErr: unknown) {
      results.dbError = dbErr instanceof Error ? dbErr.message : String(dbErr);
    }

    try {
      const pendingAnalysis = getArticlesPendingAnalysis();
      results.pendingAnalysis = pendingAnalysis.length;
    } catch {
      results.pendingAnalysis = "unavailable";
    }
  } catch (err: unknown) {
    results.fatalError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(results);
}
