import {
  RSS_AUTO_SYNC_MIN_INTERVAL_MS,
  getLastSuccessfulRssSyncMetadata,
  hasRecentSuccessfulRssSync,
  syncAllFeeds,
} from "./sync";

let startupAutoSyncScheduled = false;
let startupAutoSyncStarted = false;

async function runStartupAutoSync(): Promise<void> {
  try {
    const metadata = getLastSuccessfulRssSyncMetadata();
    const isFresh = hasRecentSuccessfulRssSync(RSS_AUTO_SYNC_MIN_INTERVAL_MS);

    if (isFresh) {
      console.log(`[RSS AUTO SYNC] lastSyncCompleted=${metadata.lastSyncCompleted || "never"} action=skip thresholdMinutes=10`);
      console.log(`[RSS SKIPPED] reason=startup_recent_success thresholdMinutes=10`);
      return;
    }

    console.log(`[RSS AUTO SYNC] lastSyncCompleted=${metadata.lastSyncCompleted || "never"} action=background_sync thresholdMinutes=10`);
    await syncAllFeeds({ reason: "startup_auto", skipIfFresh: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err || "Unknown error");
    console.error(`[RSS AUTO SYNC] status=error error=${message}`);
  }
}

export function scheduleStartupRssAutoSync(): void {
  if (startupAutoSyncScheduled) return;
  startupAutoSyncScheduled = true;

  console.log("[RSS AUTO SYNC] startup_check_scheduled=true");
  setTimeout(() => {
    if (startupAutoSyncStarted) return;
    startupAutoSyncStarted = true;
    void runStartupAutoSync();
  }, 0);
}
