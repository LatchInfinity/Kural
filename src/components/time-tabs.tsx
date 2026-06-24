"use client";
import { useAppStore } from "@/store/app-store";
import { getTimePeriodLabelTa } from "@/lib/news";
import type { TimePeriod } from "@/types";

const periods: TimePeriod[] = ["all", "morning", "afternoon", "evening", "night"];

const periodLabels: Record<TimePeriod, string> = {
  all: "All News",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

export default function TimeTabs() {
  const { timeFilter, setTimeFilter } = useAppStore();

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-border-light">
      {periods.map((p) => {
        const isActive = timeFilter === p;
        return (
          <button
            key={p}
            onClick={() => setTimeFilter(p)}
            className="relative px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            style={{
              color: isActive ? "var(--color-accent)" : "var(--color-foreground-secondary)",
              borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {p === "all" ? periodLabels[p] : getTimePeriodLabelTa(p)}
          </button>
        );
      })}
    </div>
  );
}
