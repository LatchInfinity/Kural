import type { Edition } from "@/types";

export const EDITIONS: Edition[] = [
  { id: "morning", label: "Morning Edition", labelTa: "காலை பதிப்பு", hours: [6, 9], accent: "#e8b84c", accentSoft: "#f0cc6a", accentGlow: "rgba(232,184,76,0.25)" },
  { id: "midday", label: "Midday Bulletin", labelTa: "நண்பகல் புல்லட்டின்", hours: [9, 12], accent: "#f0a030", accentSoft: "#f8b840", accentGlow: "rgba(240,160,48,0.2)" },
  { id: "afternoon", label: "Afternoon Report", labelTa: "மதிய அறிக்கை", hours: [12, 15], accent: "#d49040", accentSoft: "#e0a050", accentGlow: "rgba(212,144,64,0.2)" },
  { id: "evening", label: "Evening News", labelTa: "மாலை செய்திகள்", hours: [15, 18], accent: "#d48050", accentSoft: "#e09060", accentGlow: "rgba(212,128,80,0.2)" },
  { id: "primetime", label: "Prime Time", labelTa: "பிரைம் டைம்", hours: [18, 22], accent: "#c06050", accentSoft: "#d07060", accentGlow: "rgba(192,96,80,0.2)" },
  { id: "night", label: "Night Bulletin", labelTa: "இரவு புல்லட்டின்", hours: [22, 6], accent: "#7050c0", accentSoft: "#8060d0", accentGlow: "rgba(112,80,192,0.2)" },
];

export function getCurrentEdition(): Edition {
  const hour = new Date().getHours();
  for (const ed of EDITIONS) {
    if (ed.id === "night") {
      if (hour >= ed.hours[0] || hour < ed.hours[1]) return ed;
    } else {
      if (hour >= ed.hours[0] && hour < ed.hours[1]) return ed;
    }
  }
  return EDITIONS[0];
}

export function getEditionTimeRemaining(edition: Edition): string {
  const hour = new Date().getHours();
  let endHour = edition.hours[1];
  if (edition.id === "night" && endHour < edition.hours[0]) endHour += 24;
  let hoursLeft = endHour - hour;
  if (hoursLeft < 0) hoursLeft += 24;
  if (hoursLeft === 0) return "Ending soon";
  if (hoursLeft === 1) return "1 hour left";
  return `${hoursLeft} hours left`;
}
