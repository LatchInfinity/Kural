"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNewsStore } from "@/store/news-store";
import { getArticleHeadlineText } from "@/lib/news-text";
import type { NewsItem } from "@/types";

function relativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return "";
  }
}

export default function BreakingNewsBar() {
  const articles = useNewsStore((s) => s.articles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLabel, setTimeLabel] = useState("");

  const breakingItems = useMemo(
    () => articles.filter((n) => n.isBreaking || n.retention === "breaking"),
    [articles],
  );

  const items = useMemo(
    () => breakingItems.length > 0 ? breakingItems : articles.slice(0, 10),
    [breakingItems, articles],
  );

  useEffect(() => {
    if (items.length === 0) return;
    const el = items[currentIndex % items.length];
    setTimeLabel(relativeTime(el.publishedAt));
    const ticker = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % items.length);
    }, 4000);
    const clock = setInterval(() => {
      const idx = currentIndex % items.length;
      setTimeLabel(relativeTime(items[idx].publishedAt));
    }, 30000);
    return () => {
      clearInterval(ticker);
      clearInterval(clock);
    };
  }, [items, currentIndex]);

  const current = items[currentIndex % items.length];

  if (items.length === 0) return null;

  return (
    <div className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center h-11 px-4 gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-red-500">
            BREAKING
          </span>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden relative h-full flex items-center">
          <motion.div
            key={current?.id}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 whitespace-nowrap"
          >
            <span className="text-sm font-semibold text-foreground truncate">
              {current ? getArticleHeadlineText(current, "ta") : ""}
            </span>
            <span className="text-[10px] text-foreground-secondary/50 shrink-0">
              {timeLabel}
            </span>
          </motion.div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {items.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex % items.length
                  ? "bg-red-500 w-3"
                  : "bg-foreground-secondary/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
