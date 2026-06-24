"use client";
import { motion } from "framer-motion";
import { Flame, Star, Trophy, Target, Headphones, Bookmark, Share2, X } from "lucide-react";
import { useUserStore } from "@/store/user-store";

const taskIcons: Record<string, React.ReactNode> = {
  "listen-articles": <Headphones size={11} />,
  "listen-duration": <Flame size={11} />,
  "listen-categories": <Star size={11} />,
  "save-articles": <Bookmark size={11} />,
  "share-article": <Share2 size={11} />,
};

export default function StreakPopup({ onClose }: { onClose: () => void }) {
  const currentUser = useUserStore((s) => s.currentUser);
  if (!currentUser) return null;

  const currentStreak = currentUser.streak?.listeningStreak ?? 0;
  const bestStreak = currentUser.streak?.bestListeningStreak ?? 0;
  const totalPoints = currentUser.rewards?.points ?? 0;
  const tasks = currentUser.rewards?.dailyTasks ?? [];
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-full mt-1 w-64 bg-surface border border-border rounded-sm shadow-lg z-[300]"
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame size={16} style={{ color: "var(--color-breaking)" }} />
          <span className="text-xs font-bold text-foreground">Streak & Points</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-surface-highlight"
          aria-label="Close streak popup"
        >
          <X size={12} />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center py-1.5 px-1 rounded-sm bg-accent/5">
            <Flame size={14} style={{ color: "var(--color-breaking)" }} />
            <span className="text-sm font-bold text-foreground mt-0.5">{currentStreak}</span>
            <span className="text-[9px] text-foreground-secondary/60">Current</span>
          </div>
          <div className="flex flex-col items-center py-1.5 px-1 rounded-sm bg-accent/5">
            <Star size={14} style={{ color: "var(--color-accent)" }} />
            <span className="text-sm font-bold text-foreground mt-0.5">{totalPoints}</span>
            <span className="text-[9px] text-foreground-secondary/60">Points</span>
          </div>
          <div className="flex flex-col items-center py-1.5 px-1 rounded-sm bg-accent/5">
            <Trophy size={14} style={{ color: "var(--color-accent)" }} />
            <span className="text-sm font-bold text-foreground mt-0.5">{bestStreak}</span>
            <span className="text-[9px] text-foreground-secondary/60">Best</span>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 mb-2">
          <Target size={12} style={{ color: "var(--color-accent)" }} />
          <span className="text-[10px] font-semibold text-foreground-secondary/80">Today&apos;s Progress</span>
          <span className="ml-auto text-[10px] font-bold text-foreground-secondary/60">{completedTasks}/{totalTasks}</span>
        </div>
        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
              background: "var(--color-accent)",
            }}
          />
        </div>
      </div>

      <div className="py-1.5 max-h-52 overflow-y-auto">
        <div className="px-3 pb-1 text-[9px] font-semibold text-foreground-secondary/50 uppercase tracking-wider">Daily Missions</div>
        {tasks.map((task) => {
          const pct = task.target > 0 ? Math.round((task.progress / task.target) * 100) : 0;
          return (
            <div key={task.id} className="px-3 py-1.5 hover:bg-surface-highlight transition-colors">
              <div className="flex items-center gap-2">
                <span style={{ opacity: task.completed ? 1 : 0.4, color: "var(--color-accent)" }}>
                  {taskIcons[task.id] || <Target size={11} />}
                </span>
                <span className={`text-[10px] flex-1 ${task.completed ? "text-foreground line-through opacity-50" : "text-foreground-secondary/80"}`}>
                  {task.label}
                </span>
                <span className="text-[9px] font-semibold" style={{ color: task.completed ? "var(--color-accent)" : "var(--color-foreground-secondary)" }}>
                  +{task.points}
                </span>
              </div>
              <div className="mt-1 w-full h-1 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: task.completed ? "var(--color-accent)" : "var(--color-foreground-secondary)", opacity: task.completed ? 1 : 0.2 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
