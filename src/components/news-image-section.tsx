"use client";
import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from "react";
import {
  Play, Newspaper, Landmark, TrainFront, BriefcaseBusiness, Trophy,
  Sprout, CloudRain, GraduationCap, Cpu, ShieldAlert, Building2, Megaphone,
  CarFront, Siren, FlaskConical, TestTubeDiagonal, CloudRainWind,
} from "lucide-react";
import { getCategoryEmoji, getCategoryFallbackImageUrl } from "@/lib/category-images";
import { resolveNewsAnimationScene, type NewsAnimationScene } from "@/lib/news-animation";
import { VIDEO_DURATION_SECONDS } from "@/lib/news-config";

const BAR_HEIGHTS = [0.3, 0.7, 0.2, 0.9, 0.4];

type ThumbIcon = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

interface SceneConfig {
  key: NewsAnimationScene;
  label: string;
  icon: ThumbIcon;
  accent: string;
  secondary: string;
}

const DEFAULT_SCENE: SceneConfig = {
  key: "local",
  label: "Live report",
  icon: Newspaper,
  accent: "#0f766e",
  secondary: "#f59e0b",
};

const SCENES: SceneConfig[] = [
  { key: "accident", label: "Safety response", icon: Siren, accent: "#b91c1c", secondary: "#f59e0b" },
  { key: "politics", label: "Civic update", icon: Landmark, accent: "#0f766e", secondary: "#d97706" },
  { key: "government", label: "Public desk", icon: Building2, accent: "#2563eb", secondary: "#0f766e" },
  { key: "transport", label: "Transit watch", icon: TrainFront, accent: "#0ea5e9", secondary: "#f59e0b" },
  { key: "business", label: "Market pulse", icon: BriefcaseBusiness, accent: "#15803d", secondary: "#ca8a04" },
  { key: "sports", label: "Match pulse", icon: Trophy, accent: "#d97706", secondary: "#16a34a" },
  { key: "agriculture", label: "Field report", icon: Sprout, accent: "#16a34a", secondary: "#a16207" },
  { key: "weather", label: "Weather alert", icon: CloudRain, accent: "#0284c7", secondary: "#14b8a6" },
  { key: "education", label: "Campus news", icon: GraduationCap, accent: "#4f46e5", secondary: "#0891b2" },
  { key: "technology", label: "Tech signal", icon: Cpu, accent: "#7c3aed", secondary: "#06b6d4" },
  { key: "crime", label: "Safety brief", icon: ShieldAlert, accent: "#dc2626", secondary: "#f97316" },
  { key: "breaking", label: "Breaking wire", icon: Megaphone, accent: "#b45309", secondary: "#dc2626" },
];

function MiniAudioEqualizer({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[2px]">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full animate-eq-bar"
          style={{
            height: `${8 + h * 18}px`,
            background: "var(--color-accent)",
            opacity: active ? 0.9 : 0.3,
            animationDelay: `${i * 0.12}s`,
            animationDuration: active ? "0.6s" : "1.4s",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

export function SceneMotion({ sceneKey, isCurrentlyPlaying }: { sceneKey: string; isCurrentlyPlaying: boolean }) {
  if (sceneKey === "politics") {
    return (
      <div className={`kural-scene-motion kural-scene-politics ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <Landmark className="kural-politics-building" size={72} />
        <Megaphone className="kural-politics-megaphone" size={40} />
        <span className="kural-politics-flag" />
        <span className="kural-politics-flag kural-politics-flag-two" />
      </div>
    );
  }

  if (sceneKey === "government") {
    return (
      <div className={`kural-scene-motion kural-scene-government ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <Building2 className="kural-gov-building" size={76} />
        <span className="kural-gov-paper" />
        <span className="kural-gov-paper kural-gov-paper-two" />
        <span className="kural-gov-stamp" />
      </div>
    );
  }

  if (sceneKey === "crime") {
    return (
      <div className={`kural-scene-motion kural-scene-crime ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <div className="kural-road-lines" />
        <CarFront className="kural-police-car kural-police-car-one" size={58} />
        <CarFront className="kural-police-car kural-police-car-two" size={46} />
        <Siren className="kural-siren" size={32} />
      </div>
    );
  }

  if (sceneKey === "accident") {
    return (
      <div className={`kural-scene-motion kural-scene-accident ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <Building2 className="kural-accident-factory" size={76} />
        <Siren className="kural-accident-siren" size={34} />
        <FlaskConical className="kural-accident-flask" size={40} />
        <span className="kural-accident-haze" />
        <span className="kural-accident-barrier" />
      </div>
    );
  }

  if (sceneKey === "business") {
    return (
      <div className={`kural-scene-motion kural-scene-business ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <BriefcaseBusiness className="kural-business-briefcase" size={62} />
        <div className="kural-business-chart">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (sceneKey === "technology") {
    return (
      <div className={`kural-scene-motion kural-scene-tech ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <div className="kural-machine">
          <Cpu className="kural-chip" size={48} />
          <span />
          <span />
          <span />
        </div>
        <FlaskConical className="kural-flask" size={48} />
        <TestTubeDiagonal className="kural-test-tube" size={36} />
      </div>
    );
  }

  if (sceneKey === "weather") {
    return (
      <div className={`kural-scene-motion kural-scene-weather ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <CloudRainWind className="kural-weather-cloud" size={82} />
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="kural-rain-drop" style={{ left: `${8 + i * 6}%`, animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    );
  }

  if (sceneKey === "education") {
    return (
      <div className={`kural-scene-motion kural-scene-education ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <GraduationCap className="kural-education-cap" size={72} />
        <div className="kural-open-book">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (sceneKey === "transport") {
    return (
      <div className={`kural-scene-motion kural-scene-transport ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <div className="kural-track-lines" />
        <TrainFront className="kural-train" size={70} />
      </div>
    );
  }

  if (sceneKey === "sports") {
    return (
      <div className={`kural-scene-motion kural-scene-sports ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <div className="kural-scoreboard">LIVE</div>
        <Trophy className="kural-trophy" size={58} />
        <span className="kural-ball" />
      </div>
    );
  }

  if (sceneKey === "agriculture") {
    return (
      <div className={`kural-scene-motion kural-scene-field ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <Sprout className="kural-sprout" size={70} />
        <div className="kural-field-lines" />
      </div>
    );
  }

  if (sceneKey === "breaking") {
    return (
      <div className={`kural-scene-motion kural-scene-breaking ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
        <Megaphone className="kural-breaking-megaphone" size={76} />
        <span className="kural-breaking-flash" />
        <span className="kural-breaking-flash kural-breaking-flash-two" />
        <div className="kural-broadcast-rings" />
      </div>
    );
  }

  return (
    <div className={`kural-scene-motion kural-scene-default ${isCurrentlyPlaying ? "is-active" : ""}`} aria-hidden="true">
      <div className="kural-broadcast-rings" />
      <Megaphone className="kural-broadcast-icon" size={62} />
    </div>
  );
}

interface NewsImageSectionProps {
  category: string;
  headline?: string;
  summary?: string;
  source?: string;
  aiVideoUrl?: string;
  videoThumbnail?: string;
  imageUrl?: string;
  aiImageUrl?: string;
  videoDuration?: number;
  animationScene?: string;
  isCurrentlyPlaying: boolean;
  onPlay: (e: React.MouseEvent) => void;
  publishedAt: string;
  variant?: "compact" | "animated";
}

export default function NewsImageSection({
  category,
  headline = "",
  summary = "",
  source = "",
  aiVideoUrl = "",
  videoThumbnail = "",
  imageUrl = "",
  aiImageUrl = "",
  videoDuration = VIDEO_DURATION_SECONDS,
  animationScene,
  isCurrentlyPlaying,
  onPlay,
  publishedAt,
  variant = "compact",
}: NewsImageSectionProps) {
  const frameRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoadedVideo, setHasLoadedVideo] = useState(false);
  const [canPlayVideo, setCanPlayVideo] = useState(false);
  const emoji = getCategoryEmoji(category);
  const scene = useMemo(() => {
    const key = resolveNewsAnimationScene({ animationScene, category, headline, summary, source });
    return SCENES.find((item) => item.key === key) || DEFAULT_SCENE;
  }, [animationScene, category, headline, summary, source]);

  const [imageError, setImageError] = useState(false);
  const publishedLabel = useMemo(() => {
    const date = new Date(publishedAt);
    if (Number.isNaN(date.getTime())) return publishedAt;
    return new Intl.DateTimeFormat("ta-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, [publishedAt]);
  const posterUrl = aiVideoUrl ? "" : videoThumbnail || aiImageUrl || imageUrl;
  const webmVideoUrl = aiVideoUrl.replace(/\.mp4($|\?)/, ".webm$1");
  const normalizedVideoDuration = Math.max(1, Math.min(10, videoDuration || VIDEO_DURATION_SECONDS));

  useEffect(() => {
    if (!aiVideoUrl) return;
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      setHasLoadedVideo(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      setIsVisible(visible);
      if (visible) setHasLoadedVideo(true);
    }, { threshold: [0, 0.25, 0.6] });

    observer.observe(node);
    return () => observer.disconnect();
  }, [aiVideoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasLoadedVideo) return;

    video.load();
  }, [aiVideoUrl, hasLoadedVideo, webmVideoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasLoadedVideo) return;

    if (isVisible && canPlayVideo) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [canPlayVideo, hasLoadedVideo, isVisible]);

  if (variant === "compact") {
    return (
      <div className="notranslate flex items-center gap-3 px-4 pt-4 pb-0" translate="no">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: "rgba(0,194,168,0.1)" }}>
            {emoji}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold block leading-tight" style={{ color: "var(--color-accent)" }}>{category}</span>
            <span className="text-[10px] block leading-tight mt-0.5" style={{ color: "var(--color-foreground-secondary)", opacity: 0.6 }}>{publishedLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MiniAudioEqualizer active={isCurrentlyPlaying} />
          <button
            onClick={onPlay}
            aria-label={isCurrentlyPlaying ? "Now playing" : "Listen to this news"}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 ease-out hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            style={{ background: "rgba(0,194,168,0.1)", color: "var(--color-accent)" }}
          >
            <Play size={11} fill="currentColor" color="currentColor" />
            {isCurrentlyPlaying ? "Playing" : "Listen"}
          </button>
        </div>
      </div>
    );
  }

  const style = {
    "--thumb-accent": scene.accent,
    "--thumb-secondary": scene.secondary,
    "--kural-video-clip-duration": "5s",
  } as CSSProperties;

  return (
    <button
      ref={frameRef}
      type="button"
      onClick={onPlay}
      aria-label={isCurrentlyPlaying ? "Now playing" : "Listen to this news"}
      className="relative block aspect-[16/9] w-full overflow-hidden kural-news-thumb kural-news-video-clip cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={style}
    >
      <div className="absolute inset-0 kural-thumb-grid" />
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${scene.accent}, ${scene.secondary})` }} />
      {aiVideoUrl ? (
        <>
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${canPlayVideo ? "opacity-0" : "opacity-100"}`}
            />
          ) : (
            <SceneMotion sceneKey={scene.key} isCurrentlyPlaying={isCurrentlyPlaying} />
          )}
          <video
            ref={videoRef}
            poster={posterUrl || undefined}
            muted
            playsInline
            loop
            preload={isVisible ? "metadata" : "none"}
            aria-hidden="true"
            onCanPlay={() => setCanPlayVideo(true)}
            onLoadedData={() => setCanPlayVideo(true)}
            onError={() => setCanPlayVideo(false)}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (video.currentTime >= normalizedVideoDuration) {
                video.currentTime = 0;
                if (isVisible) void video.play().catch(() => undefined);
              }
            }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${canPlayVideo ? "opacity-100" : "opacity-0"}`}
          >
            {hasLoadedVideo && webmVideoUrl !== aiVideoUrl ? <source src={webmVideoUrl} type="video/webm" /> : null}
            {hasLoadedVideo ? <source src={aiVideoUrl} type="video/mp4" /> : null}
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" aria-hidden="true" />
        </>
      ) : (() => {
        const articleImage = imageUrl || aiImageUrl || getCategoryFallbackImageUrl(category);
        const showImage = articleImage && !imageError;
        return showImage ? (
          <img
            src={articleImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <SceneMotion sceneKey={scene.key} isCurrentlyPlaying={isCurrentlyPlaying} />
        );
      })()}
    </button>
  );
}
