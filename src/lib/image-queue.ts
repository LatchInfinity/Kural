import { logger } from "@/lib/logger";
import {
  generateAllMissingScenes,
  getMissingScenes,
  getSceneStatus,
  cleanupOrphanedSceneImages,
} from "@/lib/scene-generator";

let processing = false;
let queueInterval: ReturnType<typeof setInterval> | null = null;
let aiConfigured: boolean | null = null;
let fullGenerationStarted = false;

async function getScenesUsedInArticles(): Promise<Set<string>> {
  try {
    const { getDbInstance } = await import("@/lib/db");
    const db = getDbInstance();
    const rows = db.prepare(`
      SELECT DISTINCT ai_image_prompt AS scene
      FROM articles
      WHERE ai_image_prompt IS NOT NULL
        AND ai_image_prompt != ''
        AND ai_image_prompt != 'unavailable'
        AND retention != 'archived'
    `).all() as { scene: string }[];
    return new Set(rows.map((r) => r.scene));
  } catch {
    return new Set();
  }
}

export async function processSceneQueue(): Promise<{
  generated: number;
  failed: number;
  totalMissing: number;
}> {
  if (processing) return { generated: 0, failed: 0, totalMissing: 0 };

  if (aiConfigured === null) {
    aiConfigured = !!process.env.OPENAI_API_KEY;
    if (!aiConfigured) {
      logger.warn("Scene Queue", "OPENAI_API_KEY not set — scene AI generation disabled, using SVGs only");
      return { generated: 0, failed: 0, totalMissing: 0 };
    }
  }

  if (!aiConfigured) return { generated: 0, failed: 0, totalMissing: 0 };

  processing = true;
  let totalMissing = 0;
  let generated = 0;
  let failed = 0;

  try {
    const status = await getSceneStatus();
    if (status.existing === 0 && !fullGenerationStarted) {
      logger.info("Scene Queue", "No scenes generated yet — bootstrapping all 55 scenes");
      fullGenerationStarted = true;
    }

    const usedScenes = await getScenesUsedInArticles();
    const filesystemMissing = await getMissingScenes();

    const priorityMissing = filesystemMissing.filter((s) => usedScenes.has(s));
    const remainingMissing = filesystemMissing.filter((s) => !usedScenes.has(s));
    const toProcess = [...priorityMissing, ...remainingMissing].slice(0, 2);

    totalMissing = filesystemMissing.length;
    if (toProcess.length === 0) {
      return { generated: 0, failed: 0, totalMissing: 0 };
    }

    logger.info("Scene Queue", `Generating up to ${toProcess.length} missing scenes`, {
      missing: totalMissing,
      usedByArticles: usedScenes.size,
    });

    const result = await generateAllMissingScenes({
      maxPerBatch: toProcess.length,
      delayMs: 1200,
    });

    generated = result.generated;
    failed = result.failed;

    if (generated > 0) {
      const { sseManager } = await import("@/lib/sse");
      sseManager.broadcast({
        type: "scenes-updated",
        generated,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    logger.error("Scene Queue", "Fatal error", { error: err instanceof Error ? err.message : String(err) });
  } finally {
    processing = false;
  }

  return { generated, failed, totalMissing };
}

export async function triggerFullSceneGeneration(): Promise<{
  total: number;
  generated: number;
  failed: number;
}> {
  if (!process.env.OPENAI_API_KEY) {
    return { total: 0, generated: 0, failed: 0 };
  }
  fullGenerationStarted = true;
  const result = await generateAllMissingScenes({ maxPerBatch: 10, delayMs: 1500 });
  return { total: result.total, generated: result.generated, failed: result.failed };
}

export function startSceneQueue(): void {
  if (queueInterval) return;
  logger.info("Scene Queue", "Starting (interval: 30s)");
  setTimeout(() => processSceneQueue(), 10000);
  queueInterval = setInterval(() => processSceneQueue(), 30000);
}

export function stopSceneQueue(): void {
  if (queueInterval) {
    clearInterval(queueInterval);
    queueInterval = null;
  }
}

export async function runSceneMaintenance(): Promise<{
  deleted: number;
  status: Awaited<ReturnType<typeof getSceneStatus>>;
}> {
  const deleted = await cleanupOrphanedSceneImages();
  const status = await getSceneStatus();
  return { deleted, status };
}
