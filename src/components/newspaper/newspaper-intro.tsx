"use client";
import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Volume2, Heart, TrendingUp, Star, ThumbsUp, Newspaper } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useAudioStore } from "@/store/audio-store";
import { useUserStore } from "@/store/user-store";
import { getCurrentEdition } from "@/lib/editions";
import { newsData } from "@/lib/news";
import DeskEnvironment, { SunMoon, DeskCalendar } from "@/components/newspaper/desk-items";
import { SceneMotion } from "@/components/news-image-section";
import { resolveNewsAnimationScene } from "@/lib/news-animation";
import { getCategoryFallbackImageUrl } from "@/lib/category-images";
import type { NewsItem, ReactionType } from "@/types";

const CLOSE_DURATION = 1400;
const OPEN_DURATION = 2000;

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s\u0B80-\u0BFF]/g, " ").replace(/\s+/g, " ").trim();
}

function textHas(text: string, terms: string[]): boolean {
  return terms.some((t) => {
    const n = normalizeText(t);
    if (!n) return false;
    if (/^[a-z0-9 ]+$/.test(n)) {
      return new RegExp(`(^|\\s)${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s)`).test(text);
    }
    return text.includes(n);
  });
}

const POLITICAL_TERMS = ["assembly", "legislative", "minister", "chief minister", "MLA", "MLC", "சட்டப்பேரவை", "சட்டசபை", "அமைச்சர்", "முதலமைச்சர்", "அரசியல்", "தேர்தல்", "election", "vote", "party", "கட்சி", "ஆளுநர்", "governor"];
const GOVERNMENT_TERMS = ["government", "scheme", "policy", "budget", "tender", "பட்ஜெட்", "திட்டம்", "ஒப்பந்தம்", "அரசு அறிவிப்பு", "அரசு திட்டம்", "ரூபாய்", "crore", "crores", "lakh", "lakhs", "மானியம்", "subsidy", "welfare"];
const CRIME_TERMS = ["crime", "arrest", "murder", "theft", "court", "police", "FIR", "குற்றம்", "கைது", "கொலை", "திருட்டு", "நீதிமன்ற", "வழக்கு", "காவல் நிலையம்", "சிறை", "jail", "prison", "fraud", "scam", "cheating", "cyber", "மோசடி", "சைபர்"];
const ACCIDENT_TERMS = ["accident", "crash", "collision", "fire", "explosion", "gas leak", "ammonia", "factory accident", "injured", "hospitalized", "விபத்து", "மோதல்", "தீ விபத்து", "வெடிப்பு", "வாயு கசிவு", "காயம்", "மருத்துவமனை"];
const TRANSPORT_TERMS = ["train", "metro", "bus", "railway", "airport", "road", "traffic", "transport", "flight", "போக்குவரத்து", "ரயில்", "மெட்ரோ", "பேருந்து", "விமானம்", "சாலை", "விமான நிலையம்", "track", "platform", "சுங்கச்சாவடி"];
const SPORTS_TERMS = ["cricket", "football", "kabaddi", "match", "tournament", "player", "score", " Stadium", "IPL", "விளையாட்டு", "கிரிக்கெட்", "கபடி", "போட்டி", "வீரர்", "சாம்பியன்", "Olympic", "Olympics", "தகரம்"];
const EDUCATION_TERMS = ["school", "college", "university", "exam", "student", "teacher", "results", "admission", "graduation", "கல்வி", "பள்ளி", "கல்லூரி", "பல்கலைக்கழகம்", "தேர்வு", "மாணவர்", "ஆசிரியர்", "மதிப்பெண்", "தரவரிசை"];
const TECHNOLOGY_TERMS = ["technology", "tech", "AI", "robot", "startup", "software", "digital", "cyber", "app", "இணைய", "தொழில்நுட்பம்", "செயற்கை", "அறிவியல்", "டிஜிட்டல்", "ஸ்டார்ட்அப்", "மென்பொருள்", "ஹேக்", "hack"];
const BUSINESS_TERMS = ["business", "market", "economy", "stock", "share", "investment", "trade", "GST", "price", "gold", "oil", "petrol", "diesel", "inflation", "வணிகம்", "சந்தை", "முதலீடு", "தொழில்", "விலை", "தங்கம்", "பங்கு", "சரக்கு", "ஏற்றுமதி"];
const WEATHER_TERMS = ["rain", "heavy rain", "storm", "cyclone", "flood", "weather", "cloud", "thunderstorm", "heat wave", "மழை", "வானிலை", "புயல்", "வெள்ளம்", "மேகம்", "இடி மின்னல்", "வெப்ப அலை", "சூறாவளி"];
const AGRICULTURE_TERMS = ["farm", "crop", "harvest", "paddy", "rice", "agriculture", "farmer", "irrigation", "field", "வேளாண்மை", "விவசாயி", "விவசாயம்", "நெல்", "பயிர்", "அறுவடை", "குளிர்சாதனம்"];

interface VideoRule {
  video: string;
  terms: string[];
}

const CONTENT_VIDEO_RULES: VideoRule[] = [
  { video: "/generated-videos/politics/assembly.mp4", terms: POLITICAL_TERMS },
  { video: "/generated-videos/politics/assembly.mp4", terms: GOVERNMENT_TERMS },
  { video: "/generated-videos/crime/police-chase.mp4", terms: ["chase", "pursuit", "துரத்தல்", "விரட்ட"] },
  { video: "/generated-videos/crime/crime.mp4", terms: CRIME_TERMS },
  { video: "/generated-videos/accident/accident.mp4", terms: ACCIDENT_TERMS },
  { video: "/generated-videos/transport/transport.mp4", terms: TRANSPORT_TERMS },
  { video: "/generated-videos/sports/sports.mp4", terms: SPORTS_TERMS },
  { video: "/generated-videos/education/education.mp4", terms: EDUCATION_TERMS },
  { video: "/generated-videos/technology/technology.mp4", terms: TECHNOLOGY_TERMS },
  { video: "/generated-videos/business/business.mp4", terms: BUSINESS_TERMS },
  { video: "/generated-videos/weather/weather.mp4", terms: WEATHER_TERMS },
  { video: "/generated-videos/district/district-news.mp4", terms: AGRICULTURE_TERMS },
];

function resolveContentVideo(headline: string, summary: string, category: string): string {
  const haystack = normalizeText(`${headline} ${summary} ${category}`);
  for (const rule of CONTENT_VIDEO_RULES) {
    if (textHas(haystack, rule.terms)) return rule.video;
  }
  return "/generated-videos/district/district-news.mp4";
}

const NewspaperThumbnail = memo(function NewspaperThumbnail({
  article,
  isActive,
  aspectRatio = "16/9",
  showCategoryLabel = false,
  editionAccent,
}: {
  article: NewsItem;
  isActive: boolean;
  aspectRatio?: string;
  showCategoryLabel?: boolean;
  editionAccent?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sceneKey = resolveNewsAnimationScene({
    category: article.category,
    headline: article.headline,
    summary: article.tamilSummary || article.englishSummary,
    source: article.source,
  });
  const videoUrl = article.aiVideoUrl || resolveContentVideo(article.headline, article.tamilSummary || article.englishSummary, article.category);
  const posterUrl = article.aiImageUrl || article.imageUrl || getCategoryFallbackImageUrl(article.category);
  const webmUrl = videoUrl.replace(/\.mp4($|\?)/, ".webm$1");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (canPlay && isActive) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [canPlay, isActive]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-sm"
      style={{ aspectRatio, background: "#0F172A" }}
    >
      {posterUrl && !imgError && !canPlay && (
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${canPlay ? "opacity-0" : "opacity-100"}`}
          onError={() => setImgError(true)}
        />
      )}
      {!posterUrl || imgError ? (
        <SceneMotion sceneKey={sceneKey} isCurrentlyPlaying={isActive} />
      ) : null}
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        preload="metadata"
        aria-hidden="true"
        onCanPlay={() => setCanPlay(true)}
        onLoadedData={() => setCanPlay(true)}
        onError={() => setCanPlay(false)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${canPlay ? "opacity-100" : "opacity-0"}`}
      >
        {webmUrl !== videoUrl ? <source src={webmUrl} type="video/webm" /> : null}
        <source src={videoUrl} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      {showCategoryLabel && editionAccent && (
        <span
          className="absolute bottom-2 left-3 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-sm z-10"
          style={{ background: `${editionAccent}cc` }}
        >
          {article.category}
        </span>
      )}
    </div>
  );
});

const reactionIcons: Record<ReactionType, React.ReactNode> = {
  love: <Heart size={11} />,
  trending: <TrendingUp size={11} />,
  celebrate: <Star size={11} />,
  helpful: <ThumbsUp size={11} />,
};

const reactionLabels: Record<ReactionType, string> = {
  love: "Love",
  trending: "Trending",
  celebrate: "Celebrate",
  helpful: "Helpful",
};

const reactionColors: Record<ReactionType, string> = {
  love: "#e11d48",
  trending: "#0f766e",
  celebrate: "#d97706",
  helpful: "#64748b",
};

const pageTurnVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 400 : -400,
    opacity: 0,
    rotateY: dir > 0 ? -20 : 20,
  }),
  center: { x: 0, opacity: 1, rotateY: 0 },
  exit: (dir: number) => ({
    x: dir > 0 ? -400 : 400,
    opacity: 0,
    rotateY: dir > 0 ? 20 : -20,
  }),
};

function PaperTexture() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: [
            `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px)`,
            `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 3px)`,
          ].join(", "),
        }}
      />
    </div>
  );
}

const PageCard = memo(function PageCard({ article, isActive, edition, handlePlay, handleReaction }: {
  article: NewsItem;
  isActive: boolean;
  edition: ReturnType<typeof getCurrentEdition>;
  handlePlay: (item: NewsItem) => void;
  handleReaction: (articleId: string, reaction: ReactionType) => void;
}) {
  const articleReactions = useAppStore(s => s.articleReactions);
  const getUserReaction = useAppStore(s => s.getUserReaction);
  const username = useUserStore(s => s.currentUser?.username || "anonymous");

  const counts = articleReactions[article.id] || {};
  const totalReactions = Object.keys(counts).length;
  const activeReaction = getUserReaction(article.id, username);

  return (
    <div
      className="relative overflow-hidden rounded-[1px] flex flex-col"
      style={{
        flex: 1, height: "72vh", maxHeight: "860px",
        background: "#ffffff",
        transition: "box-shadow 0.35s ease, border-color 0.35s ease",
        boxShadow: isActive
          ? `0 0 0 1px rgba(230,170,60,0.3), 0 0 20px rgba(230,170,60,0.15), 0 4px 24px rgba(0,0,0,0.08)`
          : "0 4px 20px rgba(0,0,0,0.06)",
        borderLeft: isActive ? "3px solid rgba(230,170,60,0.8)" : "3px solid transparent",
        willChange: "transform",
        transform: "translateZ(0)",
        contain: "layout style paint",
      }}
    >
      <PaperTexture />
      <div className="absolute inset-0 flex flex-col p-4" style={{ zIndex: 1, fontFamily: "'Noto Sans Tamil', Georgia, serif" }}>
        <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
          <span className="px-1.5 py-0.5 text-[7px] font-semibold text-white rounded-sm" style={{ background: edition.accent }}>
            {article.category}
          </span>
          {isActive && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm animate-fade-in"
              style={{ background: `${edition.accent}15`, animation: "fadeIn 0.3s ease-out" }}
            >
              <div className="flex items-end gap-[1.5px]" style={{ height: "12px" }}>
                {[1,2,3].map(i => (
                  <div key={i}
                    className="w-[2px] rounded-full equalizer-bar"
                    style={{
                      height: "12px",
                      background: edition.accent,
                      transformOrigin: "bottom",
                      animation: `equalizer 0.7s ease-in-out ${i * 0.12}s infinite`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[6px] font-bold tracking-[0.3px]" style={{ color: edition.accent }}>▶ NOW PLAYING</span>
            </div>
          )}
        </div>

        <h3 className="text-[11px] font-bold leading-snug mb-2 line-clamp-2 flex-shrink-0" style={{ color: "#1a1a1a" }}>
          {article.headline}
        </h3>

        <div className="relative w-full mb-2 overflow-hidden rounded-sm flex-shrink-0">
          <NewspaperThumbnail article={article} isActive={isActive} />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
          <p className="text-[8px] leading-relaxed" style={{ color: "#555" }}>
            {article.tamilSummary || article.englishSummary}
          </p>
        </div>

        <div className="pt-1.5 pb-0.5 flex-shrink-0" style={{ borderTop: "1px solid #e8e8e8" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-medium" style={{ color: "#888" }}>{article.source}</span>
              <span className="text-[6px]" style={{ color: "#aaa" }}>{article.publishedAt}</span>
            </div>
            {!isActive && (
              <button onClick={() => handlePlay(article)}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[7px] font-semibold text-white rounded-sm cursor-pointer"
                style={{ background: edition.accent }}>
                <Volume2 size={8} /> கேள்
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              {(Object.keys(reactionIcons) as ReactionType[]).map(r => (
                <button key={r} onClick={() => handleReaction(article.id, r)}
                  className="flex items-center gap-1 px-1 py-0.5 rounded-sm transition-colors cursor-pointer"
                  style={{
                    color: activeReaction === r ? reactionColors[r] : "#aaa",
                    background: activeReaction === r ? `${reactionColors[r]}10` : "transparent",
                  }}
                  title={reactionLabels[r]}
                >
                  {reactionIcons[r]}
                </button>
              ))}
              {totalReactions > 0 && (
                <span className="text-[7px] font-medium ml-0.5" style={{ color: "#999" }}>{totalReactions}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const NewspaperSpread = memo(function NewspaperSpread({
  spreadIndex, turnDir, leftArticle, rightArticle,
  isLeftActive, isRightActive, edition,
  handlePlay, handleReactionFn,
}: {
  spreadIndex: number;
  turnDir: 1 | -1;
  leftArticle: NewsItem | undefined;
  rightArticle: NewsItem | null;
  isLeftActive: boolean;
  isRightActive: boolean;
  edition: ReturnType<typeof getCurrentEdition>;
  handlePlay: (item: NewsItem) => void;
  handleReactionFn: (articleId: string, reaction: ReactionType) => void;
}) {
  if (!leftArticle) return null;

  return (
    <AnimatePresence mode="wait" custom={turnDir}>
      <motion.div
        key={spreadIndex}
        custom={turnDir}
        variants={pageTurnVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-center gap-0"
        style={{ width: "88vw", maxWidth: "1100px", perspective: "2000px" }}
      >
        <div className="flex-1 min-w-0 max-w-[50%]">
          <PageCard
            article={leftArticle}
            isActive={isLeftActive}
            edition={edition}
            handlePlay={handlePlay}
            handleReaction={handleReactionFn}
          />
        </div>

        <div className="shrink-0 relative" style={{ width: "10px", zIndex: 10 }}>
          <div className="absolute inset-0" style={{
            background: "linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0.02) 25%, rgba(0,0,0,0.01) 50%, rgba(0,0,0,0.02) 75%, rgba(0,0,0,0.08))",
          }} />
        </div>

        <div className="flex-1 min-w-0 max-w-[50%]">
          {rightArticle ? (
            <PageCard
              article={rightArticle}
              isActive={isRightActive}
              edition={edition}
              handlePlay={handlePlay}
              handleReaction={handleReactionFn}
            />
          ) : (
            <div className="relative overflow-hidden rounded-[1px] flex items-center justify-center"
              style={{ flex: 1, height: "72vh", maxHeight: "860px", background: "#f5f5f0" }}
            >
              <PaperTexture />
              <span className="text-[9px] font-medium tracking-wider" style={{ color: "#ccc" }}>— End of Edition —</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

function CoverPageComponent({ edition, today, newsData, handleOpen }: {
  edition: ReturnType<typeof getCurrentEdition>;
  today: string;
  newsData: NewsItem[];
  handleOpen: () => void;
}) {
  return (
    <div className="relative w-[520px] h-[700px] rounded-[1px] overflow-hidden"
      style={{ background: "#ffffff", boxShadow: "0 20px 100px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.2)" }}>
      <PaperTexture />
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <div className="text-center pt-10 pb-3 px-10">
          <p className="text-[8px] tracking-[4px] uppercase font-medium" style={{ color: edition.accent }}>{edition.labelTa}</p>
          <h1 className="text-5xl font-black tracking-tight mt-1" style={{ color: "#1a1a1a", fontFamily: "Georgia, serif", letterSpacing: "-1px" }}>Kural</h1>
          <p className="text-[10px] italic mt-0.5 tracking-[2px] uppercase" style={{ color: "#888" }}>AI-Powered Tamil Voice News</p>
          <div className="h-[1.5px] w-16 mx-auto mt-2" style={{ background: edition.accent }} />
          <p className="text-[7px] mt-1 tracking-[1px]" style={{ color: "#bbb" }}>{today}</p>
        </div>
        <div className="mx-7 mb-3">
          <div className="relative w-full overflow-hidden">
            <NewspaperThumbnail article={newsData[0]} isActive={false} aspectRatio="21/9" showCategoryLabel editionAccent={edition.accent} />
          </div>
          <h2 className="text-sm font-bold mt-2 leading-snug line-clamp-2" style={{ color: "#1a1a1a" }}>{newsData[0].headline}</h2>
          <p className="text-[9px] mt-1 leading-relaxed line-clamp-2" style={{ color: "#555" }}>{newsData[0].summary}</p>
        </div>
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center">
          <motion.button onClick={handleOpen}
            className="relative flex items-center gap-3 px-7 py-3.5 cursor-pointer"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={edition.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" />
              <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-[13px] font-bold text-white tracking-wide">செய்தித்தாளை திறக்க</span>
              <span className="text-[9px] text-white/40 tracking-[1.5px] uppercase font-medium">Open Newspaper</span>
            </div>
          </motion.button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-center h-7 px-4" style={{ background: "var(--color-breaking)" }}>
          <span className="flex items-center gap-1.5 text-white text-[9px] font-bold uppercase tracking-[1px]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot" /> Breaking News
          </span>
          <span className="ml-3 text-white/80 text-[8px] truncate">{newsData[0].headline}</span>
        </div>
      </div>
    </div>
  );
}

function FoldedNewspaperComponent({ edition, today, newsData, handleFoldedClick, zoomComplete }: {
  edition: ReturnType<typeof getCurrentEdition>;
  today: string;
  newsData: NewsItem[];
  handleFoldedClick: () => void;
  zoomComplete: boolean;
}) {
  return (
    <motion.div className="relative cursor-pointer"
      style={{ perspective: "800px", transformStyle: "preserve-3d" }}
      onClick={handleFoldedClick}>
      <div className="relative"
        style={{ width: "280px", height: "380px", transform: "perspective(800px) rotateX(16deg)", transformStyle: "preserve-3d" }}>
        <div className="absolute inset-0 rounded-sm overflow-hidden"
          style={{ background: "#ffffff", boxShadow: "0 12px 50px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)" }}>
          <PaperTexture />
          <div className="absolute inset-0 z-1 flex flex-col">
            <div className="flex-1 px-5 pt-5 pb-3 flex flex-col">
              <div className="text-center">
                <p className="text-[6px] tracking-[3px] uppercase font-medium" style={{ color: edition.accent }}>{edition.labelTa}</p>
                <h2 className="text-xl font-black tracking-tight mt-0.5" style={{ color: "#1a1a1a", fontFamily: "Georgia, serif" }}>Kural</h2>
                <p className="text-[6px] italic mt-0.5 tracking-[1px] uppercase" style={{ color: "#888" }}>AI-Powered Tamil Voice News</p>
                <p className="text-[5px] mt-0.5" style={{ color: "#aaa" }}>{today}</p>
              </div>
            </div>
            <div className="h-[1px] mx-5" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), rgba(0,0,0,0.12), rgba(0,0,0,0.08), transparent)" }} />
            <div className="flex-1 px-5 pt-3 pb-5">
              <div className="w-full overflow-hidden rounded-sm">
                <NewspaperThumbnail article={newsData[0]} isActive={false} />
              </div>
              <p className="text-[9px] font-bold mt-1.5 leading-snug line-clamp-2" style={{ color: "#1a1a1a" }}>
                {newsData[0].headline}
              </p>
              <p className="text-[7px] mt-0.5" style={{ color: "#666" }}>{newsData[0].summary?.slice(0, 60)}...</p>
            </div>
            <div className="absolute left-4 right-4 top-1/2 h-[1px] pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), rgba(0,0,0,0.1), rgba(0,0,0,0.06), transparent)" }} />
          </div>
        </div>
      </div>
      {zoomComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 12.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 0 1 2 2v4.5A5.5 5.5 0 0 1 14.5 20H12a6 6 0 0 1-6-6v-1.5" />
              <path d="M12 12V8" />
            </svg>
          </motion.div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleFoldedClick();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wide shadow-lg cursor-pointer"
            style={{ background: edition.accent, color: "#fff", boxShadow: `0 12px 34px ${edition.accent}40` }}
          >
            <Newspaper size={14} />
            Open Newspaper
          </button>
          <span className="text-[9px] font-medium tracking-[1.8px] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>Tap paper or press open</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function NewspaperView() {
  const newspaperView = useAppStore(s => s.newspaperView);
  const setNewspaperView = useAppStore(s => s.setNewspaperView);
  const isNewspaperAudioMode = useAppStore(s => s.isNewspaperAudioMode);
  const setNewspaperAudioMode = useAppStore(s => s.setNewspaperAudioMode);
  const playNews = useAppStore(s => s.playNews);
  const engineCurrentIndex = useAudioStore(s => s.currentIndex);
  const audioTrack = useAudioStore(s => s.currentTrack);
  const audioIsPlaying = useAudioStore(s => s.isPlaying);
  const audioIsLoading = useAudioStore(s => s.isLoading);
  const audioError = useAudioStore(s => s.error);
  const nextNews = useAudioStore(s => s.next);
  const prevNews = useAudioStore(s => s.prev);
  const pauseNews = useAudioStore(s => s.pause);
  const resumeNews = useAudioStore(s => s.play);
  const stopNews = useAudioStore(s => s.reset);
  const setReaction = useAppStore(s => s.setReaction);
  const removeReaction = useAppStore(s => s.removeReaction);
  const getUserReaction = useAppStore(s => s.getUserReaction);
  const setActiveNav = useAppStore(s => s.setActiveNav);

  const currentUser = useUserStore(s => s.currentUser);
  const edition = getCurrentEdition();
  const engineState = audioIsLoading ? "loading" : audioError ? "error" : audioIsPlaying ? "playing" : audioTrack ? "paused" : "idle";

  const [cinematicPhase, setCinematicPhase] = useState<"folded" | "cover">("folded");
  const [zoomComplete, setZoomComplete] = useState(false);
  const initialMount = useRef(true);
  const [isTurning, setIsTurning] = useState(false);
  const [turnDir, setTurnDir] = useState<1 | -1>(1);
  const [manualSpreadIndex, setManualSpreadIndex] = useState(0);

  const isClosed = newspaperView === "closed";
  const isOpening = newspaperView === "opening";
  const isOpen = newspaperView === "open";
  const isClosing = newspaperView === "closing";

  const totalSpreads = Math.ceil(newsData.length / 2);
  const spreadIndex = isNewspaperAudioMode
    ? Math.min(Math.floor(engineCurrentIndex / 2), totalSpreads - 1)
    : Math.min(manualSpreadIndex, totalSpreads - 1);

  const leftArticle = useMemo(() => newsData[spreadIndex * 2], [spreadIndex]);
  const rightArticle = useMemo(() => spreadIndex * 2 + 1 < newsData.length ? newsData[spreadIndex * 2 + 1] : null, [spreadIndex]);
  const username = currentUser?.username || "anonymous";

  const isLeftActive = isNewspaperAudioMode && engineCurrentIndex === spreadIndex * 2;
  const isRightActive = isNewspaperAudioMode && rightArticle !== null && engineCurrentIndex === spreadIndex * 2 + 1;

  const leftArticleNum = spreadIndex * 2 + 1;
  const rightArticleNum = Math.min(spreadIndex * 2 + 2, newsData.length);

  useEffect(() => {
    if (newspaperView === "closed") {
      if (initialMount.current) { initialMount.current = false; return; }
      setCinematicPhase("folded");
      setZoomComplete(true);
    }
  }, [newspaperView]);

  useEffect(() => {
    if (isClosing || isClosed) {
      if (isNewspaperAudioMode) {
        stopNews();
        setNewspaperAudioMode(false);
      }
    }
  }, [isClosing, isClosed, isNewspaperAudioMode, setNewspaperAudioMode, stopNews]);

  useEffect(() => {
    if (isNewspaperAudioMode && (engineState === "idle" || engineState === "error")) {
      setNewspaperAudioMode(false);
    }
  }, [engineState, isNewspaperAudioMode, setNewspaperAudioMode]);

  const handleFoldedClick = useCallback(() => {
    if (!zoomComplete) return;
    setCinematicPhase("cover");
  }, [zoomComplete]);

  const handleOpen = useCallback(() => {
    if (newspaperView === "closed" || newspaperView === "closing") {
      setNewspaperView("opening");
      setTimeout(() => setNewspaperView("open"), OPEN_DURATION);
    }
  }, [newspaperView, setNewspaperView]);

  const handleClose = useCallback(() => {
    if (newspaperView !== "open") return;
    stopNews();
    setNewspaperAudioMode(false);
    setNewspaperView("closing");
    setTimeout(() => setNewspaperView("closed"), CLOSE_DURATION);
  }, [newspaperView, setNewspaperView, stopNews, setNewspaperAudioMode]);

  const turnPage = useCallback((dir: 1 | -1) => {
    if (isTurning || newspaperView !== "open") return;
    setIsTurning(true);
    setTurnDir(dir);
    if (isNewspaperAudioMode) {
      if (dir === 1 && engineCurrentIndex < newsData.length - 1) nextNews();
      else if (dir === -1 && engineCurrentIndex > 0) prevNews();
    } else {
      const next = manualSpreadIndex + dir;
      if (next >= 0 && next < totalSpreads) {
        setManualSpreadIndex(next);
      }
    }
    setTimeout(() => setIsTurning(false), 600);
  }, [isTurning, newspaperView, isNewspaperAudioMode, engineCurrentIndex, nextNews, prevNews, manualSpreadIndex, totalSpreads]);

  const today = new Date().toLocaleDateString("ta-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const handlePlay = useCallback((item: NewsItem) => {
    playNews({
      id: item.id, headline: item.headline, englishHeadline: item.englishHeadline, imageUrl: item.imageUrl,
      tamilSummary: item.tamilSummary, englishSummary: item.englishSummary,
      content: item.content,
      source: item.source, category: item.category, publishedAt: item.publishedAt,
    }, newsData.indexOf(item), newsData.map(n => ({
      id: n.id, headline: n.headline, englishHeadline: n.englishHeadline, imageUrl: n.imageUrl,
      tamilSummary: n.tamilSummary, englishSummary: n.englishSummary,
      content: n.content,
      source: n.source, category: n.category, publishedAt: n.publishedAt,
    })));
    setNewspaperAudioMode(true);
  }, [playNews, setNewspaperAudioMode]);

  const handleReactionFn = useCallback((articleId: string, reaction: ReactionType) => {
    const active = getUserReaction(articleId, username);
    if (active === reaction) removeReaction(articleId);
    else setReaction(articleId, reaction);
  }, [getUserReaction, username, removeReaction, setReaction]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (newspaperView !== "open") return;
      if (e.key === "ArrowRight") { e.preventDefault(); turnPage(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); turnPage(-1); }
      else if (e.key === " ") {
        e.preventDefault();
        if (!isNewspaperAudioMode) return;
        if (engineState === "playing") pauseNews();
        else if (engineState === "paused") resumeNews();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [newspaperView, turnPage, engineState, pauseNews, resumeNews, isNewspaperAudioMode]);

  const canPrev = isNewspaperAudioMode ? engineCurrentIndex > 0 : manualSpreadIndex > 0;
  const canNext = isNewspaperAudioMode ? engineCurrentIndex < newsData.length - 1 : manualSpreadIndex < totalSpreads - 1;

  const newspaperBg = {
    background: `
      radial-gradient(ellipse at 50% 0%, ${edition.accent}08 0%, transparent 60%),
      #f5f5f0
    `,
  };

  const deskBg = {
    background: `
      radial-gradient(ellipse at 50% 0%, rgba(100,65,40,0.3) 0%, transparent 60%),
      linear-gradient(180deg, #2c1810 0%, #3d2317 25%, #4a2c1a 50%, #3d2317 75%, #1a0f0a 100%)
    `,
  };

  const isReadingMode = isOpen || isOpening || isClosing;
  const showDesk = isReadingMode || (isClosed && cinematicPhase === "folded");

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-hidden" style={showDesk ? deskBg : newspaperBg}>
      <div className="z-1">
        {showDesk && (
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              repeating-linear-gradient(87deg, transparent 0px, transparent 25px, rgba(0,0,0,0.02) 25px, rgba(0,0,0,0.02) 26px),
              repeating-linear-gradient(93deg, transparent 0px, transparent 45px, rgba(255,255,255,0.008) 45px, rgba(255,255,255,0.008) 46px)
            `,
          }} />
        )}
        {showDesk && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background: (() => {
                const h = new Date().getHours();
                if (h >= 6 && h <= 11) return "radial-gradient(ellipse at 15% 5%, rgba(255,215,140,0.15) 0%, rgba(255,215,140,0.06) 20%, transparent 50%)";
                if (h >= 12 && h <= 16) return "radial-gradient(ellipse at 50% 0%, rgba(255,235,200,0.1) 0%, rgba(255,235,200,0.04) 30%, transparent 60%)";
                if (h >= 17 && h <= 18) return "radial-gradient(ellipse at 20% 8%, rgba(255,150,80,0.18) 0%, rgba(255,120,60,0.08) 20%, transparent 50%)";
                return "radial-gradient(ellipse at 85% 5%, rgba(150,180,255,0.1) 0%, rgba(100,140,255,0.04) 20%, transparent 50%)";
              })()
            }}
          />
        )}
        {showDesk && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)" }}
          />
        )}
      </div>

      {isClosed && cinematicPhase === "folded" && (
        <div className="z-10 flex-1 flex flex-col">
          <div className="absolute left-[5%] top-[6%] pointer-events-none select-none">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}>
              <SunMoon />
            </motion.div>
          </div>
          <div className="absolute right-[5%] top-[6%] pointer-events-none select-none">
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}>
              <DeskCalendar />
            </motion.div>
          </div>
          <div className="flex-1 flex items-center justify-center relative z-[6]">
            <AnimatePresence mode="wait">
              <motion.div key="folded-scene"
                exit={{ y: -80, scale: 1.1, opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
                className="flex flex-col items-center">
                <motion.div
                  initial={{ y: 250, opacity: 0, rotateX: 30, scale: 0.85 }}
                  animate={{
                    y: [250, 0, -8, -3, 0], opacity: [0, 1, 1, 1, 1],
                    rotateX: [30, 18, 15, 16, 16], scale: [0.85, 1.02, 0.99, 1.005, 1],
                  }}
                  transition={{ duration: 1.4, times: [0, 0.6, 0.75, 0.88, 1], ease: [0.12, 0.75, 0.25, 1] }}
                  onAnimationComplete={() => setZoomComplete(true)}
                  className="relative">
                  <motion.div
                    className="absolute -bottom-5 left-[-10%] right-[-10%] h-8 rounded-full z-[-1]"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
                    style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.12) 50%, transparent 75%)" }}
                  />
                  <motion.div
                    animate={zoomComplete ? { scale: [1, 1.005, 1], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 } } : {}}>
                    <FoldedNewspaperComponent edition={edition} today={today} newsData={newsData} handleFoldedClick={handleFoldedClick} zoomComplete={zoomComplete} />
                  </motion.div>
                </motion.div>
                {zoomComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center gap-1.5 mt-8">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15))" }} />
                      <motion.span
                        className="text-[9px] font-semibold tracking-[3px] uppercase whitespace-nowrap"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                        animate={{ opacity: [0.3, 0.55, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                        Tap to Open Today&apos;s Edition
                      </motion.span>
                      <div className="w-20 h-[1px]" style={{ background: "linear-gradient(270deg, transparent, rgba(255,255,255,0.15))" }} />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.button onClick={() => setActiveNav("home")}
            className="absolute top-5 right-5 z-50 w-9 h-9 rounded-full flex items-center justify-center bg-white/80 border border-border cursor-pointer"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            <X size={12} className="text-foreground-secondary" />
          </motion.button>
        </div>
      )}

      {isClosed && cinematicPhase === "cover" && (
        <div className="z-10 flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}>
            <div className="absolute -bottom-6 left-[-8%] right-[-8%] h-12 rounded-full blur-2xl bg-black/20" />
            <motion.div
              animate={{ rotateX: [0, -2, 0], rotateY: [0, -1, 0], y: [0, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <CoverPageComponent edition={edition} today={today} newsData={newsData} handleOpen={handleOpen} />
            </motion.div>
          </motion.div>
          <motion.button onClick={() => { setCinematicPhase("folded"); setZoomComplete(true); }}
            className="absolute top-5 right-16 z-50 w-9 h-9 rounded-full flex items-center justify-center bg-white/80 border border-border cursor-pointer"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <span className="text-foreground-secondary text-[10px] font-bold leading-none">⟲</span>
          </motion.button>
          <motion.button onClick={() => setActiveNav("home")}
            className="absolute top-5 right-5 z-50 w-9 h-9 rounded-full flex items-center justify-center bg-white/80 border border-border cursor-pointer"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <X size={12} className="text-foreground-secondary" />
          </motion.button>
          <motion.button
            onClick={handleOpen}
            className="absolute bottom-7 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-xl cursor-pointer"
            style={{ background: edition.accent, boxShadow: `0 18px 44px ${edition.accent}45` }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.4, ease: "easeOut" }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <Newspaper size={16} />
            செய்தித்தாளை திறக்க
          </motion.button>
        </div>
      )}

      {(isOpening || isClosing) && (
        <div className="z-10 flex-1 flex items-center justify-center">
          <motion.div className="relative"
            initial={isOpening ? { scale: 0.5, opacity: 0, y: 100, rotateX: 18, rotateY: -6 } : { scale: 1, opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
            animate={isOpening ? { scale: 1, opacity: 1, y: 0, rotateX: 0, rotateY: 0 } : { scale: 0.35, opacity: 0, y: 80, rotateX: 15, rotateY: -5 }}
            transition={{ duration: isOpening ? OPEN_DURATION / 1000 : CLOSE_DURATION / 1000, ease: [0.22, 1, 0.36, 1] }}>
            <motion.div
              className="absolute left-[-10%] right-[-10%] h-16 rounded-full blur-3xl bg-black/20 pointer-events-none"
              animate={isOpening ? { bottom: [-16, -8, -8, -12], opacity: [1, 1.6, 1.4, 1] } : { bottom: [-12, -8, -16], opacity: [1, 1.4, 1.2] }}
              transition={{ duration: isOpening ? OPEN_DURATION / 1000 : CLOSE_DURATION / 1000, ease: [0.22, 1, 0.36, 1], times: isOpening ? [0, 0.25, 0.5, 1] : [0, 0.5, 1] }} />
            <motion.div className="relative"
              animate={isOpening ? { rotateX: [0, -16, -8, -3, 0], rotateY: [0, -10, -5, -2, 0], y: [0, -45, -18, -6, 0] } : { rotateX: [0, 4, 10, 16], rotateY: [0, 4, 8, 10], y: [0, 12, 30, 50] }}
              transition={{ duration: isOpening ? OPEN_DURATION / 1000 : CLOSE_DURATION / 1000, ease: [0.22, 1, 0.36, 1], times: isOpening ? [0, 0.2, 0.45, 0.7, 1] : [0, 0.3, 0.6, 1] }}>
              <div className="relative w-[520px] h-[700px] rounded-[1px] overflow-hidden"
                style={{ background: "#ffffff", boxShadow: "0 20px 100px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.2)" }}>
                <PaperTexture />
                <div className="px-8 pt-8 pb-4 text-center" style={{ zIndex: 1, position: "relative" }}>
                  <p className="text-[8px] tracking-[4px] uppercase font-medium" style={{ color: edition.accent }}>{edition.labelTa}</p>
                  <h1 className="text-5xl font-black tracking-tight mt-1" style={{ color: "#1a1a1a", fontFamily: "Georgia, serif" }}>Kural</h1>
                  <p className="text-[10px] italic mt-0.5 tracking-[2px] uppercase" style={{ color: "#888" }}>AI-Powered Tamil Voice News</p>
                  <div className="h-[1.5px] w-16 mx-auto mt-2" style={{ background: edition.accent }} />
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-white text-[9px] font-semibold rounded-sm" style={{ background: edition.accent }}>
                    {edition.labelTa}
                  </div>
                </div>
              </div>
              {isOpening && (
                <>
                  <motion.div className="absolute top-0 left-0" style={{ width: "260px", height: "100%", transformOrigin: "right center", zIndex: 2 }}
                    initial={{ rotateY: 0 }} animate={{ rotateY: -180, transition: { duration: 1.2, delay: 0.4, ease: [0.12, 0.75, 0.25, 1] } }}>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #ffffff 0%, #f8f8f4 50%, #f5f5ef 100%)" }} />
                    <div className="absolute inset-y-0 right-0 w-[3px]" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.15) 100%)" }} />
                    <div className="absolute inset-y-0 right-0 w-8" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.12) 100%)" }} />
                  </motion.div>
                  <motion.div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-10" style={{ width: "10px", background: "linear-gradient(90deg, rgba(0,0,0,0.15), rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.01) 50%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.15))" }}
                    initial={{ opacity: 0, scaleY: 0.4 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }} />
                  <motion.div className="absolute top-0 right-0" style={{ width: "260px", height: "100%", transformOrigin: "left center", zIndex: 2 }}
                    initial={{ rotateY: 0 }} animate={{ rotateY: 180, transition: { duration: 1.2, delay: 0.4, ease: [0.12, 0.75, 0.25, 1] } }}>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(270deg, #ffffff 0%, #f8f8f4 50%, #f5f5ef 100%)" }} />
                    <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.04), rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.15) 100%)" }} />
                    <div className="absolute inset-y-0 left-0 w-8" style={{ background: "linear-gradient(270deg, transparent, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.12) 100%)" }} />
                  </motion.div>
                </>
              )}
              {isClosing && (
                <>
                  <motion.div className="absolute top-0 left-0 z-2" style={{ width: "260px", height: "100%", transformOrigin: "right center" }}
                    initial={{ rotateY: -180 }} animate={{ rotateY: 0, transition: { duration: 0.6, delay: 0.05, ease: [0.4, 0, 0.6, 1] } }}>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #ffffff 0%, #f5f5ef 100%)" }} />
                  </motion.div>
                  <motion.div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-10" style={{ width: "6px", background: "linear-gradient(90deg, rgba(0,0,0,0.12), rgba(0,0,0,0.03), rgba(0,0,0,0.12))" }}
                    initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3, delay: 0.3 }} />
                  <motion.div className="absolute top-0 right-0 z-2" style={{ width: "260px", height: "100%", transformOrigin: "left center" }}
                    initial={{ rotateY: 180 }} animate={{ rotateY: 0, transition: { duration: 0.6, delay: 0.05, ease: [0.4, 0, 0.6, 1] } }}>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(270deg, #ffffff 0%, #f5f5ef 100%)" }} />
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      )}

      {isOpen && (
        <div className="z-20 flex-1 flex flex-col items-center justify-center px-6 pb-24">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="z-20 relative flex flex-col items-center">
            <NewspaperSpread
              spreadIndex={spreadIndex}
              turnDir={turnDir}
              leftArticle={leftArticle}
              rightArticle={rightArticle}
              isLeftActive={isLeftActive}
              isRightActive={isRightActive}
                edition={edition}
              handlePlay={handlePlay}
              handleReactionFn={handleReactionFn}
            />
          </motion.div>

          <DeskEnvironment isActive={isOpen} />

          <div className="z-30 flex items-center gap-6 mt-5">
            <motion.button onClick={() => turnPage(-1)} disabled={!canPrev || isTurning}
              className="relative flex items-center justify-center rounded-full cursor-pointer disabled:opacity-15 bg-white/80 border border-border"
              style={{ width: "60px", height: "60px" }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
              <motion.div whileHover={{ x: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <ChevronLeft size={22} style={{ color: edition.accent }} />
              </motion.div>
            </motion.button>

            <div className="flex flex-col items-center min-w-[140px]">
              <motion.span key={spreadIndex}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm font-bold tracking-wide" style={{ color: edition.accent }}>
                Spread {spreadIndex + 1} of {totalSpreads}
              </motion.span>
              <span className="text-[8px] font-medium mt-0.5" style={{ color: `${edition.accent}99` }}>
                Articles {leftArticleNum}–{rightArticleNum}
              </span>
              <span className="text-[7px] font-semibold tracking-[1.5px] uppercase mt-1" style={{ color: `${edition.accent}77` }}>
                {edition.labelTa}
              </span>
            </div>

            <motion.button onClick={() => turnPage(1)} disabled={!canNext || isTurning}
              className="relative flex items-center justify-center rounded-full cursor-pointer disabled:opacity-15 bg-white/80 border border-border"
              style={{ width: "60px", height: "60px" }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
              <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <ChevronRight size={22} style={{ color: edition.accent }} />
              </motion.div>
            </motion.button>
          </div>

          <motion.button onClick={handleClose}
            className="fixed top-6 right-6 z-50 w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center cursor-pointer hover:bg-surface-highlight transition-colors shadow-md"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <X size={12} className="text-foreground-secondary" />
          </motion.button>

          <div className="z-10 absolute top-5 left-5 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-white text-[8px] font-semibold rounded-sm" style={{ background: edition.accent }}>
              {edition.labelTa}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
