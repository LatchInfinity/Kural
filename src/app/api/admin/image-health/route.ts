import { NextRequest, NextResponse } from "next/server";
import { getDbInstance } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/route-auth";
import { TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Admin API disabled" }, { status: 404 });
  }

  const db = getDbInstance();
  const allowedCategoryPlaceholders = TAMIL_NADU_NEWS_CATEGORIES.map(() => "?").join(", ");

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };

  const validImageUrl = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE image_url IS NOT NULL AND image_url != '' AND image_url != 'null' AND image_url != 'undefined' AND (image_url LIKE 'http://%' OR image_url LIKE 'https://%') AND category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };
  const validAiImageUrl = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE ai_image_url IS NOT NULL AND ai_image_url != '' AND ai_image_url != 'null' AND ai_image_url != 'undefined' AND (ai_image_url LIKE 'http://%' OR ai_image_url LIKE 'https://%') AND category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };

  const sameUrl = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE image_url IS NOT NULL AND ai_image_url IS NOT NULL AND image_url = ai_image_url AND category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };
  const differentUrl = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE image_url IS NOT NULL AND ai_image_url IS NOT NULL AND image_url != ai_image_url AND category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };

  const withSourceImages = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE image_url IS NOT NULL AND image_url != '' AND image_url != 'null' AND image_url != 'undefined' AND image_url NOT LIKE '%pollinations.ai%' AND category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };
  const withPollinationsImages = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE image_url IS NOT NULL AND image_url != '' AND image_url != 'null' AND image_url != 'undefined' AND image_url LIKE '%pollinations.ai%' AND category IN (${allowedCategoryPlaceholders})`).get(...TAMIL_NADU_NEWS_CATEGORIES) as { count: number };

  const categoryBreakdown = db.prepare(`
    SELECT category,
      COUNT(*) as total,
      SUM(CASE WHEN image_url IS NOT NULL AND image_url != '' AND image_url != 'null' AND image_url != 'undefined' AND (image_url LIKE 'http://%' OR image_url LIKE 'https://%') THEN 1 ELSE 0 END) as valid_images,
      SUM(CASE WHEN image_url IS NULL OR image_url = '' OR image_url = 'null' OR image_url = 'undefined' OR (image_url NOT LIKE 'http://%' AND image_url NOT LIKE 'https://%') THEN 1 ELSE 0 END) as broken_images,
      SUM(CASE WHEN image_source = 'ai_repair' OR image_source = 'fallback' THEN 1 ELSE 0 END) as repaired_images,
      SUM(CASE WHEN image_url LIKE '%pollinations.ai%' THEN 1 ELSE 0 END) as pollinations_urls
    FROM articles
    WHERE category IN (${allowedCategoryPlaceholders})
    GROUP BY category
    ORDER BY total DESC
  `).all(...TAMIL_NADU_NEWS_CATEGORIES) as { category: string; total: number; valid_images: number; broken_images: number; repaired_images: number; pollinations_urls: number }[];

  const brokenByCategory = categoryBreakdown.filter(c => c.broken_images > 0).map(c => ({ category: c.category, broken: c.broken_images, total: c.total }));

  return NextResponse.json({
    totalArticles: totalRow.count,
    validImageUrl: validImageUrl.count,
    validAiImageUrl: validAiImageUrl.count,
    sameUrlBothColumns: sameUrl.count,
    differentUrlColumns: differentUrl.count,
    withSourceImages: withSourceImages.count,
    withPollinationsImages: withPollinationsImages.count,
    categoriesWithFailures: brokenByCategory,
    categoryBreakdown,
    lastChecked: new Date().toISOString(),
  });
}
