import { NextRequest, NextResponse } from "next/server";
import { resolveNewsAnimationScene } from "@/lib/news-animation";

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

export async function POST(request: NextRequest) {
  let body: AnimationSceneBody = {};
  try {
    body = await request.json().catch(() => ({})) as AnimationSceneBody;

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
