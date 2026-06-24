export interface BalanceOptions {
  maxConsecutive?: number;
  sortByRecency?: boolean;
}

export function balanceSources<T extends { source: string; publishedAt?: string }>(
  articles: T[],
  options: BalanceOptions = {}
): T[] {
  const { maxConsecutive = 2, sortByRecency = true } = options;

  if (articles.length <= 1) return articles;

  const bySource = new Map<string, T[]>();
  for (const a of articles) {
    const key = a.source;
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(a);
  }

  const sourceEntries = [...bySource.entries()].map(([source, items]) => {
    if (sortByRecency) {
      items.sort((a, b) => {
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return db - da;
      });
    }
    return { source, items, index: 0 };
  });

  sourceEntries.sort((a, b) => b.items.length - a.items.length);

  const total = articles.length;
  const result: T[] = [];
  let lastSource: string | null = null;
  let consecutive = 0;

  while (result.length < total) {
    let picked = false;

    for (const entry of sourceEntries) {
      if (entry.index >= entry.items.length) continue;

      if (entry.source === lastSource && consecutive >= maxConsecutive) continue;

      result.push(entry.items[entry.index]);
      entry.index++;
      picked = true;

      if (entry.source === lastSource) {
        consecutive++;
      } else {
        consecutive = 1;
        lastSource = entry.source;
      }

      if (result.length >= total) break;
    }

    if (!picked) {
      for (const entry of sourceEntries) {
        while (entry.index < entry.items.length) {
          result.push(entry.items[entry.index]);
          entry.index++;
          if (result.length >= total) break;
        }
        if (result.length >= total) break;
      }
      break;
    }
  }

  return result;
}
