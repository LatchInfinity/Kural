import { NextRequest, NextResponse } from "next/server";
import { isNewsAnimationScene, resolveNewsAnimationScene } from "@/lib/news-animation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnimationSceneBody {
  id?: string;
  newsId?: string;
  animationScene?: string | null;
  animationEmbedUrl?: string | null;
  category?: string | null;
  title?: string | null;
  headline?: string | null;
  summary?: string | null;
  content?: string | null;
  source?: string | null;
  retention?: string | null;
  isBreaking?: boolean | null;
}

interface ArticleSceneRow {
  id: string;
  title: string | null;
  headline: string | null;
  summary: string | null;
  content: string | null;
  source: string | null;
  category: string | null;
  retention: string | null;
  animation_scene: string | null;
  animation_embed_url: string | null;
}

function hasBodySceneInput(body: AnimationSceneBody): boolean {
  return Boolean(
    body.animationScene ||
    body.category ||
    body.title ||
    body.headline ||
    body.summary ||
    body.content ||
    body.source ||
    body.retention ||
    typeof body.isBreaking === "boolean"
  );
}

function jsonScene(scene: string, cached: boolean): NextResponse {
  return NextResponse.json(
    { scene, embedUrl: "", cached },
    { headers: { "Cache-Control": "no-store" } },
  );
}

async function readArticleScene(newsId: string): Promise<ArticleSceneRow | undefined> {
  if (!newsId) return undefined;

  try {
    const { getDbInstance } = await import("@/lib/db");
    const db = getDbInstance();
    return db.prepare(`
      SELECT id, title, headline, summary, content, source, category, retention, animation_scene, animation_embed_url
      FROM articles
      WHERE id = ?
    `).get(newsId) as ArticleSceneRow | undefined;
  } catch (error) {
    console.warn("[ANIMATION SCENE] DB_READ_FAILED", error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  let body: AnimationSceneBody = {};
  try {
    body = await request.json().catch(() => ({})) as AnimationSceneBody;
    const newsId = body.newsId || body.id || "";

    if (hasBodySceneInput(body)) {
      const scene = resolveNewsAnimationScene({
        animationScene: body.animationScene,
        category: body.category,
        title: body.title,
        headline: body.headline,
        summary: body.summary,
        content: body.content,
        source: body.source,
        retention: body.retention,
        isBreaking: body.isBreaking,
      });
      return jsonScene(scene, false);
    }

    const row = await readArticleScene(newsId);
    const contentScene = resolveNewsAnimationScene({
      category: row?.category ?? body.category,
      title: row?.title ?? body.title,
      headline: row?.headline ?? body.headline,
      summary: row?.summary ?? body.summary,
      content: row?.content ?? body.content,
      source: row?.source ?? body.source,
      retention: row?.retention ?? body.retention,
      isBreaking: body.isBreaking,
    });

    if (
      row?.animation_scene &&
      isNewsAnimationScene(row.animation_scene) &&
      !(row.animation_scene === "breaking" && contentScene !== "breaking")
    ) {
      return jsonScene(row.animation_scene, true);
    }

    const scene = resolveNewsAnimationScene({
      animationScene: row?.animation_scene === "breaking" && contentScene !== "breaking"
        ? contentScene
        : row?.animation_scene ?? body.animationScene,
      category: row?.category ?? body.category,
      title: row?.title ?? body.title,
      headline: row?.headline ?? body.headline,
      summary: row?.summary ?? body.summary,
      content: row?.content ?? body.content,
      source: row?.source ?? body.source,
      retention: row?.retention ?? body.retention,
      isBreaking: body.isBreaking,
    });

    return jsonScene(scene, false);
  } catch (error) {
    const scene = resolveNewsAnimationScene({
      animationScene: body.animationScene,
      category: body.category,
      title: body.title,
      headline: body.headline,
      summary: body.summary,
      content: body.content,
      source: body.source,
      retention: body.retention,
      isBreaking: body.isBreaking,
    });
    console.warn("[ANIMATION SCENE] FALLBACK", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { scene, embedUrl: "", cached: false, fallback: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
