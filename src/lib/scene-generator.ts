import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import {
  DEFAULT_SCENE,
  getSceneFilename,
  getScenePrompt,
  isValidScene,
  getAllSceneNames,
} from "@/lib/scenes";
import { logger } from "@/lib/logger";

const SCENES_DIR = path.join(process.cwd(), "public", "generated-scenes");
const DALL_E_SIZE = "1792x1024";

async function fetchDalle3(prompt: string): Promise<Buffer | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: DALL_E_SIZE,
        quality: "standard",
        style: "natural",
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("Scene Gen", `DALL-E 3 error ${res.status}`, { body: body.slice(0, 300) });
      return null;
    }

    const data = (await res.json()) as { data?: { url?: string }[] };
    const imageUrl = data?.data?.[0]?.url;
    if (!imageUrl) return null;

    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) return null;

    return Buffer.from(await imgRes.arrayBuffer());
  } catch (err) {
    logger.error("Scene Gen", "DALL-E 3 fetch failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

export function sceneImageExists(sceneName: string): boolean {
  if (!isValidScene(sceneName)) return false;
  const filePath = path.join(SCENES_DIR, getSceneFilename(sceneName));
  return existsSync(filePath);
}

export async function getMissingScenes(): Promise<string[]> {
  const missing: string[] = [];
  for (const scene of getAllSceneNames()) {
    if (!sceneImageExists(scene)) missing.push(scene);
  }
  return missing;
}

export async function getSceneStatus(): Promise<{
  total: number;
  existing: number;
  missing: number;
  scenes: { name: string; slug: string; exists: boolean; url: string }[];
}> {
  const all = getAllSceneNames();
  const scenes = all.map((name) => ({
    name,
    slug: path.parse(getSceneFilename(name)).name,
    exists: sceneImageExists(name),
    url: `/generated-scenes/${getSceneFilename(name)}`,
  }));
  const existing = scenes.filter((s) => s.exists).length;
  return {
    total: all.length,
    existing,
    missing: all.length - existing,
    scenes,
  };
}

export async function generateSceneImage(sceneName: string): Promise<{
  success: boolean;
  scene: string;
  url?: string;
  error?: string;
}> {
  if (!isValidScene(sceneName)) {
    return { success: false, scene: sceneName, error: "Invalid scene name" };
  }
  if (sceneImageExists(sceneName)) {
    return { success: true, scene: sceneName, url: `/generated-scenes/${getSceneFilename(sceneName)}` };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { success: false, scene: sceneName, error: "OPENAI_API_KEY not set" };
  }

  const prompt = `${getScenePrompt(sceneName)} Style: ultra realistic editorial photography, cinematic lighting, natural colors, premium quality, no text, no logos, no watermarks, no recognizable faces.`;

  logger.info("Scene Gen", `Generating scene: ${sceneName}`);
  const buffer = await fetchDalle3(prompt);
  if (!buffer || buffer.length < 500) {
    return { success: false, scene: sceneName, error: "DALL-E 3 returned no image" };
  }

  try {
    await mkdir(SCENES_DIR, { recursive: true });
    const filePath = path.join(SCENES_DIR, getSceneFilename(sceneName));
    await writeFile(filePath, buffer);
    logger.info("Scene Gen", `Scene saved: ${sceneName} → ${getSceneFilename(sceneName)}`, {
      bytes: buffer.length,
    });
    return { success: true, scene: sceneName, url: `/generated-scenes/${getSceneFilename(sceneName)}` };
  } catch (err) {
    return { success: false, scene: sceneName, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function generateAllMissingScenes(
  options: { maxPerBatch?: number; delayMs?: number } = {},
): Promise<{
  total: number;
  generated: number;
  failed: number;
  scenes: { scene: string; success: boolean; url?: string; error?: string }[];
}> {
  const { maxPerBatch = 5, delayMs = 1500 } = options;
  const missing = await getMissingScenes();
  const scenes: { scene: string; success: boolean; url?: string; error?: string }[] = [];
  let generated = 0;
  let failed = 0;

  if (missing.length === 0) {
    return { total: 0, generated: 0, failed: 0, scenes };
  }

  logger.info("Scene Gen", `Found ${missing.length} missing scenes, generating up to ${maxPerBatch}`);

  const batch = missing.slice(0, maxPerBatch);
  for (const scene of batch) {
    const result = await generateSceneImage(scene);
    scenes.push(result);
    if (result.success) generated++;
    else failed++;

    if (scene !== batch[batch.length - 1]) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { total: missing.length, generated, failed, scenes };
}

export async function cleanupOrphanedSceneImages(): Promise<number> {
  try {
    if (!existsSync(SCENES_DIR)) return 0;
    const files = await readdir(SCENES_DIR);
    const validSlugs = new Set(
      getAllSceneNames().map((n) => path.parse(getSceneFilename(n)).name),
    );
    let deleted = 0;
    for (const file of files) {
      if (!file.endsWith(".webp")) continue;
      const stem = path.parse(file).name;
      if (!validSlugs.has(stem)) {
        await unlink(path.join(SCENES_DIR, file));
        deleted++;
      }
    }
    return deleted;
  } catch {
    return 0;
  }
}

export const SCENE_OUTPUT_DIR = SCENES_DIR;
export { DEFAULT_SCENE };
