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

const ELEVENLABS_MODEL = "eleven_multilingual_v2";
const ELEVENLABS_SPEED_MIN = 0.7;
const ELEVENLABS_SPEED_MAX = 1.2;
const ELEVENLABS_DEFAULT_VOICES: Record<Exclude<VoiceGender, "auto">, string> = {
  female: "EXAVITQu4vr4xnSDxMaL",
  male: "pNInz6obpgDQGcFmaJgB",
};
const ELEVENLABS_DOCS_SAMPLE_VOICE = "JBFqnCBsd6RMkjVDRZzb";

interface ElevenLabsErrorResponse {
  detail?: string | {
    message?: string;
    status?: string;
  };
  error?: string;
  message?: string;
}

interface SelectedElevenLabsVoice {
  voiceId: string;
  name: string;
}

const voiceCache = new Map<string, { expiresAt: number; voices: ElevenVoice[] }>();

function fingerprintSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function cleanEnvToken(value: string | undefined): string {
  return (value || "")
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/^[`'"\[(]+/, "")
    .replace(/[`'"\]),;]+$/, "")
    .trim();
}

function extractElevenLabsKeys(raw: string): string[] {
  const exactKeys = raw.match(/sk_[A-Za-z0-9]{20,}/g) || [];
  if (exactKeys.length > 0) return exactKeys.map(cleanEnvToken);

  return raw
    .split(/[\s,;]+/)
    .map(cleanEnvToken)
    .map((token) => token.replace(/^ELEVENLABS_API_KEYS?_\d?=/i, ""))
    .map((token) => token.replace(/^ELEVENLABS_API_KEYS?=/i, ""))
    .filter((token) => /^sk_[A-Za-z0-9]{20,}$/.test(token));
}

function getElevenLabsApiKeys(): string[] {
  const indexedKeys = [
    process.env.ELEVENLABS_API_KEY_1,
    process.env.ELEVENLABS_API_KEY_2,
    process.env.ELEVENLABS_API_KEY_3,
  ];
  const raw = [
    process.env.ELEVENLABS_API_KEYS || "",
    process.env.ELEVENLABS_API_KEY || "",
    ...indexedKeys,
  ].join(",");

  return Array.from(new Set(extractElevenLabsKeys(raw)));
}

function elevenLabsDiagnostics() {
  const keys = getElevenLabsApiKeys();
  return {
    provider: "elevenlabs",
    keyCount: keys.length,
    env: {
      ELEVENLABS_API_KEYS: Boolean(process.env.ELEVENLABS_API_KEYS),
      ELEVENLABS_API_KEY: Boolean(process.env.ELEVENLABS_API_KEY),
      ELEVENLABS_API_KEY_1: Boolean(process.env.ELEVENLABS_API_KEY_1),
      ELEVENLABS_API_KEY_2: Boolean(process.env.ELEVENLABS_API_KEY_2),
      ELEVENLABS_API_KEY_3: Boolean(process.env.ELEVENLABS_API_KEY_3),
    },
    keys: keys.map((key, index) => ({
      index: index + 1,
      fingerprint: fingerprintSecret(key),
      length: key.length,
      prefix: key.startsWith("sk_") ? "sk_" : "invalid",
    })),
  };
}

function normalizeElevenLabsVoiceId(value: string | undefined): string {
  const voiceId = cleanEnvToken(value);
  return /^[A-Za-z0-9_-]{10,}$/.test(voiceId) ? voiceId : "";
}

function envElevenLabsVoiceId(language: AudioLang, gender: VoiceGender): string {
  const lang = language.toUpperCase();
  const voiceGender = gender === "auto" ? "FEMALE" : gender.toUpperCase();
  return (
    normalizeElevenLabsVoiceId(process.env[`ELEVENLABS_${lang}_${voiceGender}_VOICE_ID`]) ||
    normalizeElevenLabsVoiceId(process.env[`ELEVENLABS_${voiceGender}_VOICE_ID`]) ||
    ""
  );
}

function clampElevenLabsSpeed(speed: number | undefined): number {
  if (typeof speed !== "number" || Number.isNaN(speed)) return ELEVENLABS_SPEED_MAX;
  return Math.max(ELEVENLABS_SPEED_MIN, Math.min(ELEVENLABS_SPEED_MAX, speed));
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
    version: 2,
    provider: "elevenlabs",
    text,
    language: body.language || "ta",
    gender: body.gender || "female",
    speed: clampElevenLabsSpeed(body.speed).toFixed(2),
    voiceId: body.voiceId || "",
  };
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function normalizeElevenLabsError(message: string, status?: number): string {
  try {
    const parsed = JSON.parse(message) as ElevenLabsErrorResponse;
    if (typeof parsed.detail === "string") message = parsed.detail;
    else if (parsed.detail?.message) message = parsed.detail.message;
    else if (parsed.message) message = parsed.message;
    else if (parsed.error) message = parsed.error;
  } catch {}

  if (status === 401 || status === 403) return "ElevenLabs API key is invalid or not allowed";
  if (/quota|credit|limit.*reached|character/i.test(message)) return "ElevenLabs quota or character limit is not available";
  if (/unauthorized|forbidden|api key|invalid.*key/i.test(message)) return "ElevenLabs API key is invalid or not allowed";
  if (/rate|too many/i.test(message)) return "ElevenLabs rate limit reached";
  return message || "Unable to generate ElevenLabs audio";
}

function configuredElevenLabsVoiceId(body: TtsBody): string {
  const language = body.language || "ta";
  const gender = body.gender === "male" ? "male" : "female";
  return envElevenLabsVoiceId(language, gender) || normalizeElevenLabsVoiceId(body.voiceId) || "";
}

function voiceText(voice: ElevenVoice): string {
  const labels = voice.labels ? Object.values(voice.labels).join(" ") : "";
  return `${voice.name || ""} ${voice.description || ""} ${voice.category || ""} ${labels}`.toLowerCase();
}

function scoreElevenLabsVoice(voice: ElevenVoice, language: AudioLang, gender: VoiceGender): number {
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

async function fetchElevenLabsVoices(apiKey: string): Promise<ElevenVoice[]> {
  const cacheKey = crypto.createHash("sha256").update(apiKey).digest("hex");
  const cached = voiceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.voices;

  try {
    const response = await fetch("https://api.elevenlabs.io/v2/voices", {
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];
    const data = await response.json() as { voices?: ElevenVoice[] };
    const voices = Array.isArray(data.voices) ? data.voices : [];
    voiceCache.set(cacheKey, { voices, expiresAt: Date.now() + 10 * 60 * 1000 });
    return voices;
  } catch (error) {
    console.log("[TTS VOICES FAILURE]", {
      provider: "elevenlabs",
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function uniqueVoiceCandidates(candidates: SelectedElevenLabsVoice[]): SelectedElevenLabsVoice[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (!candidate.voiceId || seen.has(candidate.voiceId)) return false;
    seen.add(candidate.voiceId);
    return true;
  });
}

async function selectElevenLabsVoices(apiKey: string, body: TtsBody): Promise<SelectedElevenLabsVoice[]> {
  const language = body.language || "ta";
  const gender = body.gender || "female";
  const defaultGender = gender === "male" ? "male" : "female";
  const candidates: SelectedElevenLabsVoice[] = [];
  const configured = configuredElevenLabsVoiceId(body);
  if (configured) {
    candidates.push({ voiceId: configured, name: readableVoiceName(language, gender, "ElevenLabs configured") });
  }

  const voices = await fetchElevenLabsVoices(apiKey);
  const ranked = [...voices].sort((a, b) => scoreElevenLabsVoice(b, language, gender) - scoreElevenLabsVoice(a, language, gender));
  if (ranked[0]?.voice_id) {
    candidates.push({
      voiceId: ranked[0].voice_id,
      name: ranked[0].name || readableVoiceName(language, gender, "ElevenLabs"),
    });
  }

  candidates.push({
    voiceId: ELEVENLABS_DEFAULT_VOICES[defaultGender],
    name: readableVoiceName(language, defaultGender, "ElevenLabs default"),
  });
  candidates.push({
    voiceId: ELEVENLABS_DOCS_SAMPLE_VOICE,
    name: readableVoiceName(language, defaultGender, "ElevenLabs sample"),
  });

  return uniqueVoiceCandidates(candidates);
}

async function createElevenLabsSpeech(apiKey: string, voiceId: string, body: TtsBody, text: string): Promise<Response> {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
        speed: clampElevenLabsSpeed(body.speed),
      },
    }),
    signal: AbortSignal.timeout(30000),
  });
}

function isElevenLabsKeyAuthFailure(status: number, rawMessage: string): boolean {
  if (status !== 401 && status !== 403) return false;
  return /invalid.*api|api.*key|xi-api-key|unauthorized|forbidden/i.test(rawMessage)
    && !/voice/i.test(rawMessage);
}

export async function GET() {
  return NextResponse.json(elevenLabsDiagnostics(), {
    headers: { "Cache-Control": "no-store" },
  });
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
      speed: clampElevenLabsSpeed(body.speed),
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

    const elevenLabsKeys = getElevenLabsApiKeys();
    for (let keyIndex = 0; keyIndex < elevenLabsKeys.length; keyIndex += 1) {
      try {
        console.log("[TTS PROVIDER]", {
          provider: "elevenlabs",
          keyIndex: keyIndex + 1,
          totalKeys: elevenLabsKeys.length,
          keyFingerprint: fingerprintSecret(elevenLabsKeys[keyIndex]),
          cacheKey,
          newsId: body.newsId || null,
          status: "attempt",
        });
        const voices = await selectElevenLabsVoices(elevenLabsKeys[keyIndex], body);
        for (let voiceIndex = 0; voiceIndex < voices.length; voiceIndex += 1) {
          const selectedVoice = voices[voiceIndex];
          const response = await createElevenLabsSpeech(elevenLabsKeys[keyIndex], selectedVoice.voiceId, body, text);
          if (response.ok) {
            const audio = Buffer.from(await response.arrayBuffer());
            const info = await saveCachedAudio(cacheKey, audio, {
              provider: "elevenlabs",
              contentType: response.headers.get("content-type") || "audio/mpeg",
              voiceId: selectedVoice.voiceId,
              voiceName: selectedVoice.name,
              createdAt: new Date().toISOString(),
            }, body.newsId);
            return readyAudioResponse(request, cacheKey, info, "MISS", startedAt);
          }

          const rawMessage = await response.text().catch(() => response.statusText);
          lastStatus = response.status;
          lastMessage = normalizeElevenLabsError(rawMessage, response.status);
          console.log("[TTS FAILURE]", {
            provider: "elevenlabs",
            keyIndex: keyIndex + 1,
            totalKeys: elevenLabsKeys.length,
            keyFingerprint: fingerprintSecret(elevenLabsKeys[keyIndex]),
            voiceIndex: voiceIndex + 1,
            totalVoices: voices.length,
            status: response.status,
            cacheKey,
            newsId: body.newsId || null,
            error: lastMessage,
          });

          if (isElevenLabsKeyAuthFailure(response.status, rawMessage)) break;
        }
      } catch (err) {
        lastMessage = normalizeElevenLabsError(err instanceof Error ? err.message : String(err));
        console.log("[TTS FAILURE]", {
          provider: "elevenlabs",
          keyIndex: keyIndex + 1,
          totalKeys: elevenLabsKeys.length,
          keyFingerprint: fingerprintSecret(elevenLabsKeys[keyIndex]),
          cacheKey,
          newsId: body.newsId || null,
          error: lastMessage,
        });
      }
    }

    if (elevenLabsKeys.length === 0) {
      console.log("[AUDIO API RESPONSE]", {
        status: "error",
        cacheKey,
        provider: "none",
        error: "No ElevenLabs API key is configured",
        elapsedMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: "No ElevenLabs API key is configured" }, { status: 501 });
    }

    console.log("[AUDIO API RESPONSE]", {
      status: "error",
      cacheKey,
      provider: "elevenlabs",
      error: lastMessage,
      attemptedKeys: elevenLabsKeys.length,
      diagnostics: elevenLabsDiagnostics(),
      httpStatus: lastStatus,
      elapsedMs: Date.now() - startedAt,
    });
    const error = elevenLabsKeys.length > 1
      ? `All ${elevenLabsKeys.length} ElevenLabs API keys failed. Last error: ${lastMessage}`
      : lastMessage;
    return NextResponse.json({
      error,
      attemptedKeys: elevenLabsKeys.length,
      diagnostics: elevenLabsDiagnostics(),
    }, { status: lastStatus });
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
