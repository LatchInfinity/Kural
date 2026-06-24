"use client";

import { useState, useEffect } from "react";
import { Newspaper, Headphones, Bookmark, Menu, X, Sun, Moon, Flame, Radio } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useUserStore } from "@/store/user-store";
import { useNewsStore } from "@/store/news-store";
import ProfileMenu from "@/components/auth/profile-menu";

const navItems = [
  { id: "home", label: "Home", labelTa: "முகப்பு" },
  { id: "newspaper-view", icon: Newspaper, label: "Newspaper", labelTa: "செய்தித்தாள்" },
  { id: "audio-news", icon: Headphones, label: "Audio News", labelTa: "ஆடியோ" },
  { id: "saved", icon: Bookmark, label: "Saved", labelTa: "சேமித்தவை" },
];

export default function Header() {
  const { activeNav, setActiveNav, theme, toggleTheme } = useAppStore();
  const setCategoryFilter = useNewsStore((s) => s.setCategoryFilter);
  const streaks = useUserStore((s) => s.getStreaks)();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const showStreak = streaks.listeningStreak > 0;

  return (
    <header className="notranslate" translate="no">
      <div className="flex items-center justify-between gap-3 px-4 h-14 border-b border-border bg-background">
        <button
          onClick={() => { setActiveNav("home"); setCategoryFilter(""); }}
          className="flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Radio size={18} className="text-red-600" />
            <span className="text-lg font-black tracking-tight text-foreground">KURAL</span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); if (item.id === "home") setCategoryFilter(""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-[0.06em] transition-colors"
                style={{
                  color: isActive ? "var(--color-news-red)" : "var(--color-foreground-secondary)",
                  background: isActive ? "var(--color-news-red-muted)" : "transparent",
                }}
              >
                {Icon && <Icon size={13} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          {showStreak && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-accent/5 border border-accent/10">
              <Flame size={11} style={{ color: "var(--color-breaking)" }} />
              <span className="text-[9px] font-bold text-foreground-secondary/80">{streaks.listeningStreak}</span>
            </div>
          )}
          <ProfileMenu />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-foreground-secondary hover:text-foreground hover:bg-surface-highlight transition-colors"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md text-foreground-secondary hover:text-foreground hover:bg-surface-highlight transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-2 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setMobileOpen(false); if (item.id === "home") setCategoryFilter(""); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left"
                style={{
                  color: isActive ? "var(--color-news-red)" : "var(--color-foreground-secondary)",
                  background: isActive ? "var(--color-news-red-muted)" : "transparent",
                }}
              >
                {Icon && <Icon size={15} />}
                <span>{item.label}</span>
                <span className="text-foreground-secondary/40 text-xs ml-auto">{item.labelTa}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
