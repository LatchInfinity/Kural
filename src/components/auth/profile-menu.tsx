"use client";
import { useState, useRef, useEffect } from "react";
import { useUserStore } from "@/store/user-store";
import { useAppStore } from "@/store/app-store";
import { LogOut, Bookmark, User, Flame } from "lucide-react";

export default function ProfileMenu() {
  const currentUser = useUserStore((s) => s.currentUser);
  const logout = useUserStore((s) => s.logout);
  const setActiveNav = useAppStore((s) => s.setActiveNav);
  const streak = useUserStore((s) => s.getStreaks);
  const streaks = streak();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!currentUser) return null;

  const avatar = currentUser.profileImage || currentUser.username[0].toUpperCase();
  const isImage = currentUser.profileImage.length > 0;

  const streakMilestone = (streak: number): string | null => {
    if (streak >= 365) return "🔥 365 Day Streak";
    if (streak >= 100) return "🔥 100 Day Streak";
    if (streak >= 50) return "🔥 50 Day Streak";
    if (streak >= 30) return "🔥 30 Day Streak";
    if (streak >= 7) return "🔥 7 Day Streak";
    return null;
  };

  const bestStreak = Math.max(streaks.readingStreak, streaks.listeningStreak);
  const milestone = streakMilestone(bestStreak);

  return (
    <div className="notranslate relative" ref={ref} translate="no">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-1 rounded-md hover:bg-surface-highlight transition-colors cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-accent">{avatar}</span>
          )}
        </div>
        <span className="text-xs font-medium text-foreground-secondary hidden sm:block max-w-[80px] truncate">
          {currentUser.username}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-sm shadow-lg z-[300]">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-xs font-semibold text-foreground truncate">{currentUser.username}</p>
            <p className="text-[10px] text-foreground-secondary/50 truncate">{currentUser.email}</p>
          </div>

          {bestStreak > 0 && (
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={13} style={{ color: "var(--color-breaking)" }} />
                <span className="text-[11px] font-semibold text-foreground-secondary/80">
                  {bestStreak} Day Streak
                </span>
              </div>
              <div className="text-[10px] text-foreground-secondary/60">
                <span>Listen: {streaks.listeningStreak}d</span>
              </div>
              {milestone && (
                <div className="mt-1 text-[10px] font-semibold text-accent">
                  {milestone}
                </div>
              )}
            </div>
          )}

          <div className="py-1">
            <button
              onClick={() => { setOpen(false); setActiveNav("profile"); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground-secondary hover:bg-surface-highlight transition-colors cursor-pointer"
            >
              <User size={13} />
              Profile
            </button>
            <button
              onClick={() => { setOpen(false); setActiveNav("saved"); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground-secondary hover:bg-surface-highlight transition-colors cursor-pointer"
            >
              <Bookmark size={13} />
              Saved Articles
            </button>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-surface-highlight transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
