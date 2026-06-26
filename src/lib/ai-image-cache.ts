import { existsSync } from "fs";
import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { externalAiImageUrl, stableImageSeed } from "@/lib/ai-image-url";

export const AI_IMAGE_CACHE_DIR = path.join(process.cwd(), "data", "ai-image-cache");

const pending = new Map<string, Promise<Buffer>>();
const FAILURE_COOLDOWN_MS = 60 * 1000;
const MAX_CONCURRENT_GENERATIONS = 2;
let activeGenerations = 0;
const generationQueue: (() => void)[] = [];

function safeTopicKey(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return cleaned || "general-news";
}

function fallbackKey(prompt: string, width: number, height: number, seed: number): string {
  return crypto
    .createHash("sha256")
    .update(`${width}x${height}:${seed}:${prompt}`)
    .digest("hex")
    .slice(0, 32);
}

export function aiImageCacheKey(input: { topicKey?: string; prompt: string; width: number; height: number; seed: number }): string {
  return input.topicKey
    ? safeTopicKey(input.topicKey)
    : fallbackKey(input.prompt, input.width, input.height, input.seed);
}

export function aiImageCachePath(key: string): string {
  return path.join(AI_IMAGE_CACHE_DIR, `${safeTopicKey(key)}.jpg`);
}

function failurePath(key: string): string {
  return path.join(AI_IMAGE_CACHE_DIR, `${safeTopicKey(key)}.failed`);
}

async function recentlyFailed(key: string): Promise<boolean> {
  const filePath = failurePath(key);
  if (!existsSync(filePath)) return false;
  try {
    const value = await readFile(filePath, "utf8");
    const failedAt = Number(value);
    return Number.isFinite(failedAt) && Date.now() - failedAt < FAILURE_COOLDOWN_MS;
  } catch {
    return false;
  }
}

async function rememberFailure(key: string): Promise<void> {
  await mkdir(AI_IMAGE_CACHE_DIR, { recursive: true });
  await writeFile(failurePath(key), String(Date.now()));
}

async function withGenerationSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
    await new Promise<void>((resolve) => generationQueue.push(resolve));
  }
  activeGenerations++;
  try {
    return await task();
  } finally {
    activeGenerations--;
    const next = generationQueue.shift();
    if (next) next();
  }
}

async function fetchGeneratedImage(prompt: string, width: number, height: number, seed: number): Promise<Buffer> {
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const url = externalAiImageUrl(prompt, { width, height, seed });
      const response = await fetch(url, {
        headers: { Accept: "image/*" },
        signal: AbortSignal.timeout(60000),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.startsWith("image/")) {
        throw new Error(`image provider returned ${response.status} ${contentType}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 500) throw new Error("image provider returned an empty image");
      return buffer;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[IMAGE FALLBACK] attempt=${attempt}/3 reason=${lastError}`);
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }
  throw new Error(lastError || "image generation failed");
}

export async function readCachedAiImage(key: string): Promise<Buffer | null> {
  const filePath = aiImageCachePath(key);
  if (!existsSync(filePath)) return null;
  return readFile(filePath);
}

export async function readRelatedCachedAiImage(key: string): Promise<{ key: string; buffer: Buffer } | null> {
  if (!existsSync(AI_IMAGE_CACHE_DIR)) return null;
  const category = safeTopicKey(key).split("-")[0] || "";
  if (!category) return null;

  const files = await readdir(AI_IMAGE_CACHE_DIR);
  const related = files
    .filter((file) => file.endsWith(".jpg") && file.startsWith(`${category}-`))
    .sort();

  for (const file of related) {
    const relatedKey = file.replace(/\.jpg$/, "");
    const buffer = await readCachedAiImage(relatedKey);
    if (buffer) return { key: relatedKey, buffer };
  }

  const anyJpg = files.find((file) => file.endsWith(".jpg"));
  if (!anyJpg) return null;
  const anyKey = anyJpg.replace(/\.jpg$/, "");
  const buffer = await readCachedAiImage(anyKey);
  return buffer ? { key: anyKey, buffer } : null;
}

export async function ensureCachedAiImage(input: {
  topicKey?: string;
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
}): Promise<{ key: string; buffer: Buffer | null; generated: boolean; cached: boolean; error?: string }> {
  const width = input.width || 800;
  const height = input.height || 450;
  const seed = input.seed ?? stableImageSeed(input.topicKey || input.prompt);
  const key = aiImageCacheKey({ topicKey: input.topicKey, prompt: input.prompt, width, height, seed });
  const cached = await readCachedAiImage(key);
  if (cached) return { key, buffer: cached, generated: false, cached: true };

  if (await recentlyFailed(key)) {
    return { key, buffer: null, generated: false, cached: false, error: "recent_generation_failure" };
  }

  const existing = pending.get(key);
  if (existing) {
    try {
      const buffer = await existing;
      return { key, buffer, generated: false, cached: false };
    } catch (err) {
      return { key, buffer: null, generated: false, cached: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  const task = withGenerationSlot(async () => {
    const buffer = await fetchGeneratedImage(input.prompt, width, height, seed);
    await mkdir(AI_IMAGE_CACHE_DIR, { recursive: true });
    await writeFile(aiImageCachePath(key), buffer);
    return buffer;
  });

  pending.set(key, task);
  try {
    const buffer = await task;
    console.log(`[IMAGE GENERATED] topic=${key} bytes=${buffer.length}`);
    return { key, buffer, generated: true, cached: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await rememberFailure(key);
    console.warn(`[IMAGE FALLBACK] topic=${key} reason=${message}`);
    return { key, buffer: null, generated: false, cached: false, error: message };
  } finally {
    pending.delete(key);
  }
}
