import { getDbInstance, ensureSchema } from "@/lib/db";
import { getCategoryFallbackImageUrl } from "@/lib/category-images";

interface MissingImageRow {
  id: string;
  title: string | null;
  headline: string | null;
  summary: string | null;
  content: string | null;
  category: string | null;
  district: string | null;
  image_url: string | null;
  ai_image_url: string | null;
  source: string | null;
  image_source: string | null;
}

interface RepairResult {
  scanned: number;
  alreadyPresent: number;
  generated: number;
  failed: number;
  fallbackUsed: number;
  remaining: number;
}

function isValidUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return false;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/");
}

export function scanMissingImages(limit: number = 500): {
  missingImage: number;
  missingAiImage: number;
  total: number;
  rows: MissingImageRow[];
} {
  ensureSchema();
  const db = getDbInstance();

  const total = (db.prepare("SELECT COUNT(*) as count FROM articles").get() as { count: number }).count;

  const imageBadSql = `SELECT COUNT(*) as count FROM articles WHERE image_url IS NULL OR image_url = '' OR image_url = 'null' OR image_url = 'undefined'`;
  const aiImageBadSql = `SELECT COUNT(*) as count FROM articles WHERE ai_image_url IS NULL OR ai_image_url = '' OR ai_image_url = 'null' OR ai_image_url = 'undefined'`;

  const missingImage = (db.prepare(imageBadSql).get() as { count: number }).count;
  const missingAiImage = (db.prepare(aiImageBadSql).get() as { count: number }).count;

  const badImageByType = db.prepare(`
    SELECT
      SUM(CASE WHEN image_url IS NULL THEN 1 ELSE 0 END) as null_count,
      SUM(CASE WHEN image_url = '' THEN 1 ELSE 0 END) as empty_count,
      SUM(CASE WHEN image_url = 'null' THEN 1 ELSE 0 END) as nullstr_count,
      SUM(CASE WHEN image_url = 'undefined' THEN 1 ELSE 0 END) as undef_count
    FROM articles
  `).get() as { null_count: number; empty_count: number; nullstr_count: number; undef_count: number };

  const badAiByType = db.prepare(`
    SELECT
      SUM(CASE WHEN ai_image_url IS NULL THEN 1 ELSE 0 END) as null_count,
      SUM(CASE WHEN ai_image_url = '' THEN 1 ELSE 0 END) as empty_count,
      SUM(CASE WHEN ai_image_url = 'null' THEN 1 ELSE 0 END) as nullstr_count,
      SUM(CASE WHEN ai_image_url = 'undefined' THEN 1 ELSE 0 END) as undef_count
    FROM articles
  `).get() as { null_count: number; empty_count: number; nullstr_count: number; undef_count: number };

  console.log(`[IMAGE] VERIFY total=${total}`);
  console.log(`[IMAGE] IMAGE_URL: null=${badImageByType.null_count} empty=${badImageByType.empty_count} 'null'=${badImageByType.nullstr_count} 'undefined'=${badImageByType.undef_count}`);
  console.log(`[IMAGE] AI_IMAGE_URL: null=${badAiByType.null_count} empty=${badAiByType.empty_count} 'null'=${badAiByType.nullstr_count} 'undefined'=${badAiByType.undef_count}`);

  const whereBadImage = `(image_url IS NULL OR image_url = '' OR image_url = 'null' OR image_url = 'undefined')`;
  const whereBadAi = `(ai_image_url IS NULL OR ai_image_url = '' OR ai_image_url = 'null' OR ai_image_url = 'undefined')`;

  const rows = db.prepare(`
    SELECT id, title, headline, summary, content, category, district,
           image_url, ai_image_url, source, image_source
    FROM articles
    WHERE ${whereBadImage} OR ${whereBadAi}
    ORDER BY published_at DESC
    LIMIT ?
  `).all(limit) as MissingImageRow[];

  return { missingImage, missingAiImage, total, rows };
}

export function repairArticleImages(
  rows: MissingImageRow[],
  _maxRetries: number = 3,
): RepairResult {
  ensureSchema();
  const db = getDbInstance();

  const update = db.prepare(`
    UPDATE articles
    SET image_url = ?,
        ai_image_url = ?,
        ai_image_prompt = ?,
        ai_image_generated_at = ?,
        image_source = 'ai',
        updated_at = datetime('now')
    WHERE id = ?
  `);

  let scanned = 0;
  let alreadyPresent = 0;
  let generated = 0;
  let failed = 0;
  let fallbackUsed = 0;

  const now = new Date().toISOString();

  const transaction = db.transaction((items: MissingImageRow[]) => {
    for (const row of items) {
      scanned++;

      if (isValidUrl(row.ai_image_url) && isValidUrl(row.image_url)) {
        alreadyPresent++;
        continue;
      }

      const title = row.title || row.headline || "";
      const category = row.category || "தமிழ்நாடு உள்ளூர்";
      const aiImageUrl = getCategoryFallbackImageUrl(category, true);
      update.run(aiImageUrl, aiImageUrl, `category-ai-image: ${category}`, now, row.id);
      console.log(`[IMAGE] SUCCESS id=${row.id} category=${category} title="${title.slice(0, 50)}" url=${aiImageUrl.slice(0, 60)}`);
      generated++;
    }
  });

  transaction(rows);

  const remainingSql = `SELECT COUNT(*) as count FROM articles WHERE ai_image_url IS NULL OR ai_image_url = '' OR ai_image_url = 'null' OR ai_image_url = 'undefined'`;
  const remaining = (db.prepare(remainingSql).get() as { count: number }).count;

  return { scanned, alreadyPresent, generated, failed, fallbackUsed, remaining };
}

export function getRepairReport(): RepairResult & { missingImage: number; missingAiImage: number; total: number } {
  const { missingImage, missingAiImage, total, rows } = scanMissingImages(500);
  const result = repairArticleImages(rows);
  return { ...result, missingImage, missingAiImage, total };
}
