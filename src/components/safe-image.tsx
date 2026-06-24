"use client";
import { useState } from "react";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23ccc' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function SafeImage({
  src,
  aiSrc,
  alt,
  className,
  style,
}: {
  src: string | undefined | null;
  aiSrc?: string | undefined | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const primary = src && src.trim() ? src : null;
  const secondary = aiSrc && aiSrc.trim() ? aiSrc : null;
  const initial = primary || secondary || PLACEHOLDER;
  const [imgSrc, setImgSrc] = useState<string>(initial);
  const [failedPrimary, setFailedPrimary] = useState(false);

  if (!primary && !secondary) {
    return <img src={PLACEHOLDER} alt={alt} className={className} style={style} />;
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        if (primary && !failedPrimary) {
          setFailedPrimary(true);
          if (secondary) setImgSrc(secondary);
          else setImgSrc(PLACEHOLDER);
        } else {
          setImgSrc(PLACEHOLDER);
        }
      }}
    />
  );
}
