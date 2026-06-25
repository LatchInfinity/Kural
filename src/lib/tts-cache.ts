import path from "path";
import { promises as fs } from "fs";

export type TtsProvider = "sarvam" | "elevenlabs";

export interface CachedAudioMeta {
  provider: TtsProvider;
  contentType: string;
  voiceId?: string;
  voiceName: string;
  createdAt: string;
  newsId?: string;
}

export interface CachedAudioInfo {
  audioPath: string;
  metaPath: string;
  meta: CachedAudioMeta;
  size: number;
}

export const TTS_CACHE_KEY_RE = /^[a-f0-9]{64}$/;
export const TTS_CACHE_ROOT = path.join("data", "tts-cache");

export function ttsCacheDir(): string {
  return TTS_CACHE_ROOT;
}

export function isValidTtsCacheKey(cacheKey: string): boolean {
  return TTS_CACHE_KEY_RE.test(cacheKey);
}

export function cachePaths(cacheKey: string): { audioPath: string; metaPath: string } {
  if (!isValidTtsCacheKey(cacheKey)) {
    throw new Error("Invalid audio cache key");
  }

  return {
    audioPath: path.join(TTS_CACHE_ROOT, `${cacheKey}.audio`),
    metaPath: path.join(TTS_CACHE_ROOT, `${cacheKey}.json`),
  };
}

export function normalizeAudioContentType(value: string | null | undefined): "audio/mpeg" | "audio/wav" | null {
  const contentType = (value || "").split(";")[0].trim().toLowerCase();
  if (contentType === "audio/mpeg" || contentType === "audio/mp3") return "audio/mpeg";
  if (contentType === "audio/wav" || contentType === "audio/x-wav" || contentType === "audio/wave") return "audio/wav";
  return null;
}

export function isSupportedAudioContentType(value: string | null | undefined): boolean {
  return normalizeAudioContentType(value) !== null;
}

export function buildAudioUrl(requestUrl: string, cacheKey: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}/api/tts/audio/${cacheKey}`;
}

export async function getCachedAudioInfo(cacheKey: string): Promise<CachedAudioInfo | null> {
  if (!isValidTtsCacheKey(cacheKey)) return null;

  const { audioPath, metaPath } = cachePaths(cacheKey);
  try {
    const [stat, metaRaw] = await Promise.all([
      fs.stat(audioPath),
      fs.readFile(metaPath, "utf8"),
    ]);
    const meta = JSON.parse(metaRaw) as CachedAudioMeta;
    const contentType = normalizeAudioContentType(meta.contentType);
    if (!stat.isFile() || stat.size <= 0 || !contentType || !meta.provider) return null;

    return {
      audioPath,
      metaPath,
      meta: {
        ...meta,
        contentType,
      },
      size: stat.size,
    };
  } catch {
    return null;
  }
}

export async function readCachedAudio(cacheKey: string): Promise<{ audio: Buffer; info: CachedAudioInfo } | null> {
  const info = await getCachedAudioInfo(cacheKey);
  if (!info) return null;

  try {
    const audio = await fs.readFile(info.audioPath);
    if (audio.byteLength <= 0) return null;
    return { audio, info };
  } catch {
    return null;
  }
}

export async function saveCachedAudio(cacheKey: string, audio: Buffer, meta: CachedAudioMeta, newsId?: string): Promise<CachedAudioInfo> {
  const { audioPath, metaPath } = cachePaths(cacheKey);
  const contentType = normalizeAudioContentType(meta.contentType);
  if (!contentType) {
    throw new Error(`Unsupported audio content type: ${meta.contentType || "unknown"}`);
  }
  if (audio.byteLength <= 0) {
    throw new Error("Generated audio file is empty");
  }

  const nextMeta: CachedAudioMeta = {
    ...meta,
    contentType,
    ...(newsId ? { newsId } : {}),
  };

  await fs.mkdir(ttsCacheDir(), { recursive: true });
  await Promise.all([
    fs.writeFile(audioPath, audio),
    fs.writeFile(metaPath, JSON.stringify(nextMeta, null, 2), "utf8"),
  ]);

  const info = await getCachedAudioInfo(cacheKey);
  if (!info) {
    throw new Error("Generated audio file was not found after writing cache");
  }

  return info;
}

export async function deleteCachedAudio(cacheKey: string): Promise<void> {
  if (!isValidTtsCacheKey(cacheKey)) return;
  const { audioPath, metaPath } = cachePaths(cacheKey);
  await Promise.allSettled([
    fs.rm(audioPath, { force: true }),
    fs.rm(metaPath, { force: true }),
  ]);
}
