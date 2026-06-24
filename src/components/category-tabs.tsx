"use client";
import { useRef, useEffect } from "react";
import {
  Newspaper, Landmark, Briefcase, Cpu, Trophy, GraduationCap,
  Sprout, CloudSun, Bus, ShieldAlert, MapPin,
} from "lucide-react";

const ALL_CATEGORIES: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "", label: "All News", icon: <Newspaper size={14} /> },
  { id: "தமிழ்நாடு அரசியல்", label: "Politics", icon: <Landmark size={14} /> },
  { id: "தமிழ்நாடு வணிகம்", label: "Business", icon: <Briefcase size={14} /> },
  { id: "தமிழ்நாடு தொழில்நுட்பம்", label: "Technology", icon: <Cpu size={14} /> },
  { id: "தமிழ்நாடு விளையாட்டு", label: "Sports", icon: <Trophy size={14} /> },
  { id: "தமிழ்நாடு கல்வி", label: "Education", icon: <GraduationCap size={14} /> },
  { id: "தமிழ்நாடு வேளாண்மை", label: "Agriculture", icon: <Sprout size={14} /> },
  { id: "தமிழ்நாடு வானிலை", label: "Weather", icon: <CloudSun size={14} /> },
  { id: "தமிழ்நாடு போக்குவரத்து", label: "Transport", icon: <Bus size={14} /> },
  { id: "தமிழ்நாடு விபத்து", label: "Accident", icon: <ShieldAlert size={14} /> },
  { id: "தமிழ்நாடு குற்றம்", label: "Crime", icon: <ShieldAlert size={14} /> },
  { id: "__district__", label: "District News", icon: <MapPin size={14} /> },
];

export default function CategoryTabs({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (cat: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-cat="${active}"]`) as HTMLElement | null;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [active]);

  return (
    <div ref={scrollRef} className="notranslate flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none" translate="no">
      {ALL_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          data-cat={cat.id}
          onClick={() => onSelect(cat.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-sm whitespace-nowrap cursor-pointer transition-colors shrink-0"
          style={{
            color: active === cat.id ? "#fff" : "var(--color-accent)",
            background: active === cat.id ? "var(--color-accent)" : "var(--color-accent-muted)",
          }}
        >
          {cat.icon}
          {cat.label}
        </button>
      ))}
    </div>
  );
}
