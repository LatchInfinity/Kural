"use client";
const LINE_STYLE = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const FILL_STYLE = { fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ACCENT = "#60A5FA";

function Wrapper({ children, viewBox = "0 0 200 120" }: { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg width="200" height="120" viewBox={viewBox} className="w-full h-full" style={{ opacity: 0.7 }}>
      {children}
    </svg>
  );
}

function Technology() {
  return (
    <Wrapper>
      <rect x="65" y="30" width="70" height="60" rx="6" ry="6" {...LINE_STYLE} opacity={0.9} />
      <rect x="70" y="35" width="60" height="50" rx="3" ry="3" {...LINE_STYLE} opacity={0.5} />
      <rect x="75" y="40" width="50" height="40" rx="2" ry="2" {...LINE_STYLE} opacity={0.3} />
      <line x1="100" y1="42" x2="100" y2="78" {...FILL_STYLE} opacity={0.2} />
      <line x1="82" y1="50" x2="82" y2="70" {...FILL_STYLE} opacity={0.2} />
      <line x1="118" y1="50" x2="118" y2="70" {...FILL_STYLE} opacity={0.2} />
      <circle cx="100" cy="60" r="4" {...FILL_STYLE} opacity={0.4} />
      <line x1="65" y1="65" x2="58" y2="65" {...FILL_STYLE} opacity={0.4} />
      <line x1="65" y1="55" x2="55" y2="55" {...FILL_STYLE} opacity={0.3} />
      <line x1="135" y1="65" x2="142" y2="65" {...FILL_STYLE} opacity={0.4} />
      <line x1="135" y1="55" x2="145" y2="55" {...FILL_STYLE} opacity={0.3} />
      <circle cx="58" cy="65" r="1.5" {...FILL_STYLE} opacity={0.5} />
      <circle cx="142" cy="65" r="1.5" {...FILL_STYLE} opacity={0.5} />
    </Wrapper>
  );
}

function Politics() {
  return (
    <Wrapper>
      <rect x="50" y="50" width="100" height="50" rx="1" ry="1" {...LINE_STYLE} opacity={0.9} />
      <polygon points="70,50 80,25 90,50" {...FILL_STYLE} opacity={0.5} />
      <polygon points="90,50 100,30 110,50" {...FILL_STYLE} opacity={0.5} />
      <polygon points="110,50 120,35 130,50" {...FILL_STYLE} opacity={0.5} />
      <rect x="60" y="55" width="80" height="3" rx="1" {...FILL_STYLE} opacity={0.3} />
      <rect x="65" y="62" width="70" height="2" rx="1" {...FILL_STYLE} opacity={0.2} />
      <rect x="70" y="68" width="60" height="2" rx="1" {...FILL_STYLE} opacity={0.2} />
      <rect x="75" y="74" width="50" height="2" rx="1" {...FILL_STYLE} opacity={0.2} />
      <rect x="55" y="90" width="90" height="8" rx="1" {...FILL_STYLE} opacity={0.15} />
      <line x1="50" y1="50" x2="50" y2="100" {...FILL_STYLE} opacity={0.5} />
      <line x1="150" y1="50" x2="150" y2="100" {...FILL_STYLE} opacity={0.5} />
    </Wrapper>
  );
}

function Business() {
  return (
    <Wrapper>
      <rect x="45" y="55" width="18" height="35" rx="1" {...FILL_STYLE} opacity={0.8} />
      <rect x="68" y="40" width="18" height="50" rx="1" {...FILL_STYLE} opacity={0.7} />
      <rect x="91" y="30" width="18" height="60" rx="1" {...FILL_STYLE} opacity={0.9} />
      <rect x="114" y="50" width="18" height="40" rx="1" {...FILL_STYLE} opacity={0.6} />
      <rect x="137" y="60" width="18" height="30" rx="1" {...FILL_STYLE} opacity={0.5} />
      <rect x="40" y="88" width="120" height="3" rx="1" {...FILL_STYLE} opacity={0.3} />
      <circle cx="100" cy="58" r="2" {...FILL_STYLE} opacity={0.5} />
      <line x1="100" y1="60" x2="100" y2="90" {...FILL_STYLE} opacity={0.2} />
      <line x1="86" y1="90" x2="86" y2="60" {...FILL_STYLE} opacity={0.15} />
      <line x1="114" y1="90" x2="114" y2="70" {...FILL_STYLE} opacity={0.15} />
    </Wrapper>
  );
}

function Sports() {
  return (
    <Wrapper>
      <ellipse cx="100" cy="55" rx="30" ry="18" {...LINE_STYLE} opacity={0.7} />
      <line x1="95" y1="37" x2="95" y2="73" {...FILL_STYLE} opacity={0.3} />
      <line x1="100" y1="37" x2="100" y2="73" {...FILL_STYLE} opacity={0.3} />
      <line x1="105" y1="37" x2="105" y2="73" {...FILL_STYLE} opacity={0.3} />
      <line x1="70" y1="55" x2="130" y2="55" {...FILL_STYLE} opacity={0.3} />
      <line x1="85" y1="35" x2="115" y2="35" {...FILL_STYLE} opacity={0.2} />
      <line x1="85" y1="75" x2="115" y2="75" {...FILL_STYLE} opacity={0.2} />
      <circle cx="100" cy="55" r="8" {...FILL_STYLE} opacity={0.4} />
      <path d="M100 47 Q108 48 108 55 Q108 62 100 63" {...FILL_STYLE} opacity={0.3} />
    </Wrapper>
  );
}

function Education() {
  return (
    <Wrapper>
      <rect x="45" y="55" width="110" height="35" rx="1" {...FILL_STYLE} opacity={0.7} />
      <polygon points="60,55 60,25 100,25 100,55" {...FILL_STYLE} opacity={0.5} />
      <rect x="50" y="85" width="100" height="5" rx="1" {...FILL_STYLE} opacity={0.15} />
      <rect x="55" y="75" width="30" height="10" rx="1" {...FILL_STYLE} opacity={0.3} />
      <rect x="90" y="75" width="30" height="10" rx="1" {...FILL_STYLE} opacity={0.3} />
      <rect x="62" y="40" width="36" height="3" rx="1" {...FILL_STYLE} opacity={0.3} />
      <rect x="67" y="47" width="26" height="3" rx="1" {...FILL_STYLE} opacity={0.25} />
      <path d="M100 25 L100 20 L110 22 L100 25" {...FILL_STYLE} opacity={0.4} />
    </Wrapper>
  );
}

function Health() {
  return (
    <Wrapper>
      <line x1="30" y1="60" x2="65" y2="60" {...FILL_STYLE} opacity={0.4} />
      <line x1="65" y1="60" x2="72" y2="60" {...FILL_STYLE} opacity={0.7} />
      <line x1="72" y1="60" x2="82" y2="35" {...LINE_STYLE} opacity={0.9} stroke={ACCENT} />
      <line x1="82" y1="35" x2="92" y2="85" {...LINE_STYLE} opacity={0.9} stroke={ACCENT} />
      <line x1="92" y1="85" x2="102" y2="45" {...LINE_STYLE} opacity={0.9} stroke={ACCENT} />
      <line x1="102" y1="45" x2="112" y2="70" {...LINE_STYLE} opacity={0.9} stroke={ACCENT} />
      <line x1="112" y1="70" x2="122" y2="55" {...LINE_STYLE} opacity={0.7} />
      <line x1="122" y1="55" x2="135" y2="55" {...FILL_STYLE} opacity={0.4} />
      <line x1="135" y1="55" x2="170" y2="55" {...FILL_STYLE} opacity={0.4} />
      <circle cx="100" cy="55" r="35" {...FILL_STYLE} opacity={0.1} />
    </Wrapper>
  );
}

function Spiritual() {
  return (
    <Wrapper>
      <polygon points="100,15 70,50 130,50" {...FILL_STYLE} opacity={0.8} />
      <rect x="75" y="50" width="50" height="8" rx="1" {...FILL_STYLE} opacity={0.6} />
      <polygon points="85,58 85,45 115,45 115,58" {...FILL_STYLE} opacity={0.3} />
      <rect x="65" y="58" width="70" height="32" rx="1" {...FILL_STYLE} opacity={0.5} />
      <rect x="55" y="70" width="90" height="4" rx="1" {...FILL_STYLE} opacity={0.2} />
      <rect x="60" y="78" width="80" height="3" rx="1" {...FILL_STYLE} opacity={0.15} />
      <rect x="70" y="62" width="60" height="2" rx="1" {...FILL_STYLE} opacity={0.2} />
      <line x1="100" y1="15" x2="100" y2="12" {...FILL_STYLE} opacity={0.4} />
      <line x1="95" y1="12" x2="105" y2="12" {...FILL_STYLE} opacity={0.4} />
      <circle cx="100" cy="28" r="3" {...FILL_STYLE} opacity={0.3} />
    </Wrapper>
  );
}

function Agriculture() {
  return (
    <Wrapper>
      <line x1="30" y1="80" x2="170" y2="80" {...FILL_STYLE} opacity={0.3} />
      <line x1="30" y1="85" x2="170" y2="85" {...FILL_STYLE} opacity={0.2} />
      <path d="M60 80 Q65 50 80 80" {...FILL_STYLE} opacity={0.6} />
      <path d="M80 80 Q90 40 105 80" {...FILL_STYLE} opacity={0.7} />
      <path d="M105 80 Q115 45 130 80" {...FILL_STYLE} opacity={0.6} />
      <path d="M130 80 Q140 55 150 80" {...FILL_STYLE} opacity={0.5} />
      <path d="M95 80 Q100 65 105 80" {...FILL_STYLE} opacity={0.4} />
      <line x1="100" y1="45" x2="100" y2="40" {...FILL_STYLE} opacity={0.4} />
      <circle cx="100" cy="38" r="3" {...FILL_STYLE} opacity={0.3} />
    </Wrapper>
  );
}

function World() {
  return (
    <Wrapper>
      <circle cx="100" cy="55" r="35" {...LINE_STYLE} opacity={0.6} />
      <ellipse cx="100" cy="55" rx="35" ry="12" {...LINE_STYLE} opacity={0.4} />
      <line x1="65" y1="55" x2="135" y2="55" {...FILL_STYLE} opacity={0.4} />
      <path d="M75 28 Q85 55 75 82" {...FILL_STYLE} opacity={0.3} />
      <path d="M125 28 Q115 55 125 82" {...FILL_STYLE} opacity={0.3} />
      <ellipse cx="100" cy="43" rx="12" ry="6" {...LINE_STYLE} opacity={0.2} />
      <ellipse cx="100" cy="67" rx="12" ry="6" {...LINE_STYLE} opacity={0.2} />
      <circle cx="100" cy="55" r="4" {...FILL_STYLE} opacity={0.3} />
    </Wrapper>
  );
}

function India() {
  return (
    <Wrapper>
      <path d="M70 25 Q60 30 55 40 Q50 48 55 55 Q58 62 52 68 Q48 74 55 78 Q65 84 75 82 Q85 86 95 82 Q108 80 115 76 Q125 70 130 62 Q135 55 132 46 Q128 38 120 32 Q110 26 100 25 Q85 22 70 25Z" {...FILL_STYLE} opacity={0.7} />
      <path d="M95 82 Q100 75 102 68 L100 55" {...FILL_STYLE} opacity={0.3} />
      <path d="M80 55 Q90 50 100 55 Q110 50 120 55" {...FILL_STYLE} opacity={0.2} />
      <circle cx="85" cy="60" r="2" {...FILL_STYLE} opacity={0.3} />
      <circle cx="115" cy="62" r="1.5" {...FILL_STYLE} opacity={0.3} />
      <circle cx="95" cy="50" r="1.5" {...FILL_STYLE} opacity={0.3} />
    </Wrapper>
  );
}

function TamilNadu() {
  return (
    <Wrapper>
      <polygon points="100,10 65,50 70,55 60,65 65,70 55,80 65,90 80,95 100,100 120,95 135,90 145,80 135,70 140,65 130,55 135,50" {...FILL_STYLE} opacity={0.7} />
      <path d="M85 60 Q100 55 115 60" {...FILL_STYLE} opacity={0.3} />
      <path d="M80 70 Q100 65 120 70" {...FILL_STYLE} opacity={0.3} />
      <path d="M90 80 Q100 77 110 80" {...FILL_STYLE} opacity={0.3} />
      <circle cx="100" cy="55" r="3" {...FILL_STYLE} opacity={0.4} />
    </Wrapper>
  );
}

function DefaultIllustration() {
  return (
    <Wrapper>
      <circle cx="100" cy="55" r="30" {...LINE_STYLE} opacity={0.4} />
      <circle cx="100" cy="55" r="20" {...LINE_STYLE} opacity={0.3} />
      <circle cx="100" cy="55" r="10" {...LINE_STYLE} opacity={0.4} />
      <circle cx="100" cy="55" r="3" {...FILL_STYLE} opacity={0.4} />
      <line x1="100" y1="25" x2="100" y2="85" {...FILL_STYLE} opacity={0.2} />
      <line x1="70" y1="55" x2="130" y2="55" {...FILL_STYLE} opacity={0.2} />
    </Wrapper>
  );
}

const ILLUSTRATIONS: Record<string, React.FC> = {
  "Technology": Technology,
  "Politics": Politics,
  "Business": Business,
  "Sports": Sports,
  "Education": Education,
  "Health": Health,
  "Spiritual": Spiritual,
  "Agriculture": Agriculture,
  "World": World,
  "India": India,
  "Tamil Nadu": TamilNadu,
};

export function getCategoryIllustration(category: string): React.FC {
  return ILLUSTRATIONS[category] || DefaultIllustration;
}

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  "Tamil Nadu": ["#071A2E", "#0F172A"],
  "India": ["#0F172A", "#1B2838"],
  "World": ["#0B1F3A", "#071A2E"],
  "Politics": ["#111827", "#1F2937"],
  "Business": ["#0F172A", "#1E3A5F"],
  "Sports": ["#071A2E", "#0F2937"],
  "Technology": ["#0F172A", "#102A43"],
  "Education": ["#071A2E", "#1B2838"],
  "Health": ["#0F172A", "#1E293B"],
  "Spiritual": ["#0B1F3A", "#1A1A2E"],
  "Agriculture": ["#071A2E", "#0F2937"],
};

const defaultGradient: [string, string] = ["#071A2E", "#0F172A"];

export function getCategoryGradient(category: string): [string, string] {
  return CATEGORY_GRADIENTS[category] || defaultGradient;
}
