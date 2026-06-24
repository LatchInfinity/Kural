import type { MetadataRoute } from "next";
import { TAMIL_NADU_NEWS_CATEGORIES } from "@/lib/news-config";

const CATEGORIES = [...TAMIL_NADU_NEWS_CATEGORIES];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kural.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}?category=${encodeURIComponent(cat)}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
