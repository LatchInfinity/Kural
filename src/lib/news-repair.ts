import type Database from "better-sqlite3";
import { resolveArticleVideo } from "@/lib/news-video";
import { detectCategory } from "@/lib/rss/tn-filter";

interface RepairRow {
  id: string;
  title: string | null;
  headline: string | null;
  summary: string | null;
  content: string | null;
  category: string | null;
  district: string | null;
  image_url: string | null;
  ai_image_url: string | null;
  search_keywords: string | null;
  tags: string | null;
}

export interface NewsRepairResult {
  checked: number;
  updated: number;
  categoriesUpdated: number;
  videosUpdated: number;
}

export function repairArticleCategoriesAndVideos(database: Database.Database, limit = 500): NewsRepairResult {
  const rows = database.prepare(`
    SELECT id, title, headline, summary, content, category, district,
           image_url, ai_image_url, search_keywords, tags
    FROM articles
    WHERE retention != 'archived'
    ORDER BY published_at DESC
    LIMIT ?
  `).all(limit) as RepairRow[];

  if (rows.length === 0) {
    return { checked: 0, updated: 0, categoriesUpdated: 0, videosUpdated: 0 };
  }

  const update = database.prepare(`
    UPDATE articles
    SET category = ?,
        ai_video_url = ?,
        video_status = ?,
        video_prompt = ?,
        video_generated_at = ?,
        video_duration = ?,
        video_thumbnail = '',
        updated_at = datetime('now')
    WHERE id = ?
  `);

  let updated = 0;
  let categoriesUpdated = 0;
  let videosUpdated = 0;

  const transaction = database.transaction((items: RepairRow[]) => {
    for (const row of items) {
      const title = row.title || row.headline || "";
      const summary = row.summary || "";
      const content = row.content || "";
      const category = detectCategory(title, summary, content);
      const video = resolveArticleVideo({
        id: row.id,
        title,
        headline: row.headline,
        summary,
        content,
        category,
        district: row.district,
        keywords: [row.search_keywords || "", row.tags || ""],
        thumbnailUrl: "",
      });

      if (category !== row.category) categoriesUpdated++;
      videosUpdated++;
      updated++;

      update.run(
        category,
        video.aiVideoUrl,
        video.videoStatus,
        video.videoPrompt,
        video.videoGeneratedAt,
        video.videoDuration,
        row.id,
      );
    }
  });

  transaction(rows);

  return {
    checked: rows.length,
    updated,
    categoriesUpdated,
    videosUpdated,
  };
}
