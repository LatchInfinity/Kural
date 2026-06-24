import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as AnimationSceneBody;
    const newsId = body.newsId || body.id || "";
    const db = getDbInstance();
    const row = newsId
      ? db.prepare(`
          SELECT id, title, headline, summary, content, source, category, retention, animation_scene, animation_embed_url
          FROM articles
          WHERE id = ?
        `).get(newsId) as ArticleSceneRow | undefined
      : undefined;

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
      if (row.id && row.animation_embed_url) {
        db.prepare("UPDATE articles SET animation_embed_url = '', updated_at = datetime('now') WHERE id = ?")
          .run(row.id);
      }
      return NextResponse.json({
        scene: row.animation_scene,
        embedUrl: "",
        cached: true,
      });
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

    if (row?.id) {
      db.prepare("UPDATE articles SET animation_scene = ?, animation_embed_url = ?, updated_at = datetime('now') WHERE id = ?")
        .run(scene, "", row.id);
    }

    return NextResponse.json({ scene, embedUrl: "", cached: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
