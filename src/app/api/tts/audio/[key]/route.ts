import { NextRequest, NextResponse } from "next/server";
import {
  getCachedAudioInfo,
  isValidTtsCacheKey,
  readCachedAudio,
  type CachedAudioInfo,
} from "@/lib/tts-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AudioRouteContext {
  params: Promise<{ key: string }>;
}

function headerSafe(value: string): string {
  const safe = value.replace(/[^\x20-\x7E]/g, "").trim();
  return safe || "Generated voice";
}

function audioHeaders(info: CachedAudioInfo, extra?: Record<string, string>): HeadersInit {
  return {
    "Content-Type": info.meta.contentType,
    "Content-Length": String(info.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Kural-TTS": info.meta.provider,
    "X-Kural-TTS-Cache": "HIT",
    ...(info.meta.voiceId ? { "X-Kural-Voice-Id": info.meta.voiceId } : {}),
    "X-Kural-Voice-Name": headerSafe(info.meta.voiceName),
    ...extra,
  };
}

function audioBody(audio: Buffer): ArrayBuffer {
  const bytes = new Uint8Array(audio.byteLength);
  bytes.set(audio);
  return bytes.buffer;
}

function parseRange(value: string | null, size: number): { start: number; end: number } | null {
  if (!value) return null;
  const match = value.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return null;

  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    return {
      start: Math.max(0, size - suffixLength),
      end: size - 1,
    };
  }

  const start = Number(rawStart);
  const end = rawEnd ? Number(rawEnd) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
    return null;
  }

  return {
    start,
    end: Math.min(end, size - 1),
  };
}

async function resolveInfo(context: AudioRouteContext): Promise<{ key: string; info: CachedAudioInfo | null; error?: NextResponse }> {
  const { key } = await context.params;
  if (!isValidTtsCacheKey(key)) {
    return {
      key,
      info: null,
      error: NextResponse.json({ error: "Invalid audio URL" }, { status: 400 }),
    };
  }

  const info = await getCachedAudioInfo(key);
  if (!info) {
    return {
      key,
      info: null,
      error: NextResponse.json({ error: "Audio file not found" }, { status: 404 }),
    };
  }

  return { key, info };
}

export async function HEAD(_request: NextRequest, context: AudioRouteContext) {
  const resolved = await resolveInfo(context);
  if (resolved.error) return resolved.error;
  if (!resolved.info) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  console.log("[AUDIO HTTP STATUS]", {
    cacheKey: resolved.key,
    status: 200,
    contentType: resolved.info.meta.contentType,
    bytes: resolved.info.size,
  });

  return new NextResponse(null, {
    status: 200,
    headers: audioHeaders(resolved.info),
  });
}

export async function GET(request: NextRequest, context: AudioRouteContext) {
  const resolved = await resolveInfo(context);
  if (resolved.error) return resolved.error;
  if (!resolved.info) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  const cached = await readCachedAudio(resolved.key);
  if (!cached) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  const range = parseRange(request.headers.get("range"), cached.info.size);
  if (request.headers.get("range") && !range) {
    return new NextResponse(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${cached.info.size}`,
        "Cache-Control": "no-store",
      },
    });
  }

  console.log("[AUDIO HTTP STATUS]", {
    cacheKey: resolved.key,
    status: range ? 206 : 200,
    contentType: cached.info.meta.contentType,
    bytes: cached.info.size,
  });

  if (range) {
    const chunk = cached.audio.subarray(range.start, range.end + 1);
    return new NextResponse(audioBody(chunk), {
      status: 206,
      headers: audioHeaders(cached.info, {
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${cached.info.size}`,
      }),
    });
  }

  return new NextResponse(audioBody(cached.audio), {
    status: 200,
    headers: audioHeaders(cached.info),
  });
}
