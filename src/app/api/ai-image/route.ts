import { stableImageSeed } from "@/lib/ai-image-url";
import { ensureCachedAiImage, readCachedAiImage, readRelatedCachedAiImage, aiImageCacheKey } from "@/lib/ai-image-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clampNumber(value: string | null, fallback: number, min: number, max: number): number {
  if (!value || !value.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function imageResponse(buffer: Buffer, cacheStatus: string, key: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Image-Cache": cacheStatus,
      "X-Image-Topic": key,
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const prompt = (url.searchParams.get("prompt") || "").trim();
  const topicKey = (url.searchParams.get("topic") || "").trim();
  const width = clampNumber(url.searchParams.get("width"), 800, 320, 1280);
  const height = clampNumber(url.searchParams.get("height"), 450, 240, 720);
  const seed = clampNumber(url.searchParams.get("seed"), stableImageSeed(topicKey || prompt), 1, 4294967295);
  const key = aiImageCacheKey({ topicKey, prompt, width, height, seed });

  const cached = await readCachedAiImage(key);
  if (cached) {
    console.log(`[IMAGE GENERATED] route=/api/ai-image cache=hit topic=${key} bytes=${cached.length}`);
    return imageResponse(cached, "hit", key);
  }

  if (!prompt) {
    console.warn(`[IMAGE FALLBACK] route=/api/ai-image reason=missing_prompt topic=${key}`);
    return new Response("AI image prompt missing", { status: 400 });
  }

  const result = await ensureCachedAiImage({ topicKey, prompt, width, height, seed });
  if (!result.buffer) {
    const related = await readRelatedCachedAiImage(result.key);
    if (related) {
      console.warn(`[IMAGE FALLBACK] route=/api/ai-image reason=${result.error || "generation_failed"} topic=${result.key} related=${related.key}`);
      return imageResponse(related.buffer, "related-hit", related.key);
    }
    return new Response(result.error || "AI image generation failed", { status: 503 });
  }

  return imageResponse(result.buffer, result.generated ? "miss" : "pending-hit", result.key);
}
