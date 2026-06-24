import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { NEWS_RETENTION_MS } from "@/lib/news-config";
import { containsEntertainmentContent, isBlockedNewsCategory, isDisplayableNewsCategory } from "@/lib/news-policy";
import { resolveNewsAnimationScene } from "@/lib/news-animation";
import { resolveArticleVideo } from "@/lib/news-video";
import { generateArticleImage } from "@/lib/rss/image-generator";
import { detectCategory } from "@/lib/rss/tn-filter";

const DB_DIR = process.env.KURAL_DB_DIR
  || (process.env.VERCEL ? path.join("/tmp", "kural-data") : path.join(process.cwd(), "data"));
const DB_PATH = path.join(DB_DIR, "kural.db");

let db: Database.Database | null = null;
let appliedSchemaSignature = "";

interface ColumnDef {
  name: string;
  definition: string;
}

const ARTICLES_COLUMNS: ColumnDef[] = [
  { name: "id", definition: "TEXT PRIMARY KEY" },
  { name: "title", definition: "TEXT NOT NULL" },
  { name: "headline", definition: "TEXT NOT NULL" },
  { name: "summary", definition: "TEXT" },
  { name: "content", definition: "TEXT" },
  { name: "source", definition: "TEXT NOT NULL" },
  { name: "source_url", definition: "TEXT" },
  { name: "source_guid", definition: "TEXT" },
  { name: "source_logo_url", definition: "TEXT" },
  { name: "image_url", definition: "TEXT" },
  { name: "ai_image_url", definition: "TEXT" },
  { name: "ai_image_prompt", definition: "TEXT" },
  { name: "ai_image_generated_at", definition: "TEXT" },
  { name: "ai_video_url", definition: "TEXT" },
  { name: "video_status", definition: "TEXT DEFAULT 'pending'" },
  { name: "video_prompt", definition: "TEXT" },
  { name: "video_generated_at", definition: "TEXT" },
  { name: "video_duration", definition: "INTEGER DEFAULT 5" },
  { name: "video_thumbnail", definition: "TEXT" },
  { name: "animation_scene", definition: "TEXT" },
  { name: "animation_embed_url", definition: "TEXT" },
  { name: "image_source", definition: "TEXT DEFAULT 'auto'" },
  { name: "slug", definition: "TEXT" },
  { name: "search_keywords", definition: "TEXT" },
  { name: "tags", definition: "TEXT" },
  { name: "district", definition: "TEXT" },
  { name: "plays_count", definition: "INTEGER DEFAULT 0" },
  { name: "shares_count", definition: "INTEGER DEFAULT 0" },
  { name: "saves_count", definition: "INTEGER DEFAULT 0" },
  { name: "reactions_count", definition: "INTEGER DEFAULT 0" },
  { name: "category", definition: "TEXT DEFAULT 'general'" },
  { name: "published_at", definition: "TEXT NOT NULL" },
  { name: "language", definition: "TEXT DEFAULT 'ta'" },
  { name: "audio_generated", definition: "INTEGER DEFAULT 0" },
  { name: "content_hash", definition: "TEXT" },
  { name: "retention", definition: "TEXT DEFAULT 'latest'" },
  { name: "created_at", definition: "TEXT DEFAULT (datetime('now'))" },
  { name: "updated_at", definition: "TEXT DEFAULT (datetime('now'))" },
];

const SCHEMA_SIGNATURE = ARTICLES_COLUMNS.map((column) => `${column.name}:${column.definition}`).join("|");

const RSS_SOURCES_COLUMNS: ColumnDef[] = [
  { name: "id", definition: "TEXT PRIMARY KEY" },
  { name: "name", definition: "TEXT NOT NULL" },
  { name: "name_ta", definition: "TEXT NOT NULL" },
  { name: "feed_url", definition: "TEXT NOT NULL UNIQUE" },
  { name: "website_url", definition: "TEXT" },
  { name: "logo_url", definition: "TEXT" },
  { name: "category", definition: "TEXT" },
  { name: "active", definition: "INTEGER DEFAULT 1" },
  { name: "last_fetched_at", definition: "TEXT" },
  { name: "error_count", definition: "INTEGER DEFAULT 0" },
  { name: "last_error", definition: "TEXT" },
  { name: "created_at", definition: "TEXT DEFAULT (datetime('now'))" },
];

const SYNC_LOGS_COLUMNS: ColumnDef[] = [
  { name: "id", definition: "TEXT PRIMARY KEY" },
  { name: "source_id", definition: "TEXT" },
  { name: "source_name", definition: "TEXT" },
  { name: "started_at", definition: "TEXT DEFAULT (datetime('now'))" },
  { name: "completed_at", definition: "TEXT" },
  { name: "status", definition: "TEXT DEFAULT 'running'" },
  { name: "articles_found", definition: "INTEGER DEFAULT 0" },
  { name: "articles_new", definition: "INTEGER DEFAULT 0" },
  { name: "articles_duplicate", definition: "INTEGER DEFAULT 0" },
  { name: "error", definition: "TEXT" },
];

const FEED_ERRORS_COLUMNS: ColumnDef[] = [
  { name: "id", definition: "TEXT PRIMARY KEY" },
  { name: "source_id", definition: "TEXT" },
  { name: "source_name", definition: "TEXT" },
  { name: "error_type", definition: "TEXT" },
  { name: "error_message", definition: "TEXT" },
  { name: "occurred_at", definition: "TEXT DEFAULT (datetime('now'))" },
];

const GENERATED_IMAGES_COLUMNS: ColumnDef[] = [
  { name: "scene_name", definition: "TEXT PRIMARY KEY" },
  { name: "image_url", definition: "TEXT NOT NULL" },
  { name: "prompt", definition: "TEXT" },
  { name: "created_at", definition: "TEXT DEFAULT (datetime('now'))" },
  { name: "updated_at", definition: "TEXT DEFAULT (datetime('now'))" },
];

interface TableSchema {
  tableName: string;
  columns: ColumnDef[];
  createSQL: string;
}

function getTableSchemas(): TableSchema[] {
  return [
    {
      tableName: "articles",
      columns: ARTICLES_COLUMNS,
      createSQL: `
        CREATE TABLE IF NOT EXISTS articles (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          headline TEXT NOT NULL,
          summary TEXT,
          content TEXT,
          source TEXT NOT NULL,
          source_url TEXT,
          source_guid TEXT,
          source_logo_url TEXT,
          image_url TEXT,
          ai_image_url TEXT,
          ai_image_prompt TEXT,
          ai_image_generated_at TEXT,
          ai_video_url TEXT,
          video_status TEXT DEFAULT 'pending',
          video_prompt TEXT,
          video_generated_at TEXT,
          video_duration INTEGER DEFAULT 5,
          video_thumbnail TEXT,
          animation_scene TEXT,
          animation_embed_url TEXT,
          image_source TEXT DEFAULT 'auto',
          slug TEXT,
          search_keywords TEXT,
          tags TEXT,
          district TEXT,
          plays_count INTEGER DEFAULT 0,
          shares_count INTEGER DEFAULT 0,
          saves_count INTEGER DEFAULT 0,
          reactions_count INTEGER DEFAULT 0,
          category TEXT DEFAULT 'general',
          published_at TEXT NOT NULL,
          language TEXT DEFAULT 'ta',
          audio_generated INTEGER DEFAULT 0,
          content_hash TEXT,
          retention TEXT DEFAULT 'latest',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
        CREATE INDEX IF NOT EXISTS idx_articles_retention ON articles(retention);
        CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
        CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
        CREATE INDEX IF NOT EXISTS idx_articles_district ON articles(district);
        CREATE INDEX IF NOT EXISTS idx_articles_video_status ON articles(video_status);
        CREATE INDEX IF NOT EXISTS idx_articles_plays ON articles(plays_count DESC);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_source_url ON articles(source_url);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);
      `,
    },
    {
      tableName: "rss_sources",
      columns: RSS_SOURCES_COLUMNS,
      createSQL: `
        CREATE TABLE IF NOT EXISTS rss_sources (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          name_ta TEXT NOT NULL,
          feed_url TEXT NOT NULL UNIQUE,
          website_url TEXT,
          logo_url TEXT,
          category TEXT,
          active INTEGER DEFAULT 1,
          last_fetched_at TEXT,
          error_count INTEGER DEFAULT 0,
          last_error TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `,
    },
    {
      tableName: "sync_logs",
      columns: SYNC_LOGS_COLUMNS,
      createSQL: `
        CREATE TABLE IF NOT EXISTS sync_logs (
          id TEXT PRIMARY KEY,
          source_id TEXT,
          source_name TEXT,
          started_at TEXT DEFAULT (datetime('now')),
          completed_at TEXT,
          status TEXT DEFAULT 'running',
          articles_found INTEGER DEFAULT 0,
          articles_new INTEGER DEFAULT 0,
          articles_duplicate INTEGER DEFAULT 0,
          error TEXT
        );
      `,
    },
    {
      tableName: "feed_errors",
      columns: FEED_ERRORS_COLUMNS,
      createSQL: `
        CREATE TABLE IF NOT EXISTS feed_errors (
          id TEXT PRIMARY KEY,
          source_id TEXT,
          source_name TEXT,
          error_type TEXT,
          error_message TEXT,
          occurred_at TEXT DEFAULT (datetime('now'))
        );
      `,
    },
    {
      tableName: "generated_images",
      columns: GENERATED_IMAGES_COLUMNS,
      createSQL: `
        CREATE TABLE IF NOT EXISTS generated_images (
          scene_name TEXT PRIMARY KEY,
          image_url TEXT NOT NULL,
          prompt TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
      `,
    },
  ];
}

function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    try {
      db.pragma("journal_mode = WAL");
    } catch {
      // Some serverless filesystems do not support WAL; SQLite still works without it.
    }
    db.pragma("foreign_keys = ON");
    initSchema(db);
    runMigrations(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  for (const schema of getTableSchemas()) {
    db.exec(schema.createSQL);
  }
}

function migrateTable(db: Database.Database, schema: TableSchema): void {
  const rows = db.prepare(`PRAGMA table_info(${schema.tableName})`).all() as { name: string }[];
  const existing = new Set(rows.map((r) => r.name));

  for (const col of schema.columns) {
    if (!existing.has(col.name)) {
      const sql = `ALTER TABLE ${schema.tableName} ADD COLUMN ${col.name} ${col.definition}`;
      try {
        db.exec(sql);
        console.log(`[DB Migration] Added column: ${schema.tableName}.${col.name}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[DB Migration] Failed to add ${schema.tableName}.${col.name}: ${message}`);
      }
    }
  }
}

function runMigrations(db: Database.Database): void {
  console.log("[DB Migration] Checking schema...");
  for (const schema of getTableSchemas()) {
    migrateTable(db, schema);
  }
  ensureIndexes(db);
  appliedSchemaSignature = SCHEMA_SIGNATURE;
  console.log("[DB Migration] Schema is up to date");
}

function ensureIndexes(db: Database.Database): void {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_articles_source_guid ON articles(source_guid);
    CREATE INDEX IF NOT EXISTS idx_articles_video_status ON articles(video_status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_source_guid_unique
      ON articles(source, source_guid)
      WHERE source_guid IS NOT NULL AND source_guid != '';
  `);
}

export function getDbInstance(): Database.Database {
  const database = getDb();
  if (appliedSchemaSignature !== SCHEMA_SIGNATURE) {
    runMigrations(database);
  }
  return database;
}

export function ensureSchema(): void {
  const database = getDbInstance();
  for (const schema of getTableSchemas()) {
    migrateTable(database, schema);
  }
  ensureIndexes(database);
  appliedSchemaSignature = SCHEMA_SIGNATURE;
}

interface ArticleVideoFileRow {
  id: string;
  ai_video_url: string | null;
  video_thumbnail: string | null;
}

interface ArticleRepairRow {
  id: string;
  title: string | null;
  headline: string | null;
  summary: string | null;
  content: string | null;
  category: string | null;
  district: string | null;
  image_url: string | null;
  image_source: string | null;
  ai_image_url: string | null;
  ai_image_prompt: string | null;
  ai_image_generated_at: string | null;
  ai_video_url: string | null;
  video_status: string | null;
  video_prompt: string | null;
  video_generated_at: string | null;
  video_duration: number | null;
  video_thumbnail: string | null;
  animation_scene: string | null;
  search_keywords: string | null;
  tags: string | null;
}

function isArticleOwnedVideoPath(publicUrl: string, articleId: string): boolean {
  const cleanUrl = publicUrl.split(/[?#]/)[0].replace(/\\/g, "/");
  if (!cleanUrl.startsWith("/generated-videos/")) return false;

  const segments = cleanUrl.split("/").filter(Boolean);
  const filename = segments[segments.length - 1] || "";
  return segments.includes(articleId) || filename.startsWith(`${articleId}.`) || filename.startsWith(`${articleId}-`);
}

function deleteGeneratedArticleFile(publicUrl: string | null, articleId: string): void {
  if (!publicUrl || !isArticleOwnedVideoPath(publicUrl, articleId)) return;

  try {
    const relative = decodeURIComponent(publicUrl.split(/[?#]/)[0].replace(/^\/+/, ""));
    const publicDir = path.resolve(process.cwd(), "public");
    const generatedRoot = path.resolve(publicDir, "generated-videos");
    const filePath = path.resolve(publicDir, relative);
    const normalizedRoot = generatedRoot.toLowerCase();
    const normalizedPath = filePath.toLowerCase();

    if (!normalizedPath.startsWith(`${normalizedRoot}${path.sep}`)) return;
    fs.rmSync(filePath, { force: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[DB Cleanup] Could not delete generated video file for article ${articleId}: ${message}`);
  }
}

function deleteGeneratedArticleVideoFiles(rows: ArticleVideoFileRow[]): void {
  for (const row of rows) {
    deleteGeneratedArticleFile(row.ai_video_url, row.id);
    deleteGeneratedArticleFile(row.video_thumbnail, row.id);
  }
}

function deleteTtsCacheForArticleIds(articleIds: string[]): void {
  if (articleIds.length === 0) return;
  const cacheDir = path.join(
    process.env.VERCEL ? "/tmp" : process.cwd(),
    "data",
    "tts-cache",
  );
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(cacheDir);
  } catch {
    return;
  }
  const idSet = new Set(articleIds);
  const cacheFilesToDelete: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const baseName = entry.slice(0, -".json".length);
    if (seen.has(baseName)) continue;
    seen.add(baseName);
    try {
      const metaRaw = fs.readFileSync(path.join(cacheDir, entry), "utf8");
      const meta = JSON.parse(metaRaw) as { newsId?: string };
      if (meta.newsId && idSet.has(meta.newsId)) {
        cacheFilesToDelete.push(baseName);
      }
    } catch {
      // skip unreadable metadata files
    }
  }
  for (const baseName of cacheFilesToDelete) {
    try {
      fs.rmSync(path.join(cacheDir, `${baseName}.audio`), { force: true });
    } catch { /* ignore */ }
    try {
      fs.rmSync(path.join(cacheDir, `${baseName}.json`), { force: true });
    } catch { /* ignore */ }
  }
}

export function expireOldArticles(database: Database.Database = getDbInstance()): number {
  const cutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();
  const rows = database.prepare(`
    SELECT id, ai_video_url, video_thumbnail
    FROM articles
    WHERE published_at < ?
  `).all(cutoff) as ArticleVideoFileRow[];

  const ids = rows.map((r) => r.id);
  deleteTtsCacheForArticleIds(ids);

  const result = database.prepare(`
    DELETE FROM articles
    WHERE published_at < ?
  `).run(cutoff);
  deleteGeneratedArticleVideoFiles(rows);
  return result.changes;
}

export function purgeBlockedArticles(database: Database.Database = getDbInstance()): number {
  const rows = database.prepare(`
    SELECT id, title, headline, summary, content, source, category, ai_video_url, video_thumbnail
    FROM articles
  `).all() as {
    id: string;
    title: string | null;
    headline: string | null;
    summary: string | null;
    content: string | null;
    source: string | null;
    category: string | null;
    ai_video_url: string | null;
    video_thumbnail: string | null;
  }[];

  const blockedRows = rows.filter((row) => isBlockedNewsCategory(row.category) || containsEntertainmentContent(row));
  const blockedIds = blockedRows.map((row) => row.id);

  if (blockedIds.length === 0) return 0;

  deleteTtsCacheForArticleIds(blockedIds);

  const deleteStmt = database.prepare("DELETE FROM articles WHERE id = ?");
  const transaction = database.transaction((ids: string[]) => {
    for (const id of ids) deleteStmt.run(id);
  });
  transaction(blockedIds);
  deleteGeneratedArticleVideoFiles(blockedRows);
  return blockedIds.length;
}

function splitArticleKeywords(row: Pick<ArticleRepairRow, "search_keywords" | "tags">): string[] {
  return [row.search_keywords || "", row.tags || ""]
    .flatMap((value) => value.split(/[,\s]+/))
    .map((value) => value.trim())
    .filter(Boolean);
}

function shouldRefreshArticleImage(row: ArticleRepairRow, nextCategory: string): boolean {
  const hasAiImage = row.ai_image_url && row.ai_image_url.trim() && row.ai_image_url !== "null" && row.ai_image_url !== "undefined";
  if (!hasAiImage) return true;
  const prompt = row.ai_image_prompt || "";
  if (row.category !== nextCategory) return true;
  if (nextCategory !== "தமிழ்நாடு குற்றம்" && /Police Station|Court Building|Investigation/i.test(prompt)) return true;
  if (nextCategory === "தமிழ்நாடு விபத்து" && !/Safety|Factory|Rescue|Fire|Emergency/i.test(prompt)) return true;
  return false;
}

function shouldRefreshArticleVideo(row: ArticleRepairRow, nextCategory: string, nextVideoUrl: string, nextVideoStatus: string): boolean {
  const currentUrl = row.ai_video_url || "";
  const currentStatus = row.video_status || "";

  if (row.category !== nextCategory) return true;
  if (nextCategory !== "தமிழ்நாடு குற்றம்" && /\/generated-videos\/crime\//i.test(currentUrl)) return true;
  if (nextCategory === "தமிழ்நாடு விபத்து" && currentStatus !== nextVideoStatus) return true;
  return currentUrl !== nextVideoUrl;
}

export function repairStoredArticleClassifications(database: Database.Database = getDbInstance()): number {
  const rows = database.prepare(`
    SELECT id, title, headline, summary, content, category, district,
           image_url, image_source, ai_image_url, ai_image_prompt, ai_image_generated_at,
           ai_video_url, video_status, video_prompt, video_generated_at, video_duration, video_thumbnail,
           animation_scene, search_keywords, tags
    FROM articles
    WHERE retention != 'archived'
    ORDER BY published_at DESC
    LIMIT 1000
  `).all() as ArticleRepairRow[];

  if (rows.length === 0) return 0;

  const update = database.prepare(`
    UPDATE articles
    SET category = ?,
        ai_image_url = ?,
        ai_image_prompt = ?,
        ai_image_generated_at = ?,
        ai_video_url = ?,
        video_status = ?,
        video_prompt = ?,
        video_generated_at = ?,
        video_duration = ?,
        video_thumbnail = ?,
        animation_scene = ?,
        animation_embed_url = '',
        updated_at = datetime('now')
    WHERE id = ?
  `);

  let repaired = 0;
  const now = new Date().toISOString();
  const transaction = database.transaction((items: ArticleRepairRow[]) => {
    for (const row of items) {
      const title = row.title || "";
      const headline = row.headline || title;
      const summary = row.summary || "";
      const content = row.content || "";
      const nextCategory = detectCategory(headline || title, summary, content);

      if (!isDisplayableNewsCategory(nextCategory)) continue;

      const keywords = splitArticleKeywords(row);
      const refreshImage = shouldRefreshArticleImage(row, nextCategory);
      const nextImage = refreshImage
        ? generateArticleImage({
            headline: headline || title,
            category: nextCategory,
            summary,
            district: row.district || undefined,
            keywords,
          })
        : null;
      const nextAiImageUrl = nextImage?.url || row.ai_image_url || "";
      const nextAiImagePrompt = nextImage?.prompt || row.ai_image_prompt || "";
      const nextAiImageGeneratedAt = nextImage ? now : row.ai_image_generated_at || "";
      const thumbnailUrl = nextAiImageUrl || row.image_url || "";
      const nextVideo = resolveArticleVideo({
        id: row.id,
        title,
        headline,
        summary,
        content,
        category: nextCategory,
        district: row.district || "",
        keywords,
        thumbnailUrl,
      });
      const nextAnimationScene = resolveNewsAnimationScene({
        category: nextCategory,
        title,
        headline,
        summary,
        content,
      });
      const videoChanged = shouldRefreshArticleVideo(row, nextCategory, nextVideo.aiVideoUrl, nextVideo.videoStatus);
      const thumbnailChanged = (row.video_thumbnail || "") !== (nextVideo.videoThumbnail || "");
      const animationChanged = (row.animation_scene || "") !== nextAnimationScene;
      const useNextVideo = videoChanged || thumbnailChanged || refreshImage;

      const hasAiImage = row.ai_image_url && row.ai_image_url.trim() && row.ai_image_url !== "null" && row.ai_image_url !== "undefined";
      if (!refreshImage && !videoChanged && !thumbnailChanged && !animationChanged && row.category === nextCategory && hasAiImage) continue;

      update.run(
        nextCategory,
        nextAiImageUrl,
        nextAiImagePrompt,
        nextAiImageGeneratedAt,
        useNextVideo ? nextVideo.aiVideoUrl : row.ai_video_url || "",
        useNextVideo ? nextVideo.videoStatus : row.video_status || nextVideo.videoStatus,
        useNextVideo ? nextVideo.videoPrompt : row.video_prompt || "",
        useNextVideo ? nextVideo.videoGeneratedAt : row.video_generated_at || "",
        useNextVideo ? nextVideo.videoDuration : row.video_duration || nextVideo.videoDuration,
        useNextVideo ? nextVideo.videoThumbnail : row.video_thumbnail || "",
        nextAnimationScene,
        row.id,
      );
      repaired += 1;
    }
  });

  transaction(rows);
  return repaired;
}

export function cleanupStoredArticles(database: Database.Database = getDbInstance()): { expired: number; blocked: number; repaired: number } {
  const expired = expireOldArticles(database);
  const blocked = purgeBlockedArticles(database);
  const repaired = repairStoredArticleClassifications(database);
  return { expired, blocked, repaired };
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
