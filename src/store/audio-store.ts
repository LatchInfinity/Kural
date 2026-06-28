"use client";

import { create } from "zustand";
import type { AudioLang, AudioProvider, AudioTrack, QueueItem, VoiceGender } from "@/lib/audio-engine";
import { queueToAudioTracks, toAudioTrack } from "@/lib/audio-engine";

export interface AudioStoreState {
  currentTrack: AudioTrack | null;
  title: string;
  articleId: string | null;
  audioUrl: string;
  narration: string;
  thumbnail: string;
  isPlaying: boolean;
  isLoading: boolean;
  isPopupOpen: boolean;
  duration: number;
  currentTime: number;
  progress: number;
  error: string | null;
  queue: AudioTrack[];
  currentIndex: number;
  language: AudioLang;
  volume: number;
  speed: number;
  voice: string;
  voiceGender: VoiceGender;
  audioProvider: AudioProvider;
  audioNotice: string | null;
  requestedSeek: number | null;
  replayNonce: number;
}

export interface SetTrackOptions {
  index?: number;
  queue?: QueueItem[];
  language?: AudioLang;
  openPopup?: boolean;
}

interface AudioStoreActions {
  setTrack: (item: QueueItem | AudioTrack, options?: SetTrackOptions) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  clearRequestedSeek: () => void;
  setPopupOpen: (open: boolean) => void;
  updateProgress: (currentTime: number, duration?: number) => void;
  reset: () => void;
  setAudioLoading: (loading: boolean) => void;
  setAudioReady: (url: string, narration: string, provider: AudioProvider, notice?: string | null) => void;
  setError: (error: string | null) => void;
  finishTrack: () => void;
  next: () => void;
  prev: () => void;
  replay: () => void;
  setLanguage: (language: AudioLang) => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  setVoice: (voice: string) => void;
  setVoiceGender: (gender: VoiceGender) => void;
}

const initialState: AudioStoreState = {
  currentTrack: null,
  title: "",
  articleId: null,
  audioUrl: "",
  narration: "",
  thumbnail: "",
  isPlaying: false,
  isLoading: false,
  isPopupOpen: false,
  duration: 0,
  currentTime: 0,
  progress: 0,
  error: null,
  queue: [],
  currentIndex: 0,
  language: "ta",
  volume: 0.8,
  speed: 1.25,
  voice: "",
  voiceGender: "female",
  audioProvider: "none",
  audioNotice: null,
  requestedSeek: null,
  replayNonce: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function progressFor(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return clamp((currentTime / duration) * 100, 0, 100);
}

function applyTrack(track: AudioTrack, state: AudioStoreState, openPopup = false): Partial<AudioStoreState> {
  return {
    currentTrack: track,
    title: track.title,
    articleId: track.articleId,
    audioUrl: "",
    narration: track.script,
    thumbnail: track.thumbnail,
    isPlaying: true,
    isLoading: true,
    isPopupOpen: openPopup || state.isPopupOpen,
    duration: 0,
    currentTime: 0,
    progress: 0,
    error: null,
    audioProvider: "none",
    audioNotice: null,
    requestedSeek: null,
  };
}

export const useAudioStore = create<AudioStoreState & AudioStoreActions>()((set, get) => ({
  ...initialState,

  setTrack: (item, options = {}) => {
    const language = options.language || get().language;
    const queueItems = options.queue && options.queue.length > 0 ? options.queue : [item];
    const queue = queueToAudioTracks(queueItems, language);
    const matchedIndex = queue.findIndex((track) => track.id === item.id);
    const requestedIndex = clamp(matchedIndex >= 0 ? matchedIndex : options.index ?? 0, 0, queue.length - 1);
    const track = queue[requestedIndex] || toAudioTrack(item, language);

    set((state) => ({
      ...applyTrack(track, state, options.openPopup),
      queue,
      currentIndex: requestedIndex,
      language,
    }));
  },

  play: () => set((state) => ({
    isPlaying: Boolean(state.currentTrack),
    isLoading: state.currentTrack ? state.isLoading : false,
    error: state.currentTrack ? null : "No audio selected.",
  })),

  pause: () => set({ isPlaying: false }),

  toggle: () => {
    const state = get();
    if (state.isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  seek: (time) => set((state) => {
    const target = clamp(time, 0, state.duration || time);
    return {
      requestedSeek: target,
      currentTime: target,
      progress: progressFor(target, state.duration),
    };
  }),

  clearRequestedSeek: () => set({ requestedSeek: null }),

  setPopupOpen: (open) => set({ isPopupOpen: open }),

  updateProgress: (currentTime, duration) => set((state) => {
    const nextDuration = Number.isFinite(duration) && duration && duration > 0 ? duration : state.duration;
    const nextCurrentTime = clamp(currentTime, 0, nextDuration || currentTime);
    return {
      currentTime: nextCurrentTime,
      duration: nextDuration,
      progress: progressFor(nextCurrentTime, nextDuration),
    };
  }),

  reset: () => set({ ...initialState, volume: get().volume, voiceGender: get().voiceGender, language: get().language }),

  setAudioLoading: (loading) => set(() => loading ? {
    isLoading: true,
    audioUrl: "",
    audioProvider: "none",
    audioNotice: null,
    error: null,
  } : {
    isLoading: false,
  }),

  setAudioReady: (url, narration, provider, notice = null) => set({
    audioUrl: url,
    narration,
    isLoading: false,
    error: null,
    audioProvider: provider,
    audioNotice: notice,
  }),

  setError: (error) => set({
    error,
    isLoading: false,
    isPlaying: false,
    audioProvider: error ? "none" : get().audioProvider,
  }),

  finishTrack: () => set((state) => ({
    ...initialState,
    language: state.language,
    volume: state.volume,
    speed: state.speed,
    voice: state.voice,
    voiceGender: state.voiceGender,
    replayNonce: state.replayNonce,
  })),

  next: () => {
    const state = get();
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.queue.length) {
      get().finishTrack();
      return;
    }
    const track = state.queue[nextIndex];
    set((current) => ({
      ...applyTrack(track, current),
      currentIndex: nextIndex,
    }));
  },

  prev: () => {
    const state = get();
    const prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) {
      get().seek(0);
      return;
    }
    const track = state.queue[prevIndex];
    set((current) => ({
      ...applyTrack(track, current),
      currentIndex: prevIndex,
    }));
  },

  replay: () => set((state) => ({
    requestedSeek: 0,
    currentTime: 0,
    progress: 0,
    isPlaying: Boolean(state.currentTrack),
    replayNonce: state.replayNonce + 1,
  })),

  setLanguage: (language) => set((state) => {
    if (state.language === language) return state;
    if (!state.currentTrack) return { language };
    const queue = state.queue.map((track) => toAudioTrack(track, language));
    const track = queue[state.currentIndex] || toAudioTrack(state.currentTrack, language);
    return {
      ...applyTrack(track, state),
      queue,
      language,
    };
  }),

  setVolume: (volume) => set({ volume: clamp(volume, 0, 1) }),
  setSpeed: (speed) => set({ speed: clamp(speed, 0.75, 2) }),
  setVoice: (voice) => set({ voice }),
  setVoiceGender: (voiceGender) => set((state) => state.voiceGender === voiceGender ? state : {
    voiceGender,
    voice: "",
    ...(state.currentTrack ? applyTrack(state.currentTrack, state) : {}),
  }),
}));
