"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, Headphones, Bookmark, Menu, X, Sun, Moon, Flame, Search, Radio } from "lucide-react";
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

const categoryItems = [
  { label: "Politics", category: "தமிழ்நாடு அரசியல்" },
  { label: "Government", category: "தமிழ்நாடு அரசு" },
  { label: "Business", category: "தமிழ்நாடு வணிகம்" },
  { label: "Technology", category: "தமிழ்நாடு தொழில்நுட்பம்" },
  { label: "Sports", category: "தமிழ்நாடு விளையாட்டு" },
  { label: "Weather", category: "தமிழ்நாடு வானிலை" },
  { label: "Districts", category: "" },
];

export default function Header() {
  const { activeNav, setActiveNav, theme, toggleTheme } = useAppStore();
  const setCategoryFilter = useNewsStore((s) => s.setCategoryFilter);
  const streak = useUserStore((s) => s.getStreaks);
  const streaks = streak();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const showStreak = streaks.listeningStreak > 0;

  return (
    <header
      className="notranslate kural-news-header fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      translate="no"
      style={{
        boxShadow: scrolled ? "0 12px 34px rgba(15,23,42,0.08)" : "none",
      }}
    >
      <div className="kural-header-topline">
        <div className="kural-header-inner flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
            <Radio size={13} className="text-accent" />
            <span className="truncate">Live Tamil Nadu Audio Desk</span>
          </div>
          <div className="hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-secondary/70 sm:flex">
            <span>AI Voice Briefings</span>
            <span className="h-1 w-1 rounded-full bg-foreground-secondary/40" />
            <span>Fresh Editions</span>
          </div>
        </div>
      </div>

      <div className="kural-header-inner">
        <div className="kural-masthead-row">
          <button
            onClick={() => { setActiveNav("home"); setCategoryFilter(""); }}
            className="kural-wordmark shrink-0 cursor-pointer"
          >
            <span className="kural-wordmark-mark">K</span>
            <span className="kural-wordmark-title">KURAL</span>
            <span className="kural-wordmark-subtitle">Tamil AI Voice News</span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveNav(item.id); setMobileOpen(false); if (item.id === "home") setCategoryFilter(""); }}
                  className="relative flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition-colors cursor-pointer"
                  style={{
                    color: isActive ? "var(--color-news-red)" : "var(--color-foreground-secondary)",
                    background: isActive ? "var(--color-news-red-muted)" : "transparent",
                  }}
                >
                  {Icon && <Icon size={14} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            {showStreak && (
              <div className="hidden sm:flex items-center gap-1 mr-1 px-2 py-1 rounded-sm bg-accent/5 border border-accent/10">
                <Flame size={12} style={{ color: "var(--color-breaking)" }} />
                <span className="text-[10px] font-bold text-foreground-secondary/80">
                  {streaks.listeningStreak}
                </span>
              </div>
            )}
            <ProfileMenu />
            <button
              onClick={() => setActiveNav("categories")}
              className="hidden p-2 rounded-sm text-foreground-secondary hover:text-foreground hover:bg-surface-highlight transition-colors cursor-pointer sm:inline-flex"
              aria-label="Search categories"
            >
              <Search size={15} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-sm text-foreground-secondary hover:text-foreground hover:bg-surface-highlight transition-colors cursor-pointer"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-sm text-foreground-secondary hover:text-foreground hover:bg-surface-highlight transition-colors cursor-pointer"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="kural-section-nav">
        <div className="kural-header-inner flex items-center gap-1 overflow-x-auto scrollbar-none">
          {categoryItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setActiveNav(item.category ? "home" : "categories");
                setCategoryFilter(item.category);
                setMobileOpen(false);
              }}
              className="whitespace-nowrap px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-foreground-secondary/75 hover:text-foreground transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { setActiveNav("audio-news"); setMobileOpen(false); }}
            className="ml-auto hidden whitespace-nowrap px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-accent hover:text-foreground transition-colors cursor-pointer sm:inline-flex"
          >
            Listen Live
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="lg:hidden border-t border-border bg-background"
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveNav(item.id); setMobileOpen(false); if (item.id === "home") setCategoryFilter(""); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors text-left cursor-pointer"
                  style={{
                    color: isActive ? "var(--color-news-red)" : "var(--color-foreground)",
                    background: isActive ? "var(--color-news-red-muted)" : "transparent",
                  }}
                >
                  {item.label}
                  <span className="text-foreground-secondary/50 text-xs">{item.labelTa}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </header>
  );
}
