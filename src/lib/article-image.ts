import { existsSync } from "fs";
import path from "path";
import { getCategoryImageUrl } from "@/lib/category-images";
import { getSceneImageUrl, getSceneFilename, isValidScene } from "@/lib/scenes";

const SCENES_DIR = path.join(process.cwd(), "public", "generated-scenes");

export interface ArticleImageInput {
  imageUrl?: string | null;
  imageSource?: string | null;
  category?: string | null;
  sceneName?: string | null;
}

export function sceneFileExists(sceneName: string): boolean {
  if (!isValidScene(sceneName)) return false;
  const filePath = path.join(SCENES_DIR, getSceneFilename(sceneName));
  return existsSync(filePath);
}

export function resolveArticleImage(input: ArticleImageInput): string {
  const { imageUrl, imageSource, category, sceneName } = input;

  if (sceneName && isValidScene(sceneName) && sceneFileExists(sceneName)) {
    return getSceneImageUrl(sceneName);
  }

  if (imageUrl && imageUrl.trim() && imageSource === "ai" && imageUrl.startsWith("/generated-scenes/")) {
    const fullPath = path.join(process.cwd(), "public", imageUrl);
    if (existsSync(fullPath)) return imageUrl;
  }

  return getCategoryImageUrl(category || "");
}

export function batchResolveImages(
  articles: ArticleImageInput[],
): string[] {
  return articles.map((a) => resolveArticleImage(a));
}
