export function parseRelativeDate(text: string): string | null {
  const now = new Date();
  const lower = text.toLowerCase();
  if (lower.includes("just now") || lower.includes("இப்போது")) return now.toISOString();
  const minMatch = lower.match(/(\d+)\s*(min|நிமிட|m\b)/);
  if (minMatch) return new Date(now.getTime() - parseInt(minMatch[1]) * 60000).toISOString();
  const hourMatch = lower.match(/(\d+)\s*(hour|மணி|h\b)/);
  if (hourMatch) return new Date(now.getTime() - parseInt(hourMatch[1]) * 3600000).toISOString();
  const dayMatch = lower.match(/(\d+)\s*(day|நாள்|d\b)/);
  if (dayMatch) return new Date(now.getTime() - parseInt(dayMatch[1]) * 86400000).toISOString();
  return null;
}
