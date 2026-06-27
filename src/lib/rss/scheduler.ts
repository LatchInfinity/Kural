import { syncAllFeeds } from "./sync";
import { SYNC_INTERVAL_MS } from "@/lib/news-config";

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

export async function runSyncOnce(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const result = await syncAllFeeds({ reason: "scheduler", skipIfFresh: true });
    console.log(`[RSS Sync] Completed: ${result.totalNew} new, ${result.totalFound} total from ${result.sourceResults.length} sources; cleanup expired=${result.cleanup.expired}, blocked=${result.cleanup.blocked}`);
    for (const r of result.sourceResults) {
      if (r.status === "error") {
        console.warn(`[RSS Sync] ${r.source}: ERROR - ${r.error}`);
      }
    }
  } catch (err) {
    console.error("[RSS Sync] Fatal sync error:", err);
  } finally {
    isRunning = false;
  }
}

export function startScheduler(): void {
  if (intervalHandle) return;
  console.log(`[RSS Scheduler] Starting (interval: ${SYNC_INTERVAL_MS / 1000}s)`);
  runSyncOnce();
  intervalHandle = setInterval(runSyncOnce, SYNC_INTERVAL_MS);
}

export function stopScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
