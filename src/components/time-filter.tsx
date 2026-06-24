"use client";
import { Zap, Clock, Calendar } from "lucide-react";
import type { TimeFilter as TimeFilterType } from "@/types";

const FILTERS: { id: TimeFilterType; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Time", icon: <Clock size={12} /> },
  { id: "last-hour", label: "Last Hour", icon: <Zap size={12} /> },
  { id: "today", label: "Today", icon: <Calendar size={12} /> },
  { id: "last-3-days", label: "Last 3 Days", icon: <Calendar size={12} /> },
];

export default function TimeFilter({
  active,
  onSelect,
}: {
  active: TimeFilterType;
  onSelect: (f: TimeFilterType) => void;
}) {
  return (
    <div className="notranslate flex items-center gap-1" translate="no">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelect(f.id)}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-sm cursor-pointer transition-colors"
          style={{
            color: active === f.id ? "var(--color-breaking)" : "var(--color-foreground-secondary)",
            background: active === f.id ? "var(--color-breaking-glow)" : "transparent",
            border: active === f.id ? "1px solid var(--color-breaking)" : "1px solid transparent",
          }}
        >
          {f.icon}
          {f.label}
        </button>
      ))}
    </div>
  );
}
