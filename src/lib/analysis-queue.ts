import { getDbInstance } from "@/lib/db";
import { analyzeWithGroq, getArticlesPendingAnalysis, updateArticleAnalysis } from "@/lib/analyze-with-groq";
import { logger } from "@/lib/logger";

let processing = false;
let queueInterval: ReturnType<typeof setInterval> | null = null;
let groqConfigured: boolean | null = null;

export async function processAnalysisQueue(): Promise<number> {
  if (processing) return 0;

  if (groqConfigured === null) {
    groqConfigured = !!process.env.GROQ_API_KEY;
    if (!groqConfigured) {
      logger.warn("Analysis Queue", "GROQ_API_KEY not set — analysis disabled, using keyword fallback");
      return 0;
    }
  }

  if (!groqConfigured) return 0;

  processing = true;
  let processed = 0;

  try {
    const articles = getArticlesPendingAnalysis();
    if (articles.length === 0) {
      processing = false;
      return 0;
    }

    logger.info("Analysis Queue", `Analyzing ${articles.length} articles with Groq`);

    for (const article of articles) {
      const result = await analyzeWithGroq(
        article.title,
        article.summary || "",
        article.content || "",
        article.category,
      );

      if (result) {
        updateArticleAnalysis(article.id, result);
        processed++;
        logger.info("Analysis Queue", `Article ${article.id} analyzed`, {
          category: result.category,
          location: result.location,
          scene: result.scene,
        });
      } else {
        logger.warn("Analysis Queue", `Groq analysis failed for article ${article.id}`);
        processed++;
      }
    }

    logger.info("Analysis Queue", `Processed ${processed} articles`);
  } catch (err) {
    logger.error("Analysis Queue", "Fatal error", { error: err instanceof Error ? err.message : String(err) });
  } finally {
    processing = false;
  }

  return processed;
}

export function startAnalysisQueue(): void {
  if (queueInterval) return;
  logger.info("Analysis Queue", "Starting (interval: 15s)");
  setTimeout(() => processAnalysisQueue(), 3000);
  queueInterval = setInterval(() => processAnalysisQueue(), 15000);
}

export function stopAnalysisQueue(): void {
  if (queueInterval) {
    clearInterval(queueInterval);
    queueInterval = null;
  }
}
