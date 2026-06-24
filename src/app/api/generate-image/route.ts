import { NextRequest, NextResponse } from "next/server";
import {
  generateSceneImage,
  generateAllMissingScenes,
  getSceneStatus,
} from "@/lib/scene-generator";
import { isValidScene, getAllSceneNames } from "@/lib/scenes";
import { triggerFullSceneGeneration } from "@/lib/image-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { scene, all } = body || {};

    if (all) {
      const result = await triggerFullSceneGeneration();
      return NextResponse.json({ success: true, ...result });
    }

    if (scene) {
      if (!isValidScene(scene)) {
        return NextResponse.json({ error: `Invalid scene. Valid: ${getAllSceneNames().join(", ")}` }, { status: 400 });
      }
      const result = await generateSceneImage(scene);
      return NextResponse.json(result);
    }

    const result = await generateAllMissingScenes({ maxPerBatch: 3, delayMs: 1500 });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = await getSceneStatus();
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
