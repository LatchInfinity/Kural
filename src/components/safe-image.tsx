"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";

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
  const candidates = useMemo(() => {
    const seen = new Set<string>();
    return [src, aiSrc, fallbackSrc]
      .map((value) => (value || "").trim())
      .filter((value) => {
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
      });
  }, [aiSrc, fallbackSrc, src]);
  const candidateKey = candidates.join("|");
  const [imageIndex, setImageIndex] = useState(0);
  const imgSrc = candidates[imageIndex] || null;

  useEffect(() => {
    setImageIndex(0);
  }, [candidateKey]);

  if (!imgSrc) return fallback || null;

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => setImageIndex((current) => current + 1)}
    />
  );
}
