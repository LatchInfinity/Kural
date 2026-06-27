import crypto from "crypto";
import { cleanupStoredArticles, getDbInstance, ensureSchema } from "@/lib/db";
import { RSS_SOURCES, type RSSSourceConfig } from "./sources";
import { fetchFeed, type ParsedArticle } from "./parser";
import { filterTamilNadu } from "./tn-filter";
import { sseManager } from "@/lib/sse";
import { NEWS_RETENTION_HOURS } from "@/lib/news-config";
import { backfillArticleVideos, resolveArticleVideo } from "@/lib/news-video";
import { getArticleTopicImage } from "@/lib/ai-image-url";
import { ensureCachedAiImage } from "@/lib/ai-image-cache";

const RSS_SYNC_CONCURRENCY = 4;
export const RSS_AUTO_SYNC_MIN_INTERVAL_MS = 10 * 60 * 1000;
const RSS_SYNC_LOCK_STALE_MS = 15 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type RssSyncStatus = "success" | "skipped" | "already_running";

export interface RssSyncMetadata {
  lastSyncStarted: string | null;
  lastSyncCompleted: string | null;
  articlesAdded: number;
  articlesSkipped: number;
}

export interface RssSyncSourceResult {
  source: string;
  status: string;
  articlesNew: number;
  articlesFound: number;
  articlesFiltered: number;
  error: string | null;
}

export interface RssSyncResult extends RssSyncMetadata {
  status: RssSyncStatus;
  totalNew: number;
  totalFound: number;
  totalFiltered: number;
  videosBackfilled: number;
  cleanup: { expired: number; blocked: number };
  sourceResults: RssSyncSourceResult[];
  skippedReason?: string;
}

interface SyncAllFeedsOptions {
  reason?: string;
  skipIfFresh?: boolean;
}

interface SyncLockResult {
  acquired: boolean;
  syncId?: string;
  runningSyncId?: string;
  runningStartedAt?: string | null;
}

let activeSyncPromise: Promise<RssSyncResult> | null = null;

function ageInDays(ms: number): number {
  return ms / MS_PER_DAY;
}

function normalizeHashText(value: string): string {
  return value
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9\u0B80-\u0BFF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contentHash(article: ParsedArticle): string {
  const body = normalizeHashText(`${article.title} ${article.summary} ${article.content}`);
  const fallback = normalizeHashText(`${article.title} ${article.link} ${article.guid || ""}`);
  return crypto.createHash("sha256").update(body || fallback).digest("hex").slice(0, 32);
}


function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err || "Unknown error");
}

function generateId(): string {
  return crypto.randomUUID();
}

function isDuplicateByHash(db: ReturnType<typeof getDbInstance>, hash: string): boolean {
  const row = db.prepare("SELECT id FROM articles WHERE content_hash = ?").get(hash);
  return !!row;
}

function isDuplicateByUrl(db: ReturnType<typeof getDbInstance>, url: string): boolean {
  if (!url) return false;
  const row = db.prepare("SELECT id FROM articles WHERE source_url = ?").get(url);
  return !!row;
}

function isDuplicateByGuid(db: ReturnType<typeof getDbInstance>, source: string, guid?: string): boolean {
  if (!guid) return false;
  const row = db.prepare("SELECT id FROM articles WHERE source = ? AND source_guid = ?").get(source, guid);
  return !!row;
}

function normalizeDuplicateText(value: string): string {
  return value
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9\u0B80-\u0BFF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
}

function duplicateSimilarity(a: string, b: string): number {
  const left = new Set(normalizeDuplicateText(a).split(" ").filter((token) => token.length > 2));
  const right = new Set(normalizeDuplicateText(b).split(" ").filter((token) => token.length > 2));
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap++;
  }
  return overlap / Math.min(left.size, right.size);
}

function isDuplicateByTitle(db: ReturnType<typeof getDbInstance>, title: string, bodyText: string): boolean {
  const normalized = normalizeDuplicateText(title).slice(0, 120);
  const twoDaysAgo = new Date(Date.now() - NEWS_RETENTION_HOURS * 60 * 60 * 1000).toISOString();
  const rows = db.prepare(`
    SELECT id, title, summary, content FROM articles
    WHERE retention != 'archived' AND published_at >= ?
    ORDER BY published_at DESC LIMIT 100
  `).all(twoDaysAgo) as { id: string; title: string; summary: string | null; content: string | null }[];
  for (const row of rows) {
    const existing = normalizeDuplicateText(row.title).slice(0, 120);
    if (!normalized || !existing) continue;
    if (normalized === existing) return true;
    if (normalized.includes(existing) || existing.includes(normalized)) return true;
    if (duplicateSimilarity(normalized, existing) >= 0.72) return true;
    if (duplicateSimilarity(`${title} ${bodyText}`, `${row.title} ${row.summary || ""} ${row.content || ""}`) >= 0.82) return true;
  }
  return false;
}

function runRetention(db: ReturnType<typeof getDbInstance>): { expired: number; blocked: number } {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const retentionCutoff = new Date(now.getTime() - NEWS_RETENTION_HOURS * 60 * 60 * 1000).toISOString();

  db.prepare(`
    UPDATE articles SET retention = 'breaking', updated_at = datetime('now')
    WHERE published_at >= ? AND retention != 'archived' AND retention != 'breaking'
  `).run(twentyFourHoursAgo);

  db.prepare(`
    UPDATE articles SET retention = 'recent', updated_at = datetime('now')
    WHERE published_at < ? AND published_at >= ? AND retention != 'archived'
  `).run(twentyFourHoursAgo, retentionCutoff);

  return cleanupStoredArticles(db);
}

function insertArticle(db: ReturnType<typeof getDbInstance>, article: {
  id: string; title: string; headline: string; summary: string;
  content: string; source: string; sourceUrl: string; sourceGuid: string; sourceLogoUrl: string;
  imageUrl: string; imageSource: string; aiImageUrl: string; aiImagePrompt: string; aiImageGeneratedAt: string;
  aiVideoUrl: string; videoStatus: string; videoPrompt: string; videoGeneratedAt: string; videoDuration: number; videoThumbnail: string;
  district: string | null;
  category: string; publishedAt: string;
  language: string; contentHash: string; retention: string;
}): boolean {
  try {
    const result = db.prepare(`
      INSERT OR IGNORE INTO articles (
        id, title, headline, summary, content, source, source_url, source_guid, source_logo_url,
        image_url, image_source, ai_image_url, ai_image_prompt, ai_image_generated_at,
        ai_video_url, video_status, video_prompt, video_generated_at, video_duration, video_thumbnail,
        district, category, published_at, language, content_hash, retention
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      article.id, article.title, article.headline, article.summary,
      article.content, article.source, article.sourceUrl, article.sourceGuid, article.sourceLogoUrl,
      article.imageUrl, article.imageSource, article.aiImageUrl, article.aiImagePrompt, article.aiImageGeneratedAt,
      article.aiVideoUrl, article.videoStatus, article.videoPrompt, article.videoGeneratedAt, article.videoDuration, article.videoThumbnail,
      article.district,
      article.category, article.publishedAt,
      article.language, article.contentHash, article.retention
    );
    return result.changes > 0;
  } catch (err: unknown) {
    const message = errorMessage(err);
    if (message.includes("UNIQUE")) {
      console.log("Duplicate Article (DB constraint)", article.id, article.title);
      return false;
    }
    throw err;
  }
}

function updateSourceStatus(db: ReturnType<typeof getDbInstance>, sourceId: string, success: boolean, errorMsg?: string): void {
  if (success) {
    db.prepare("UPDATE rss_sources SET last_fetched_at = datetime('now'), error_count = 0, last_error = NULL WHERE id = ?").run(sourceId);
  } else {
    db.prepare("UPDATE rss_sources SET last_fetched_at = datetime('now'), error_count = error_count + 1, last_error = ? WHERE id = ?").run(errorMsg || "Unknown error", sourceId);
  }
}

function sourceEndpointKey(src: RSSSourceConfig): string {
  if (src.feedUrl) return src.feedUrl;
  if (src.apiProvider) return `api://${src.apiProvider}/${src.id}`;
  if (src.scraper?.listUrl) return `scraper://${src.id}`;
  return `manual://${src.id}`;
}

function seedSources(db: ReturnType<typeof getDbInstance>): void {
  const configuredIds = RSS_SOURCES.map((src) => src.id);
  if (configuredIds.length > 0) {
    const placeholders = configuredIds.map(() => "?").join(", ");
    db.prepare(`UPDATE rss_sources SET active = 0 WHERE id NOT IN (${placeholders})`).run(...configuredIds);
  }

  const upsert = db.prepare(`
    INSERT INTO rss_sources (id, name, name_ta, feed_url, website_url, logo_url, category, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      name_ta = excluded.name_ta,
      feed_url = excluded.feed_url,
      website_url = excluded.website_url,
      logo_url = excluded.logo_url,
      category = excluded.category,
      active = excluded.active
  `);

  for (const src of RSS_SOURCES) {
    upsert.run(
      src.id,
      src.name,
      src.nameTa,
      sourceEndpointKey(src),
      src.websiteUrl,
      src.logoUrl,
      src.category,
      src.active ? 1 : 0,
    );
  }
}

function readSyncMetadataById(db: ReturnType<typeof getDbInstance>, syncId: string): RssSyncMetadata {
  const row = db.prepare(`
    SELECT started_at, completed_at, articles_new, articles_duplicate
    FROM sync_logs
    WHERE id = ?
  `).get(syncId) as {
    started_at: string | null;
    completed_at: string | null;
    articles_new: number | null;
    articles_duplicate: number | null;
  } | undefined;

  return {
    lastSyncStarted: row?.started_at || null,
    lastSyncCompleted: row?.completed_at || null,
    articlesAdded: row?.articles_new || 0,
    articlesSkipped: row?.articles_duplicate || 0,
  };
}

function readLastSuccessfulSyncMetadata(db: ReturnType<typeof getDbInstance>): RssSyncMetadata {
  const row = db.prepare(`
    SELECT started_at, completed_at, articles_new, articles_duplicate
    FROM sync_logs
    WHERE source_id IS NULL
      AND status = 'success'
      AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 1
  `).get() as {
    started_at: string | null;
    completed_at: string | null;
    articles_new: number | null;
    articles_duplicate: number | null;
  } | undefined;

  return {
    lastSyncStarted: row?.started_at || null,
    lastSyncCompleted: row?.completed_at || null,
    articlesAdded: row?.articles_new || 0,
    articlesSkipped: row?.articles_duplicate || 0,
  };
}

function hasFreshSuccessfulSync(db: ReturnType<typeof getDbInstance>, maxAgeMs: number): boolean {
  const row = db.prepare(`
    SELECT id
    FROM sync_logs
    WHERE source_id IS NULL
      AND status = 'success'
      AND completed_at IS NOT NULL
      AND julianday(completed_at) >= julianday('now') - ?
    ORDER BY completed_at DESC
    LIMIT 1
  `).get(ageInDays(maxAgeMs));
  return !!row;
}

function skippedSyncResult(
  status: Exclude<RssSyncStatus, "success">,
  reason: string,
  metadata: RssSyncMetadata,
): RssSyncResult {
  return {
    status,
    totalNew: 0,
    totalFound: 0,
    totalFiltered: 0,
    videosBackfilled: 0,
    cleanup: { expired: 0, blocked: 0 },
    sourceResults: [],
    skippedReason: reason,
    ...metadata,
  };
}

function acquireSyncLock(db: ReturnType<typeof getDbInstance>): SyncLockResult {
  const syncId = generateId();
  let result: SyncLockResult = { acquired: false };

  db.exec("BEGIN IMMEDIATE");
  try {
    const running = db.prepare(`
      SELECT id, started_at
      FROM sync_logs
      WHERE source_id IS NULL
        AND status = 'running'
        AND julianday(started_at) >= julianday('now') - ?
      ORDER BY started_at DESC
      LIMIT 1
    `).get(ageInDays(RSS_SYNC_LOCK_STALE_MS)) as { id: string; started_at: string | null } | undefined;

    if (running) {
      result = {
        acquired: false,
        runningSyncId: running.id,
        runningStartedAt: running.started_at,
      };
    } else {
      db.prepare(`
        UPDATE sync_logs
        SET completed_at = COALESCE(completed_at, datetime('now')),
            status = 'error',
            error = COALESCE(error, 'Stale RSS sync lock released')
        WHERE source_id IS NULL
          AND status = 'running'
      `).run();

      db.prepare(`
        INSERT INTO sync_logs (id, started_at, status)
        VALUES (?, datetime('now'), 'running')
      `).run(syncId);

      result = { acquired: true, syncId };
    }

    db.exec("COMMIT");
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Ignore rollback errors and preserve the original failure.
    }
    throw err;
  }

  return result;
}

export function getLastSuccessfulRssSyncMetadata(): RssSyncMetadata {
  ensureSchema();
  const db = getDbInstance();
  return readLastSuccessfulSyncMetadata(db);
}

export function hasRecentSuccessfulRssSync(maxAgeMs = RSS_AUTO_SYNC_MIN_INTERVAL_MS): boolean {
  ensureSchema();
  const db = getDbInstance();
  return hasFreshSuccessfulSync(db, maxAgeMs);
}

async function runSyncPipeline(syncId: string): Promise<RssSyncResult> {
  ensureSchema();
  const db = getDbInstance();
  seedSources(db);
  const initialCleanup = cleanupStoredArticles(db);

  const sourceResults: RssSyncSourceResult[] = [];

  let totalNew = 0;
  let totalFound = 0;
  let totalFiltered = 0;

  const activeSources = RSS_SOURCES.filter((source) => source.active);
  let nextSourceIndex = 0;
  const workerCount = Math.min(RSS_SYNC_CONCURRENCY, activeSources.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextSourceIndex < activeSources.length) {
      const source = activeSources[nextSourceIndex++];
      const sourceSyncId = generateId();
      const logStmt = db.prepare(`
        INSERT INTO sync_logs (id, source_id, source_name, started_at, status)
        VALUES (?, ?, ?, datetime('now'), 'running')
      `);
      logStmt.run(sourceSyncId, source.id, source.name);

      try {
        const result = await fetchFeed(source);
        totalFound += result.articles.length;

        if (result.error) {
          updateSourceStatus(db, source.id, false, result.error);
          db.prepare("INSERT INTO feed_errors (id, source_id, source_name, error_type, error_message) VALUES (?, ?, ?, 'fetch_error', ?)")
            .run(generateId(), source.id, source.name, result.error);
          db.prepare("UPDATE sync_logs SET completed_at = datetime('now'), status = 'error', articles_found = ?, error = ? WHERE id = ?")
            .run(result.articles.length, result.error, sourceSyncId);
          sourceResults.push({
            source: source.name, status: "error",
            articlesNew: 0, articlesFound: result.articles.length, articlesFiltered: 0, error: result.error,
          });
          continue;
        }

        let articlesNew = 0;
        let articlesDuplicate = 0;
        let articlesFiltered = 0;

        for (const article of result.articles) {
        if (!article.title) continue;

        const filterResult = filterTamilNadu({
          title: article.title,
          summary: article.summary,
          content: `${article.content} ${article.categories.join(" ")}`,
          source: source.name,
          category: source.category,
        });

        if (!filterResult.relevant) {
          articlesFiltered++;
          totalFiltered++;
          continue;
        }

        const sourceGuid = article.guid || "";
        const hash = contentHash(article);
        if (isDuplicateByHash(db, hash)) {
          console.log("Duplicate Article (content_hash)", article.title);
          articlesDuplicate++;
          continue;
        }

        if (isDuplicateByGuid(db, source.name, sourceGuid)) {
          console.log("Duplicate Article (guid)", article.title);
          articlesDuplicate++;
          continue;
        }

        if (isDuplicateByUrl(db, article.link)) {
          console.log("Duplicate Article (source_url)", article.title);
          articlesDuplicate++;
          continue;
        }

        if (isDuplicateByTitle(db, article.title, `${article.summary || ""} ${article.content || ""}`)) {
          console.log("Duplicate Article (title match)", article.title);
          articlesDuplicate++;
          continue;
        }

        const publishedDate = new Date(article.pubDate);
        const now = new Date();
        const hoursAgo = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
        if (Number.isNaN(hoursAgo) || hoursAgo > NEWS_RETENTION_HOURS) {
          articlesFiltered++;
          totalFiltered++;
          continue;
        }
        let retention = "latest";
        if (hoursAgo <= 24) {
          retention = "breaking";
        } else {
          retention = "recent";
        }

        const topicImage = getArticleTopicImage({
          headline: article.title,
          title: article.title,
          summary: article.summary,
          content: article.content,
          category: filterResult.category,
          district: filterResult.district,
          source: source.name,
          keywords: article.categories,
        });
        const warmedImage = await ensureCachedAiImage({
          topicKey: topicImage.topicKey,
          prompt: topicImage.prompt,
        });
        console.log(`[IMAGE] TOPIC_CACHE topic=${topicImage.topicKey} cached=${warmedImage.cached} generated=${warmedImage.generated} error=${warmedImage.error || "none"}`);
        const aiImage = {
          url: topicImage.url,
          prompt: topicImage.prompt,
        };
        const finalImageUrl = aiImage.url;
        const imageSource = "ai";

        console.log(`[IMAGE] STORE id=${"(pending)"} title="${article.title.slice(0, 60)}" category=${filterResult.category} image_source=${imageSource} source_url=${article.imageUrl ? article.imageUrl.slice(0, 60) : "none"} ai_url=${aiImage.url.slice(0, 60)}`);

        const articleId = generateId();
        const video = resolveArticleVideo({
          id: articleId,
          title: article.title,
          headline: article.title,
          summary: article.summary,
          content: article.content,
          category: filterResult.category,
          district: filterResult.district,
          keywords: article.categories,
          thumbnailUrl: aiImage.url || finalImageUrl,
        });

        const inserted = insertArticle(db, {
          id: articleId,
          title: article.title,
          headline: article.title,
          summary: article.summary,
          content: article.content,
          source: source.name,
          sourceUrl: article.link,
          sourceGuid,
          sourceLogoUrl: source.logoUrl,
          imageUrl: finalImageUrl,
          imageSource,
          aiImageUrl: aiImage.url,
          aiImagePrompt: aiImage.prompt,
          aiImageGeneratedAt: now.toISOString(),
          aiVideoUrl: video.aiVideoUrl,
          videoStatus: video.videoStatus,
          videoPrompt: video.videoPrompt,
          videoGeneratedAt: video.videoGeneratedAt,
          videoDuration: video.videoDuration,
          videoThumbnail: video.videoThumbnail || aiImage.url || finalImageUrl,
          district: filterResult.district,
          category: filterResult.category,
          publishedAt: publishedDate.toISOString(),
          language: "ta",
          contentHash: hash,
          retention,
        });
        if (inserted) {
          articlesNew++;
          totalNew++;
          console.log(`[IMAGE] SAVE id=${articleId} title="${article.title.slice(0, 60)}" category=${filterResult.category} status=SUCCESS`);
        } else {
          console.log(`[IMAGE] SAVE id=${articleId} title="${article.title.slice(0, 60)}" category=${filterResult.category} status=DUPLICATE`);
          articlesDuplicate++;
        }
      }

        updateSourceStatus(db, source.id, true);
        db.prepare(`
          UPDATE sync_logs SET completed_at = datetime('now'), status = 'success',
          articles_found = ?, articles_new = ?, articles_duplicate = ? WHERE id = ?
        `).run(result.articles.length, articlesNew, articlesDuplicate, sourceSyncId);

        sourceResults.push({
          source: source.name, status: "success",
          articlesNew, articlesFound: result.articles.length, articlesFiltered, error: null,
        });
      } catch (err: unknown) {
        const message = errorMessage(err);
        updateSourceStatus(db, source.id, false, message);
        db.prepare("UPDATE sync_logs SET completed_at = datetime('now'), status = 'error', error = ? WHERE id = ?")
          .run(message, sourceSyncId);
        sourceResults.push({
          source: source.name, status: "error",
          articlesNew: 0, articlesFound: 0, articlesFiltered: 0, error: message,
        });
      }
    }
  });
  await Promise.all(workers);

  const videosBackfilled = backfillArticleVideos(db);
  const finalCleanup = runRetention(db);
  const cleanup = {
    expired: initialCleanup.expired + finalCleanup.expired,
    blocked: initialCleanup.blocked + finalCleanup.blocked,
  };

  const articlesSkipped = Math.max(totalFound - totalNew, 0);

  db.prepare(`
    UPDATE sync_logs SET completed_at = datetime('now'), status = 'success',
    articles_found = ?, articles_new = ?, articles_duplicate = ? WHERE id = ? AND status = 'running'
  `).run(totalFound, totalNew, articlesSkipped, syncId);

  const countMissingImageColumn = (column: "image_url" | "ai_image_url"): { count: number } => {
    return db.prepare(`
      SELECT COUNT(*) as count FROM articles
      WHERE ${column} IS NULL OR ${column} = '' OR ${column} = 'null' OR ${column} = 'undefined'
    `).get() as { count: number };
  };
  const missingImage = countMissingImageColumn("image_url");
  const missingAiImage = countMissingImageColumn("ai_image_url");
  const totalArticles = db.prepare("SELECT COUNT(*) as count FROM articles").get() as { count: number };
  console.log(`[IMAGE] VERIFY total=${totalArticles.count} bad_image=${missingImage.count} bad_ai_image=${missingAiImage.count}`);

  if (totalNew > 0) {
    sseManager.broadcast({
      type: "new-articles",
      count: totalNew,
      timestamp: new Date().toISOString(),
    });
  }

  const metadata = readSyncMetadataById(db, syncId);
  console.log(`[RSS COMPLETE] syncId=${syncId} articlesAdded=${totalNew} articlesSkipped=${articlesSkipped} totalFound=${totalFound}`);

  return {
    status: "success",
    totalNew,
    totalFound,
    totalFiltered,
    articlesAdded: totalNew,
    articlesSkipped,
    videosBackfilled,
    cleanup,
    sourceResults,
    lastSyncStarted: metadata.lastSyncStarted,
    lastSyncCompleted: metadata.lastSyncCompleted,
  };
}

export async function syncAllFeeds(options: SyncAllFeedsOptions = {}): Promise<RssSyncResult> {
  ensureSchema();
  const db = getDbInstance();
  const reason = options.reason || "manual";
  const metadata = readLastSuccessfulSyncMetadata(db);

  if (options.skipIfFresh && hasFreshSuccessfulSync(db, RSS_AUTO_SYNC_MIN_INTERVAL_MS)) {
    console.log(`[RSS SKIPPED] reason=${reason} lastSyncCompleted=${metadata.lastSyncCompleted || "never"} thresholdMinutes=10`);
    return skippedSyncResult("skipped", "recent_success", metadata);
  }

  if (activeSyncPromise) {
    console.log(`[RSS ALREADY RUNNING] reason=${reason}`);
    return skippedSyncResult("already_running", "active_sync", metadata);
  }

  const lock = acquireSyncLock(db);
  if (!lock.acquired || !lock.syncId) {
    console.log(`[RSS ALREADY RUNNING] reason=${reason} syncId=${lock.runningSyncId || "unknown"} startedAt=${lock.runningStartedAt || "unknown"}`);
    return skippedSyncResult("already_running", "lock_held", metadata);
  }

  const syncId = lock.syncId;
  console.log(`[RSS START] reason=${reason} syncId=${syncId} lastSyncCompleted=${metadata.lastSyncCompleted || "never"}`);

  activeSyncPromise = runSyncPipeline(syncId)
    .catch((err: unknown) => {
      const message = errorMessage(err);
      const failureDb = getDbInstance();
      failureDb.prepare(`
        UPDATE sync_logs
        SET completed_at = datetime('now'),
            status = 'error',
            error = ?
        WHERE id = ?
          AND status = 'running'
      `).run(message, syncId);
      console.error(`[RSS COMPLETE] syncId=${syncId} status=error error=${message}`);
      throw err;
    })
    .finally(() => {
      activeSyncPromise = null;
    });

  return activeSyncPromise;
}

export async function syncSingleSource(source: RSSSourceConfig): Promise<{
  status: string; articlesNew: number; articlesFound: number; articlesFiltered: number; videosBackfilled: number; error: string | null;
}> {
  ensureSchema();
  const db = getDbInstance();
  const sourceSyncId = generateId();
  db.prepare(`
    INSERT INTO sync_logs (id, source_id, source_name, started_at, status)
    VALUES (?, ?, ?, datetime('now'), 'running')
  `).run(sourceSyncId, source.id, source.name);

  try {
    const result = await fetchFeed(source);
    if (result.error) {
      updateSourceStatus(db, source.id, false, result.error);
      db.prepare("UPDATE sync_logs SET completed_at = datetime('now'), status = 'error', articles_found = ?, error = ? WHERE id = ?")
        .run(result.articles.length, result.error, sourceSyncId);
      return { status: "error", articlesNew: 0, articlesFound: result.articles.length, articlesFiltered: 0, videosBackfilled: 0, error: result.error };
    }

    let articlesNew = 0;
    let articlesDuplicate = 0;
    let articlesFiltered = 0;

    for (const article of result.articles) {
      if (!article.title) continue;

      const filterResult = filterTamilNadu({
        title: article.title,
        summary: article.summary,
        content: `${article.content} ${article.categories.join(" ")}`,
        source: source.name,
        category: source.category,
      });

      if (!filterResult.relevant) {
        articlesFiltered++;
        continue;
      }

      const sourceGuid = article.guid || "";
      const hash = contentHash(article);
      if (isDuplicateByHash(db, hash)) {
        console.log("Duplicate Article (content_hash)", article.title);
        articlesDuplicate++; continue;
      }
      if (isDuplicateByGuid(db, source.name, sourceGuid)) {
        console.log("Duplicate Article (guid)", article.title);
        articlesDuplicate++; continue;
      }
      if (isDuplicateByUrl(db, article.link)) {
        console.log("Duplicate Article (source_url)", article.title);
        articlesDuplicate++; continue;
      }
      if (isDuplicateByTitle(db, article.title, `${article.summary || ""} ${article.content || ""}`)) {
        console.log("Duplicate Article (title match)", article.title);
        articlesDuplicate++; continue;
      }

      const publishedDate = new Date(article.pubDate);
      const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
      if (Number.isNaN(hoursAgo) || hoursAgo > NEWS_RETENTION_HOURS) {
        articlesFiltered++;
        continue;
      }
      const retention = hoursAgo <= 24 ? "breaking" : "recent";

      const topicImage = getArticleTopicImage({
        headline: article.title,
        title: article.title,
        summary: article.summary,
        content: article.content,
        category: filterResult.category,
        district: filterResult.district,
        source: source.name,
        keywords: article.categories,
      });
      const warmedImage = await ensureCachedAiImage({
        topicKey: topicImage.topicKey,
        prompt: topicImage.prompt,
      });
      console.log(`[IMAGE] TOPIC_CACHE topic=${topicImage.topicKey} cached=${warmedImage.cached} generated=${warmedImage.generated} error=${warmedImage.error || "none"}`);
      const aiImage = {
        url: topicImage.url,
        prompt: topicImage.prompt,
      };
      const finalImageUrl = aiImage.url;
      const imageSource = "ai";

      console.log(`[IMAGE] STORE id=${"(pending)"} title="${article.title.slice(0, 60)}" category=${filterResult.category} image_source=${imageSource} source_url=${article.imageUrl ? article.imageUrl.slice(0, 60) : "none"} ai_url=${aiImage.url.slice(0, 60)}`);

      const articleId = generateId();
      const video = resolveArticleVideo({
        id: articleId,
        title: article.title,
        headline: article.title,
        summary: article.summary,
        content: article.content,
        category: filterResult.category,
        district: filterResult.district,
        keywords: article.categories,
        thumbnailUrl: aiImage.url || finalImageUrl,
      });

      const inserted = insertArticle(db, {
        id: articleId,
        title: article.title,
        headline: article.title,
        summary: article.summary,
        content: article.content,
        source: source.name,
        sourceUrl: article.link,
        sourceGuid,
        sourceLogoUrl: source.logoUrl,
        imageUrl: finalImageUrl,
        imageSource,
        aiImageUrl: aiImage.url,
        aiImagePrompt: aiImage.prompt,
        aiImageGeneratedAt: new Date().toISOString(),
        aiVideoUrl: video.aiVideoUrl,
        videoStatus: video.videoStatus,
        videoPrompt: video.videoPrompt,
        videoGeneratedAt: video.videoGeneratedAt,
        videoDuration: video.videoDuration,
        videoThumbnail: video.videoThumbnail || aiImage.url || finalImageUrl,
        district: filterResult.district,
        category: filterResult.category,
        publishedAt: publishedDate.toISOString(),
        language: "ta",
        contentHash: hash,
        retention,
      });
      if (inserted) {
        articlesNew++;
        console.log(`[IMAGE] SAVE id=${articleId} title="${article.title.slice(0, 60)}" category=${filterResult.category} status=SUCCESS`);
      } else {
        console.log(`[IMAGE] SAVE id=${articleId} title="${article.title.slice(0, 60)}" category=${filterResult.category} status=DUPLICATE`);
        articlesDuplicate++;
      }
    }

    updateSourceStatus(db, source.id, true);
    db.prepare(`
      UPDATE sync_logs SET completed_at = datetime('now'), status = 'success',
      articles_found = ?, articles_new = ?, articles_duplicate = ? WHERE id = ?
    `).run(result.articles.length, articlesNew, articlesDuplicate, sourceSyncId);

    const videosBackfilled = backfillArticleVideos(db);
    return { status: "success", articlesNew, articlesFound: result.articles.length, articlesFiltered, videosBackfilled, error: null };
  } catch (err: unknown) {
    const message = errorMessage(err);
    updateSourceStatus(db, source.id, false, message);
    db.prepare("UPDATE sync_logs SET completed_at = datetime('now'), status = 'error', error = ? WHERE id = ?")
      .run(message, sourceSyncId);
    return { status: "error", articlesNew: 0, articlesFound: 0, articlesFiltered: 0, videosBackfilled: 0, error: message };
  }
}
