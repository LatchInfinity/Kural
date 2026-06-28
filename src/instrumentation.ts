/**
 * Next.js instrumentation hook.
 *
 * Keep direct database/RSS imports out of this file. Next compiles
 * instrumentation for multiple runtimes, and native packages such as
 * better-sqlite3 pull in Node's fs module. Load RSS startup work only from the
 * Node runtime and do not await it, so first-page rendering is not blocked.
 */
export function register() {
  if (process.env.NODE_ENV !== "production") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Keep this as a runtime guarded require. Next compiles instrumentation for
      // multiple runtimes, and a static import/dynamic import can still trace the
      // native SQLite dependency into a non-Node bundle.
      const { scheduleStartupRssAutoSync } = require("./lib/rss/auto-sync") as typeof import("./lib/rss/auto-sync");
      scheduleStartupRssAutoSync();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err || "Unknown error");
      console.error(`[RSS AUTO SYNC] status=error error=${message}`);
    }
  }
}
