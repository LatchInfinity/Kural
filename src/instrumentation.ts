/**
 * Next.js instrumentation hook.
 *
 * Keep this file free of database/RSS imports. Next compiles instrumentation for
 * multiple runtimes, and native packages such as better-sqlite3 pull in Node's
 * fs module, which breaks browser/Edge compilation. RSS syncing is handled by
 * /api/cron/sync-feeds plus the 5-minute client refresh.
 */
export async function register() {
  // Intentionally empty.
}
