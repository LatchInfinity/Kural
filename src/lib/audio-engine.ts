"use client";

import { getArticleContentText, getArticleHeadlineText, getArticleSpeechText, type NewsTextLanguage } from "@/lib/news-text";

export type EngineState = "idle" | "loading" | "playing" | "paused" | "error";
export type AudioLang = "ta" | "en";
export type VoiceGender = "auto" | "female" | "male";
export type AudioProvider = "none" | "sarvam" | "elevenlabs" | "openai" | "browser";

export interface VoiceInfo {
  name: string;
  lang: string;
  gender: Exclude<VoiceGender, "auto"> | "unknown";
  isLocal: boolean;
  isDefault: boolean;
}

export interface QueueItem {
  id: string;
  headline: string;
  englishHeadline?: string;
  imageUrl: string;
  aiImageUrl?: string;
  tamilSummary: string;
  englishSummary: string;
  content?: string;
  source?: string;
  sourceUrl?: string;
  category?: string;
  publishedAt?: string;
}

export interface AudioTrack extends QueueItem {
  title: string;
  articleId: string;
  thumbnail: string;
  script: string;
  articleText: string;
}

const FEMALE_HINTS = [
  "female", "zira", "samantha", "susan", "karen", "hazel", "heera", "neerja", "asha",
  "vani", "vidya", "pallavi", "shruti", "kalpana", "priya", "aria", "jenny", "michelle",
  "natasha", "sonia", "libby", "olivia", "emma", "ava", "allison", "serena", "victoria",
];

const MALE_HINTS = [
  "male", "david", "mark", "daniel", "james", "paul", "george", "ravi", "madhav",
  "raghav", "valluvar", "senthil", "rishi", "guy", "eric", "tony", "christopher",
  "brian", "brandon", "jacob", "arthur", "oliver", "alex", "fred",
];

function inferVoiceGender(name: string): Exclude<VoiceGender, "auto"> | "unknown" {
  const lower = name.toLowerCase();
  if (MALE_HINTS.some((hint) => lower.includes(hint))) return "male";
  if (FEMALE_HINTS.some((hint) => lower.includes(hint))) return "female";
  return "unknown";
}

export function toAudioTrack(item: QueueItem, language: NewsTextLanguage = "ta"): AudioTrack {
  const title = getArticleHeadlineText(item, language);
  const articleText = getArticleContentText(item, language, 5000);
  const script = getArticleSpeechText(item, language);

  return {
    ...item,
    title,
    articleId: item.id,
    thumbnail: item.aiImageUrl || item.imageUrl,
    script,
    articleText,
  };
}

export function queueToAudioTracks(items: QueueItem[], language: NewsTextLanguage = "ta"): AudioTrack[] {
  return items.map((item) => toAudioTrack(item, language));
}

export class AudioEngine {
  private static instance: AudioEngine;
  private voiceList: SpeechSynthesisVoice[] = [];
  private voicesReady = false;

  private constructor() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => {
      this.voiceList = window.speechSynthesis.getVoices();
      this.voicesReady = this.voiceList.length > 0;
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  getAvailableVoices(lang?: AudioLang, gender: VoiceGender = "auto"): VoiceInfo[] {
    if (!this.voicesReady && typeof window !== "undefined" && window.speechSynthesis) {
      this.voiceList = window.speechSynthesis.getVoices();
      this.voicesReady = this.voiceList.length > 0;
    }

    const prefix = lang === "ta" ? "ta" : lang === "en" ? "en" : "";
    return this.voiceList
      .filter((voice) => !prefix || voice.lang.toLowerCase().startsWith(prefix))
      .map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        gender: inferVoiceGender(voice.name),
        isLocal: voice.localService,
        isDefault: voice.default,
      }))
      .filter((voice) => gender === "auto" || voice.gender === gender || voice.gender === "unknown");
  }

  getVoiceFallbackMessage(): string | null {
    return null;
  }

  clearVoiceFallbackMessage(): void {}
}
