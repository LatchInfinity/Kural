import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { buildAudioBulletinFromText } from "@/lib/news-text";
import {
  buildAudioUrl,
  deleteCachedAudio,
  getCachedAudioInfo,
  saveCachedAudio,
  validateAudioUrl,
  type CachedAudioInfo,
} from "@/lib/tts-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AudioLang = "ta" | "en";
type VoiceGender = "auto" | "female" | "male";

interface ElevenVoice {
  voice_id: string;
  name?: string;
  category?: string;
  description?: string;
  labels?: Record<string, string>;
}

interface TtsBody {
  newsId?: string;
  text?: string;
  language?: AudioLang;
  gender?: VoiceGender;
  speed?: number;
  voiceId?: string;
  forceRegenerate?: boolean;
}

const SARVAM_MODEL = "bulbul:v3";
const SARVAM_ENDPOINT = "https://api.sarvam.ai/text-to-speech";
const SARVAM_DEFAULT_SPEAKERS: Record<AudioLang, Record<Exclude<VoiceGender, "auto">, string>> = {
  ta: {
    female: "roopa",
    male: "vijay",
  },
  en: {
    female: "priya",
    male: "rahul",
  },
};
const ELEVEN_MODEL = "eleven_multilingual_v2";
const DEFAULT_VOICE_IDS: Record<Exclude<VoiceGender, "auto">, string> = {
  female: "EXAVITQu4vr4xnSDxMaL",
  male: "pNInz6obpgDQGcFmaJgB",
};

interface SarvamSpeechResponse {
  request_id?: string | null;
  audios?: string[];
  error?: unknown;
  detail?: unknown;
  message?: unknown;
}

interface SelectedVoice {
  voiceId: string;
  name: string;
}

const voiceCache = new Map<string, { expiresAt: number; voices: ElevenVoice[] }>();

function getApiKeys(): string[] {
  const raw = process.env.ELEVENLABS_API_KEYS || process.env.ELEVENLABS_API_KEY || "";
  return raw
    .split(/[\s,]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}

function getSarvamApiKeys(): string[] {
  const raw = process.env.SARVAM_API_KEYS || process.env.SARVAM_API_KEY || "";
  return raw
    .split(/[\s,]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}

function envVoiceId(language: AudioLang, gender: VoiceGender): string {
  const lang = language.toUpperCase();
  const voiceGender = gender === "auto" ? "FEMALE" : gender.toUpperCase();
  return (
    process.env[`ELEVENLABS_${lang}_${voiceGender}_VOICE_ID`] ||
    process.env[`ELEVENLABS_${voiceGender}_VOICE_ID`] ||
    ""
  );
}

function envSarvamSpeaker(language: AudioLang, gender: VoiceGender): string {
  const lang = language.toUpperCase();
  const voiceGender = gender === "auto" ? "FEMALE" : gender.toUpperCase();
  return (
    process.env[`SARVAM_${lang}_${voiceGender}_SPEAKER`] ||
    process.env[`SARVAM_${voiceGender}_SPEAKER`] ||
    ""
  );
}

function clampSpeed(speed: number | undefined): number {
  if (typeof speed !== "number" || Number.isNaN(speed)) return 1;
  return Math.max(0.7, Math.min(1.2, speed));
}

function clampSarvamPace(speed: number | undefined): number {
  if (typeof speed !== "number" || Number.isNaN(speed)) return 1.12;
  return Math.max(0.5, Math.min(2, speed));
}

function sanitizeText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim();
}

const TAMIL_NUMBERS: Record<number, string> = {
  0: "பூஜ்ஜியம்",
  1: "ஒன்று",
  2: "இரண்டு",
  3: "மூன்று",
  4: "நான்கு",
  5: "ஐந்து",
  6: "ஆறு",
  7: "ஏழு",
  8: "எட்டு",
  9: "ஒன்பது",
  10: "பத்து",
  11: "பதினொன்று",
  12: "பன்னிரண்டு",
  13: "பதின்மூன்று",
  14: "பதினான்கு",
  15: "பதினைந்து",
  16: "பதினாறு",
  17: "பதினேழு",
  18: "பதினெட்டு",
  19: "பத்தொன்பது",
  20: "இருபது",
  21: "இருபத்தொன்று",
  22: "இருபத்திரண்டு",
  23: "இருபத்து மூன்று",
  24: "இருபத்து நான்கு",
  25: "இருபத்தைந்து",
  26: "இருபத்தாறு",
  27: "இருபத்தேழு",
  28: "இருபத்தெட்டு",
  29: "இருபத்தொன்பது",
  30: "முப்பது",
  31: "முப்பத்தொன்று",
  32: "முப்பத்திரண்டு",
  33: "முப்பத்து மூன்று",
  34: "முப்பத்து நான்கு",
  35: "முப்பத்தைந்து",
};

const ENGLISH_NUMBERS: Record<number, string> = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
  20: "twenty",
  21: "twenty one",
  22: "twenty two",
  23: "twenty three",
  24: "twenty four",
  25: "twenty five",
  26: "twenty six",
  27: "twenty seven",
  28: "twenty eight",
  29: "twenty nine",
  30: "thirty",
  31: "thirty one",
  32: "thirty two",
  33: "thirty three",
  34: "thirty four",
  35: "thirty five",
};

function formatIndianNumber(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat("en-IN").format(num);
}

function tamilYear(year: number): string {
  if (year === 2000) return "இரண்டாயிரம்";
  if (year > 2000 && year <= 2035) return `இரண்டாயிரத்து ${TAMIL_NUMBERS[year - 2000]}`;
  return formatIndianNumber(String(year));
}

function englishYear(year: number): string {
  if (year === 2000) return "two thousand";
  if (year > 2000 && year < 2010) return `two thousand ${ENGLISH_NUMBERS[year - 2000]}`;
  if (year >= 2010 && year <= 2035) return `twenty ${ENGLISH_NUMBERS[year - 2000]}`;
  return formatIndianNumber(String(year));
}

function normalizeSpeechText(text: string, language: AudioLang): string {
  return text
    .replace(/20\d{2}(?:-?ஆம்|-?ம்)?/g, (match) => {
      const year = Number(match.match(/20\d{2}/)?.[0]);
      if (!Number.isFinite(year)) return match;
      return language === "ta" ? tamilYear(year) : englishYear(year);
    })
    .replace(/\b\d{5,}\b/g, (match) => formatIndianNumber(match));
}

function voiceText(voice: ElevenVoice): string {
  const labels = voice.labels ? Object.values(voice.labels).join(" ") : "";
  return `${voice.name || ""} ${voice.description || ""} ${voice.category || ""} ${labels}`.toLowerCase();
}

function scoreVoice(voice: ElevenVoice, language: AudioLang, gender: VoiceGender): number {
  const text = voiceText(voice);
  let score = 0;

  if (language === "ta") {
    if (text.includes("tamil")) score += 80;
    if (text.includes("india") || text.includes("indian")) score += 30;
    if (text.includes("multilingual")) score += 15;
  } else {
    if (text.includes("english")) score += 70;
    if (text.includes("india") || text.includes("indian")) score += 25;
    if (text.includes("american") || text.includes("british")) score += 10;
  }

  if (gender !== "auto") {
    if (text.includes(gender)) score += 45;
    if (gender === "female" && /(bella|rachel|domi|elli|sarah|aria|jessica|laura|lily)/i.test(text)) score += 18;
    if (gender === "male" && /(adam|antoni|josh|arnold|sam|george|charlie|daniel|will)/i.test(text)) score += 18;
  }

  if (text.includes("professional")) score += 8;
  if (text.includes("premade")) score += 4;
  return score;
}

async function fetchVoices(apiKey: string): Promise<ElevenVoice[]> {
  const cached = voiceCache.get(apiKey);
  if (cached && cached.expiresAt > Date.now()) return cached.voices;

  const response = await fetch("https://api.elevenlabs.io/v2/voices", {
    headers: { "xi-api-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return [];
  const data = await response.json() as { voices?: ElevenVoice[] };
  const voices = Array.isArray(data.voices) ? data.voices : [];
  voiceCache.set(apiKey, { voices, expiresAt: Date.now() + 10 * 60 * 1000 });
  return voices;
}

function readableVoiceName(language: AudioLang, gender: VoiceGender, prefix: string): string {
  const lang = language === "ta" ? "Tamil" : "English";
  const voiceGender = gender === "auto" ? "voice" : `${gender} voice`;
  return `${prefix} ${lang} ${voiceGender}`;
}

function headerSafe(value: string): string {
  const safe = value.replace(/[^\x20-\x7E]/g, "").trim();
  return safe || "Generated voice";
}

function logAudioFileExists(cacheKey: string, info: CachedAudioInfo): void {
  console.log("[AUDIO FILE EXISTS]", {
    cacheKey,
    exists: true,
    path: info.audioPath,
    bytes: info.size,
    contentType: info.meta.contentType,
  });
}

function readyAudioResponse(
  request: NextRequest,
  cacheKey: string,
  info: CachedAudioInfo,
  cacheStatus: "HIT" | "MISS",
  startedAt: number,
): NextResponse {
  const audioUrl = buildAudioUrl(request, cacheKey);
  validateAudioUrl(audioUrl, request, cacheKey);
  const finishedAt = Date.now();

  logAudioFileExists(cacheKey, info);
  console.log("[AUDIO URL GENERATED]", {
    cacheKey,
    audioUrl,
    environment: process.env.NODE_ENV,
  });
  console.log("[AUDIO URL]", {
    cacheKey,
    url: audioUrl,
    expires: false,
  });
  console.log("[AUDIO API RESPONSE]", {
    status: "ready",
    cacheKey,
    cache: cacheStatus,
    provider: info.meta.provider,
    contentType: info.meta.contentType,
    bytes: info.size,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    elapsedMs: finishedAt - startedAt,
  });

  return NextResponse.json({
    status: "ready",
    audioUrl,
    cacheKey,
    cache: cacheStatus,
    provider: info.meta.provider,
    contentType: info.meta.contentType,
    bytes: info.size,
    voiceName: info.meta.voiceName,
    voiceId: info.meta.voiceId || null,
  }, {
    headers: {
      "Cache-Control": "no-store",
      "X-Kural-TTS": info.meta.provider,
      "X-Kural-TTS-Cache": cacheStatus,
      ...(info.meta.voiceId ? { "X-Kural-Voice-Id": info.meta.voiceId } : {}),
      "X-Kural-Voice-Name": headerSafe(info.meta.voiceName),
      "X-Kural-Audio-Url": audioUrl,
    },
  });
}

function ttsCacheKey(text: string, body: TtsBody): string {
  const payload = {
    version: 1,
    text,
    language: body.language || "ta",
    gender: body.gender || "female",
    speed: clampSarvamPace(body.speed).toFixed(2),
    voiceId: body.voiceId || "",
  };
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function sarvamLanguageCode(language: AudioLang): string {
  return language === "ta" ? "ta-IN" : "en-IN";
}

function selectSarvamSpeaker(body: TtsBody): string {
  const language = body.language || "ta";
  const gender = body.gender === "male" ? "male" : "female";
  return envSarvamSpeaker(language, gender) || SARVAM_DEFAULT_SPEAKERS[language][gender];
}

function normalizeSarvamError(message: string): string {
  try {
    const parsed = JSON.parse(message) as SarvamSpeechResponse;
    const possible = parsed.message || parsed.error || parsed.detail;
    if (typeof possible === "string") message = possible;
    else if (possible && typeof possible === "object") message = JSON.stringify(possible);
  } catch {}

  if (/quota|credit/i.test(message)) return "Sarvam AI quota exceeded for the configured API key";
  if (/unauthorized|forbidden|api|subscription|key/i.test(message)) return "Sarvam AI API key is invalid or not allowed";
  if (/rate|limit/i.test(message)) return "Sarvam AI rate limit reached";
  return message || "Unable to generate Sarvam AI audio";
}

function normalizeElevenLabsError(message: string): string {
  try {
    const parsed = JSON.parse(message) as {
      detail?: string | { status?: string; message?: string };
      error?: string;
      message?: string;
    };
    if (typeof parsed.detail === "object" && parsed.detail?.message) message = parsed.detail.message;
    else if (typeof parsed.detail === "string") message = parsed.detail;
    else if (typeof parsed.error === "string") message = parsed.error;
    else if (typeof parsed.message === "string") message = parsed.message;
  } catch {}

  if (/quota/i.test(message)) {
    return "ElevenLabs quota exceeded for the configured API key";
  }
  if (/unauthorized|invalid api|xi-api-key|forbidden/i.test(message)) {
    return "ElevenLabs API key is invalid or not allowed";
  }
  if (/rate|limit/i.test(message)) {
    return "ElevenLabs rate limit reached";
  }
  return message || "Unable to generate ElevenLabs audio";
}

async function selectVoice(apiKey: string, body: TtsBody): Promise<SelectedVoice> {
  const language = body.language || "ta";
  const gender = body.gender || "female";
  if (body.voiceId) {
    return { voiceId: body.voiceId, name: readableVoiceName(language, gender, "ElevenLabs custom") };
  }

  const configured = envVoiceId(language, gender);
  if (configured) {
    return { voiceId: configured, name: readableVoiceName(language, gender, "ElevenLabs configured") };
  }

  const voices = await fetchVoices(apiKey);
  const ranked = [...voices].sort((a, b) => scoreVoice(b, language, gender) - scoreVoice(a, language, gender));
  if (ranked[0]?.voice_id) {
    return {
      voiceId: ranked[0].voice_id,
      name: ranked[0].name || readableVoiceName(language, gender, "ElevenLabs"),
    };
  }

  const defaultGender = gender === "male" ? "male" : "female";
  return {
    voiceId: DEFAULT_VOICE_IDS[defaultGender],
    name: readableVoiceName(language, defaultGender, "ElevenLabs default"),
  };
}

async function createSpeech(apiKey: string, voiceId: string, body: TtsBody): Promise<Response> {
  const language = body.language || "ta";
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: sanitizeText(body.text || ""),
      model_id: ELEVEN_MODEL,
      language_code: language,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        speed: clampSpeed(body.speed),
      },
    }),
    signal: AbortSignal.timeout(30000),
  });
}

async function createSarvamSpeech(apiKey: string, body: TtsBody, text: string): Promise<Response> {
  const language = body.language || "ta";
  const speaker = selectSarvamSpeaker(body);

  return fetch(SARVAM_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      text,
      target_language_code: sarvamLanguageCode(language),
      speaker,
      model: SARVAM_MODEL,
      pace: clampSarvamPace(body.speed),
      speech_sample_rate: 24000,
      output_audio_codec: "wav",
      temperature: 0.55,
    }),
    signal: AbortSignal.timeout(30000),
  });
}

function sarvamVoiceName(body: TtsBody): string {
  const language = body.language || "ta";
  const gender = body.gender === "male" ? "male" : "female";
  return `Sarvam ${selectSarvamSpeaker(body)} ${readableVoiceName(language, gender, "").trim()}`;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await request.json().catch(() => ({})) as TtsBody;
    const language = body.language || "ta";
    const rawText = sanitizeText(body.text || "");
    if (!rawText) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    const text = sanitizeText(normalizeSpeechText(buildAudioBulletinFromText(rawText, language), language));

    const cacheKey = ttsCacheKey(text, body);
    console.log("[AUDIO START]", {
      cacheKey,
      newsId: body.newsId || null,
      language,
      gender: body.gender || "female",
      speed: clampSarvamPace(body.speed),
      forceRegenerate: Boolean(body.forceRegenerate),
      startedAt: new Date(startedAt).toISOString(),
    });

    if (body.forceRegenerate) {
      await deleteCachedAudio(cacheKey);
    } else {
      const cached = await getCachedAudioInfo(cacheKey);
      if (cached) {
        return readyAudioResponse(request, cacheKey, cached, "HIT", startedAt);
      }
    }

    let lastStatus = 500;
    let lastMessage = "Unable to generate audio";

    const sarvamKeys = getSarvamApiKeys();
    for (const apiKey of sarvamKeys) {
      try {
        const response = await createSarvamSpeech(apiKey, body, text);
        if (response.ok) {
          const data = await response.json() as SarvamSpeechResponse;
          const audioBase64 = data.audios?.[0];
          if (!audioBase64) {
            lastStatus = 502;
            lastMessage = "Sarvam AI did not return audio";
            continue;
          }

          const audio = Buffer.from(audioBase64, "base64");
          const voiceName = sarvamVoiceName(body);
          const info = await saveCachedAudio(cacheKey, audio, {
            provider: "sarvam",
            contentType: "audio/wav",
            voiceName,
            createdAt: new Date().toISOString(),
          }, body.newsId);
          return readyAudioResponse(request, cacheKey, info, "MISS", startedAt);
        }

        lastStatus = response.status;
        lastMessage = normalizeSarvamError(await response.text().catch(() => response.statusText));
        const retryable = [401, 403, 429, 500, 502, 503, 504].includes(response.status)
          || /quota|rate|limit|key/i.test(lastMessage);
        if (!retryable) break;
      } catch (err) {
        lastMessage = normalizeSarvamError(err instanceof Error ? err.message : String(err));
      }
    }

    const keys = getApiKeys();
    if (keys.length === 0 && sarvamKeys.length === 0) {
      console.log("[AUDIO API RESPONSE]", {
        status: "error",
        cacheKey,
        error: "Voice provider is not configured",
        elapsedMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: "Voice provider is not configured" }, { status: 501 });
    }

    for (const apiKey of keys) {
      try {
        const selectedVoice = await selectVoice(apiKey, body);
        const response = await createSpeech(apiKey, selectedVoice.voiceId, { ...body, text });
        if (response.ok) {
          const audio = Buffer.from(await response.arrayBuffer());
          const contentType = response.headers.get("content-type") || "audio/mpeg";
          const info = await saveCachedAudio(cacheKey, audio, {
            provider: "elevenlabs",
            contentType,
            voiceId: selectedVoice.voiceId,
            voiceName: selectedVoice.name,
            createdAt: new Date().toISOString(),
          }, body.newsId);
          return readyAudioResponse(request, cacheKey, info, "MISS", startedAt);
        }

        lastStatus = response.status;
        lastMessage = normalizeElevenLabsError(await response.text().catch(() => response.statusText));
        const retryable = [401, 403, 429, 500, 502, 503, 504].includes(response.status)
          || /quota|rate|limit/i.test(lastMessage);
        if (!retryable) break;
      } catch (err) {
        lastMessage = normalizeElevenLabsError(err instanceof Error ? err.message : String(err));
      }
    }

    console.log("[AUDIO API RESPONSE]", {
      status: "error",
      cacheKey,
      error: lastMessage,
      httpStatus: lastStatus,
      elapsedMs: Date.now() - startedAt,
    });
    return NextResponse.json({ error: lastMessage }, { status: lastStatus });
  } catch (err) {
    console.log("[AUDIO API RESPONSE]", {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      elapsedMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
