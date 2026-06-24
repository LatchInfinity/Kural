export interface Palette {
  sky: [string, string, string];
  ground: [string, string];
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  shadow: string;
  highlight: string;
}

export const PALETTES: Record<string, Palette> = {
  "Politics": { sky: ["#0c1e4d", "#1e3a8a", "#3b82f6"], ground: ["#1e3a8a", "#0c1e4d"], primary: "#fbbf24", secondary: "#60a5fa", accent: "#1e40af", glow: "#fbbf24", shadow: "#020617", highlight: "#fde68a" },
  "Government": { sky: ["#0c4a6e", "#0369a1", "#0ea5e9"], ground: ["#0c4a6e", "#082f49"], primary: "#fde68a", secondary: "#7dd3fc", accent: "#0c4a6e", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Press Conference": { sky: ["#1e1b4b", "#3730a3", "#6366f1"], ground: ["#1e1b4b", "#0f0e2e"], primary: "#fbbf24", secondary: "#a5b4fc", accent: "#4338ca", glow: "#fbbf24", shadow: "#020617", highlight: "#fde68a" },
  "Election": { sky: ["#7c2d12", "#c2410c", "#f97316"], ground: ["#7c2d12", "#431407"], primary: "#fde68a", secondary: "#fdba74", accent: "#c2410c", glow: "#fde68a", shadow: "#1c0a02", highlight: "#fef3c7" },
  "Temple": { sky: ["#7f1d1d", "#b91c1c", "#f59e0b"], ground: ["#7f1d1d", "#450a0a"], primary: "#fde68a", secondary: "#fbbf24", accent: "#7f1d1d", glow: "#fde68a", shadow: "#1c0606", highlight: "#fef9c3" },
  "Festival": { sky: ["#581c87", "#7e22ce", "#ec4899"], ground: ["#581c87", "#3b0764"], primary: "#fbbf24", secondary: "#f9a8d4", accent: "#7e22ce", glow: "#fbbf24", shadow: "#1c0730", highlight: "#fef3c7" },
  "Chennai City": { sky: ["#0f172a", "#1e293b", "#475569"], ground: ["#0f172a", "#020617"], primary: "#fde68a", secondary: "#94a3b8", accent: "#334155", glow: "#fde68a", shadow: "#000000", highlight: "#fef3c7" },
  "Coimbatore": { sky: ["#0c4a6e", "#0891b2", "#22d3ee"], ground: ["#0c4a6e", "#082f49"], primary: "#fde68a", secondary: "#67e8f9", accent: "#0c4a6e", glow: "#fde68a", shadow: "#082f49", highlight: "#fef3c7" },
  "Madurai": { sky: ["#7c2d12", "#9a3412", "#ea580c"], ground: ["#7c2d12", "#431407"], primary: "#fde68a", secondary: "#fdba74", accent: "#9a3412", glow: "#fde68a", shadow: "#1c0a02", highlight: "#fef3c7" },
  "Rain": { sky: ["#0c1a2e", "#1e3a5f", "#334155"], ground: ["#0c1a2e", "#020617"], primary: "#94a3b8", secondary: "#60a5fa", accent: "#1e40af", glow: "#60a5fa", shadow: "#000000", highlight: "#cbd5e1" },
  "Flood": { sky: ["#082f49", "#0c4a6e", "#0e7490"], ground: ["#082f49", "#020617"], primary: "#fde68a", secondary: "#22d3ee", accent: "#0c4a6e", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Cyclone": { sky: ["#1e1b4b", "#312e81", "#1e3a5f"], ground: ["#1e1b4b", "#0f0e2e"], primary: "#94a3b8", secondary: "#cbd5e1", accent: "#312e81", glow: "#cbd5e1", shadow: "#000000", highlight: "#e2e8f0" },
  "Heatwave": { sky: ["#7c2d12", "#ea580c", "#fbbf24"], ground: ["#7c2d12", "#431407"], primary: "#fde68a", secondary: "#fcd34d", accent: "#ea580c", glow: "#fde68a", shadow: "#1c0a02", highlight: "#fef9c3" },
  "Agriculture": { sky: ["#14532d", "#16a34a", "#84cc16"], ground: ["#14532d", "#052e16"], primary: "#fde68a", secondary: "#bef264", accent: "#16a34a", glow: "#bef264", shadow: "#052e16", highlight: "#ecfccb" },
  "Farmer": { sky: ["#7c2d12", "#ca8a04", "#facc15"], ground: ["#451a03", "#1c0a02"], primary: "#fde68a", secondary: "#a3e635", accent: "#854d0e", glow: "#fde68a", shadow: "#1c0a02", highlight: "#fef9c3" },
  "Education": { sky: ["#0c1e4d", "#1e3a8a", "#3b82f6"], ground: ["#0c1e4d", "#020617"], primary: "#fde68a", secondary: "#93c5fd", accent: "#1e3a8a", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "School": { sky: ["#831843", "#be185d", "#ec4899"], ground: ["#831843", "#500724"], primary: "#fde68a", secondary: "#fbcfe8", accent: "#be185d", glow: "#fde68a", shadow: "#3f0413", highlight: "#fef9c3" },
  "Exam": { sky: ["#1e1b4b", "#4338ca", "#818cf8"], ground: ["#1e1b4b", "#0f0e2e"], primary: "#fde68a", secondary: "#c7d2fe", accent: "#4338ca", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Health": { sky: ["#0c4a6e", "#0891b2", "#06b6d4"], ground: ["#0c4a6e", "#082f49"], primary: "#fde68a", secondary: "#67e8f9", accent: "#0c4a6e", glow: "#fde68a", shadow: "#082f49", highlight: "#fef3c7" },
  "Doctor": { sky: ["#0f172a", "#1e3a5f", "#475569"], ground: ["#0f172a", "#020617"], primary: "#fde68a", secondary: "#94a3b8", accent: "#1e3a5f", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Technology": { sky: ["#0c0a1f", "#1e1b4b", "#312e81"], ground: ["#0c0a1f", "#020617"], primary: "#22d3ee", secondary: "#a78bfa", accent: "#312e81", glow: "#22d3ee", shadow: "#000000", highlight: "#a5f3fc" },
  "Artificial Intelligence": { sky: ["#020617", "#0c0a1f", "#1e1b4b"], ground: ["#020617", "#000000"], primary: "#a78bfa", secondary: "#22d3ee", accent: "#7c3aed", glow: "#a78bfa", shadow: "#000000", highlight: "#c4b5fd" },
  "Startup": { sky: ["#0c1e4d", "#0891b2", "#06b6d4"], ground: ["#0c1e4d", "#020617"], primary: "#22d3ee", secondary: "#a78bfa", accent: "#0891b2", glow: "#22d3ee", shadow: "#020617", highlight: "#a5f3fc" },
  "Business": { sky: ["#0c1e4d", "#1e3a8a", "#3b82f6"], ground: ["#0c1e4d", "#020617"], primary: "#fde68a", secondary: "#93c5fd", accent: "#1e3a8a", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Stock Market": { sky: ["#064e3b", "#047857", "#10b981"], ground: ["#064e3b", "#022c22"], primary: "#fde68a", secondary: "#6ee7b7", accent: "#047857", glow: "#fde68a", shadow: "#022c22", highlight: "#fef9c3" },
  "Banking": { sky: ["#1e1b4b", "#3730a3", "#4f46e5"], ground: ["#1e1b4b", "#0f0e2e"], primary: "#fde68a", secondary: "#a5b4fc", accent: "#3730a3", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Crime": { sky: ["#0f0a0a", "#1c0a02", "#3f0d0d"], ground: ["#0f0a0a", "#000000"], primary: "#dc2626", secondary: "#f87171", accent: "#7f1d1d", glow: "#dc2626", shadow: "#000000", highlight: "#fecaca" },
  "Court": { sky: ["#0c1e4d", "#1e3a8a", "#475569"], ground: ["#0c1e4d", "#020617"], primary: "#fde68a", secondary: "#94a3b8", accent: "#1e3a8a", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Corruption": { sky: ["#1c0a02", "#3f0d0d", "#7c2d12"], ground: ["#1c0a02", "#000000"], primary: "#fbbf24", secondary: "#fdba74", accent: "#7c2d12", glow: "#fbbf24", shadow: "#000000", highlight: "#fde68a" },
  "Arrest": { sky: ["#0f0a0a", "#1c0a02", "#3f0d0d"], ground: ["#0f0a0a", "#000000"], primary: "#fbbf24", secondary: "#f87171", accent: "#7f1d1d", glow: "#fbbf24", shadow: "#000000", highlight: "#fde68a" },
  "Electricity": { sky: ["#0c0a1f", "#1e1b4b", "#312e81"], ground: ["#0c0a1f", "#020617"], primary: "#fde68a", secondary: "#fbbf24", accent: "#312e81", glow: "#fde68a", shadow: "#000000", highlight: "#fef9c3" },
  "Power Cut": { sky: ["#0c0a1f", "#1e1b4b", "#312e81"], ground: ["#020617", "#000000"], primary: "#fb923c", secondary: "#fdba74", accent: "#1e1b4b", glow: "#fb923c", shadow: "#000000", highlight: "#fde68a" },
  "Metro": { sky: ["#0c1e4d", "#1e3a8a", "#2563eb"], ground: ["#0c1e4d", "#020617"], primary: "#22d3ee", secondary: "#93c5fd", accent: "#1e40af", glow: "#22d3ee", shadow: "#020617", highlight: "#a5f3fc" },
  "Railway": { sky: ["#0c1e4d", "#1e3a5f", "#334155"], ground: ["#0c1e4d", "#020617"], primary: "#fde68a", secondary: "#94a3b8", accent: "#1e3a5f", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Bridge": { sky: ["#0c1e4d", "#1e3a8a", "#3b82f6"], ground: ["#082f49", "#020617"], primary: "#fde68a", secondary: "#7dd3fc", accent: "#1e3a8a", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Highway": { sky: ["#1c0a02", "#7c2d12", "#ea580c"], ground: ["#1c0a02", "#000000"], primary: "#fde68a", secondary: "#fdba74", accent: "#7c2d12", glow: "#fde68a", shadow: "#000000", highlight: "#fef9c3" },
  "Airport": { sky: ["#0c1e4d", "#1e3a8a", "#3b82f6"], ground: ["#0c1e4d", "#020617"], primary: "#fde68a", secondary: "#93c5fd", accent: "#1e3a8a", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Bus Transport": { sky: ["#1e1b4b", "#3730a3", "#4f46e5"], ground: ["#1e1b4b", "#0f0e2e"], primary: "#fde68a", secondary: "#a5b4fc", accent: "#3730a3", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Traffic": { sky: ["#0c1a2e", "#1e3a5f", "#334155"], ground: ["#0c1a2e", "#020617"], primary: "#fde68a", secondary: "#fb923c", accent: "#dc2626", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Protest": { sky: ["#1c0a02", "#3f0d0d", "#7c2d12"], ground: ["#1c0a02", "#000000"], primary: "#fde68a", secondary: "#fdba74", accent: "#7c2d12", glow: "#fde68a", shadow: "#000000", highlight: "#fef9c3" },
  "Rally": { sky: ["#0c1e4d", "#1e3a8a", "#7c3aed"], ground: ["#0c1e4d", "#020617"], primary: "#fde68a", secondary: "#a78bfa", accent: "#1e3a8a", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Cricket": { sky: ["#064e3b", "#047857", "#10b981"], ground: ["#064e3b", "#022c22"], primary: "#fde68a", secondary: "#fcd34d", accent: "#047857", glow: "#fde68a", shadow: "#022c22", highlight: "#fef9c3" },
  "Football": { sky: ["#064e3b", "#065f46", "#10b981"], ground: ["#064e3b", "#022c22"], primary: "#fde68a", secondary: "#bef264", accent: "#065f46", glow: "#fde68a", shadow: "#022c22", highlight: "#fef9c3" },
  "Chess": { sky: ["#0c0a1f", "#1e1b4b", "#312e81"], ground: ["#0c0a1f", "#020617"], primary: "#fde68a", secondary: "#cbd5e1", accent: "#1e1b4b", glow: "#fde68a", shadow: "#000000", highlight: "#fef9c3" },
  "Kabaddi": { sky: ["#7c2d12", "#c2410c", "#f97316"], ground: ["#7c2d12", "#431407"], primary: "#fde68a", secondary: "#fcd34d", accent: "#c2410c", glow: "#fde68a", shadow: "#1c0a02", highlight: "#fef9c3" },
  "Tourism": { sky: ["#0c4a6e", "#0891b2", "#22d3ee"], ground: ["#0c4a6e", "#082f49"], primary: "#fde68a", secondary: "#67e8f9", accent: "#0c4a6e", glow: "#fde68a", shadow: "#082f49", highlight: "#fef3c7" },
  "Environment": { sky: ["#064e3b", "#047857", "#10b981"], ground: ["#022c22", "#000000"], primary: "#bef264", secondary: "#84cc16", accent: "#047857", glow: "#bef264", shadow: "#000000", highlight: "#ecfccb" },
  "Wildlife": { sky: ["#1c0a02", "#3f0d0d", "#7c2d12"], ground: ["#1c0a02", "#000000"], primary: "#fbbf24", secondary: "#a3e635", accent: "#854d0e", glow: "#fbbf24", shadow: "#000000", highlight: "#fde68a" },
  "Fire Accident": { sky: ["#1c0a02", "#7c2d12", "#dc2626"], ground: ["#1c0a02", "#000000"], primary: "#fde68a", secondary: "#f87171", accent: "#dc2626", glow: "#fde68a", shadow: "#000000", highlight: "#fef9c3" },
  "Road Accident": { sky: ["#0f0a0a", "#1c0a02", "#7c2d12"], ground: ["#0f0a0a", "#000000"], primary: "#fde68a", secondary: "#fb923c", accent: "#dc2626", glow: "#fde68a", shadow: "#000000", highlight: "#fde68a" },
  "Water Supply": { sky: ["#0c1e4d", "#1e40af", "#0ea5e9"], ground: ["#082f49", "#020617"], primary: "#22d3ee", secondary: "#7dd3fc", accent: "#1e40af", glow: "#22d3ee", shadow: "#082f49", highlight: "#a5f3fc" },
  "Industry": { sky: ["#0c1e4d", "#1e3a5f", "#475569"], ground: ["#0c1e4d", "#020617"], primary: "#fde68a", secondary: "#fb923c", accent: "#1e3a5f", glow: "#fde68a", shadow: "#020617", highlight: "#fef3c7" },
  "Fishing": { sky: ["#831843", "#be185d", "#f59e0b"], ground: ["#831843", "#500724"], primary: "#fde68a", secondary: "#fdba74", accent: "#be185d", glow: "#fde68a", shadow: "#3f0413", highlight: "#fef9c3" },
  "Port": { sky: ["#0c1e4d", "#1e3a8a", "#0ea5e9"], ground: ["#082f49", "#020617"], primary: "#fde68a", secondary: "#7dd3fc", accent: "#1e3a8a", glow: "#fde68a", shadow: "#082f49", highlight: "#fef3c7" },
  "Default": { sky: ["#0c0a1f", "#1e1b4b", "#312e81"], ground: ["#020617", "#000000"], primary: "#a78bfa", secondary: "#22d3ee", accent: "#312e81", glow: "#a78bfa", shadow: "#000000", highlight: "#c4b5fd" },
};

const CATEGORY_TO_SCENE: Record<string, string> = {
  "Tamil Nadu": "Politics",
  "Chennai": "Chennai City",
  "Madurai": "Madurai",
  "Coimbatore": "Coimbatore",
  "Tiruchirappalli": "Temple",
  "Salem": "Agriculture",
  "Tirunelveli": "Temple",
  "Erode": "Agriculture",
  "Government": "Government",
  "Politics": "Politics",
  "Business": "Business",
  "Sports": "Cricket",
  "Technology": "Technology",
  "Education": "Education",
  "Health": "Health",
  "Agriculture": "Agriculture",
  "Weather": "Rain",
  "Crime": "Crime",
  "Culture": "Festival",
  "Infrastructure": "Bridge",
};

export function resolveSceneName(scene?: string | null, category?: string | null): string {
  if (scene && PALETTES[scene]) return scene;
  if (scene) {
    const lower = scene.toLowerCase();
    const match = Object.keys(PALETTES).find((k) => k.toLowerCase() === lower);
    if (match) return match;
  }
  if (category && CATEGORY_TO_SCENE[category]) return CATEGORY_TO_SCENE[category];
  return "Default";
}
