"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useNewsStore } from "@/store/news-store";
import { getArticleHeadlineText, type NewsTextLanguage } from "@/lib/news-text";

export default function FlashTicker({ language = "ta" }: { language?: NewsTextLanguage }) {
  const articles = useNewsStore((s) => s.articles);
  const breakingItems = useMemo(
    () => articles.filter((n) => n.isBreaking || n.retention === "breaking"),
    [articles]
  );
  const items = breakingItems.map((n) => getArticleHeadlineText(n, language)).join("  ◆  ");

  if (items.length === 0) return null;

  return (
    <div className="h-10 bg-background border-y border-border flex items-center">
      <div className="notranslate flex items-center gap-2 px-3 h-full shrink-0 bg-accent" translate="no">
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-white"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-white text-[10px] font-bold tracking-[1px] uppercase">LIVE</span>
        <Zap size={10} className="text-white" />
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, var(--color-background), transparent 5%, transparent 95%, var(--color-background))" }} />
        <div className="animate-ticker flex whitespace-nowrap pt-0.5">
          <span className="text-[11px] text-foreground-secondary/70 font-medium px-4">{items}</span>
          <span className="text-[11px] text-foreground-secondary/70 font-medium px-4">{items}</span>
        </div>
      </div>
    </div>
  );
}
