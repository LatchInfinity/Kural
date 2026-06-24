"use client";
import { useState, type ReactNode } from "react";

export default function SafeImage({
  src,
  aiSrc,
  fallbackSrc,
  fallback,
  alt,
  className,
  style,
}: {
  src: string | undefined | null;
  aiSrc?: string | undefined | null;
  fallbackSrc?: string | undefined | null;
  fallback?: ReactNode;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const primary = src && src.trim() ? src : null;
  const secondary = aiSrc && aiSrc.trim() ? aiSrc : null;
  const tertiary = fallbackSrc && fallbackSrc.trim() ? fallbackSrc : null;
  const initial = primary || secondary || tertiary;
  const [imgSrc, setImgSrc] = useState<string | null>(initial);

  if (!imgSrc) return fallback || null;

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        if (imgSrc === primary && secondary) {
          setImgSrc(secondary);
        } else if ((imgSrc === primary || imgSrc === secondary) && tertiary) {
          setImgSrc(tertiary);
        } else {
          setImgSrc(null);
        }
      }}
    />
  );
}
