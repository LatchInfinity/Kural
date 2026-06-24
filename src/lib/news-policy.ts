import {
  BLOCKED_NEWS_CATEGORIES,
  ENTERTAINMENT_KEYWORDS,
  TAMIL_NADU_NEWS_CATEGORIES,
} from "@/lib/news-config";

interface PolicyArticleInput {
  title?: string | null;
  headline?: string | null;
  summary?: string | null;
  tamilSummary?: string | null;
  content?: string | null;
  category?: string | null;
  source?: string | null;
}

function normalizePolicyText(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^\w\s\u0B80-\u0BFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPolicyKeyword(text: string, keyword: string): boolean {
  const normalizedKeyword = normalizePolicyText(keyword);
  if (!normalizedKeyword) return false;
  if (/^[a-z0-9 ]+$/.test(normalizedKeyword)) {
    const pattern = new RegExp(`(^|\\s)${escapeRegex(normalizedKeyword)}($|\\s)`);
    return pattern.test(text);
  }
  return text.includes(normalizedKeyword);
}

export function isBlockedNewsCategory(category?: string | null): boolean {
  const normalized = normalizePolicyText(category);
  return BLOCKED_NEWS_CATEGORIES.some((blocked) => normalizePolicyText(blocked) === normalized);
}

export function isDisplayableNewsCategory(category?: string | null): boolean {
  if (!category || isBlockedNewsCategory(category)) return false;
  return TAMIL_NADU_NEWS_CATEGORIES.some((allowed) => allowed === category);
}

export function containsEntertainmentContent(input: PolicyArticleInput): boolean {
  if (isBlockedNewsCategory(input.category)) return true;
  const text = normalizePolicyText([
    input.title,
    input.headline,
    input.summary,
    input.tamilSummary,
    input.content,
    input.category,
    input.source,
  ].filter(Boolean).join(" "));
  return ENTERTAINMENT_KEYWORDS.some((keyword) => hasPolicyKeyword(text, keyword));
}

export function isDisplayableNewsItem(input: PolicyArticleInput): boolean {
  return isDisplayableNewsCategory(input.category) && !containsEntertainmentContent(input);
}
