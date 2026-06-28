"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NewspaperView, Comment, Toast, TimePeriod, ReactionType, NewsItem } from "@/types";
import type { AudioLang, QueueItem, VoiceGender } from "@/lib/audio-engine";
import { getArticleContentText, getArticleDisplayText } from "@/lib/news-text";
import { useAudioStore } from "@/store/audio-store";
import { useNewsStore } from "@/store/news-store";
import { useUserStore } from "@/store/user-store";

interface AppState {
  activeNav: string;
  setActiveNav: (section: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  newspaperView: NewspaperView;
  setNewspaperView: (view: NewspaperView) => void;
  newspaperSpreadIndex: number;
  setNewspaperSpreadIndex: (index: number) => void;

  setShowPlayerPopup: (show: boolean) => void;
  setShowMiniPlayer: (show: boolean) => void;
  isNewspaperAudioMode: boolean;
  setNewspaperAudioMode: (mode: boolean) => void;
  autoAdvance: boolean;
  setAutoAdvance: (val: boolean) => void;

  timeFilter: TimePeriod;
  setTimeFilter: (period: TimePeriod) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  likedArticles: string[];
  toggleLike: (articleId: string) => void;

  articleReactions: Record<string, Record<string, ReactionType>>;
  setReaction: (articleId: string, reaction: ReactionType) => void;
  removeReaction: (articleId: string) => void;
  getReactionCounts: (articleId: string) => Record<ReactionType, number>;
  getUserReaction: (articleId: string, username: string) => ReactionType | null;

  savedArticles: string[];
  saveArticle: (articleId: string) => void;
  unsaveArticle: (articleId: string) => void;

  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;

  playNews: (item: QueueItem, index: number, queue: QueueItem[]) => void;
  pauseNews: () => void;
  resumeNews: () => void;
  stopNews: () => void;
  replayNews: () => void;
  nextNews: () => void;
  prevNews: () => void;
  setEngineVolume: (v: number) => void;
  setEngineSpeed: (s: number) => void;
  setEngineVoice: (v: string) => void;
  setEngineVoiceGender: (g: VoiceGender) => void;
  setEngineLanguage: (l: AudioLang) => void;
  seekEngine: (t: number) => void;
  retryEngine: () => void;

  comments: Record<string, Comment[]>;
  addComment: (newsId: string, comment: Comment) => void;
  addReply: (newsId: string, commentId: string, reply: Comment) => void;
  likeComment: (newsId: string, commentId: string, username: string) => void;
}

type PersistedComment = Partial<Omit<Comment, "replies">> & {
  replies?: PersistedComment[];
};

interface PersistedAppState {
  likedArticles?: string[];
  articleReactions?: Record<string, Record<string, ReactionType>>;
  savedArticles?: string[];
  comments?: Record<string, PersistedComment[]>;
  timeFilter?: TimePeriod;
  theme?: "light" | "dark";
}

function asPersistedAppState(value: unknown): PersistedAppState {
  return value && typeof value === "object" ? value as PersistedAppState : {};
}

function normalizeComment(c: PersistedComment): Comment {
  return {
    id: c.id || `comment-${Date.now()}`,
    newsId: c.newsId || "",
    username: c.username || "Reader",
    avatar: c.avatar || "",
    text: c.text || "",
    timestamp: typeof c.timestamp === "number" ? c.timestamp : Date.now(),
    reactions: Array.isArray(c.reactions) ? c.reactions : [],
    likes: typeof c.likes === "number" ? c.likes : 0,
    likedBy: Array.isArray(c.likedBy) ? c.likedBy : [],
    replies: (c.replies || []).map(normalizeComment),
  };
}

function toQueueItem(item: NewsItem): QueueItem {
  return {
    id: item.id,
    headline: item.headline,
    englishHeadline: item.englishHeadline,
    imageUrl: item.imageUrl,
    aiImageUrl: item.aiImageUrl,
    tamilSummary: getArticleDisplayText(item, "ta"),
    englishSummary: getArticleDisplayText(item, "en"),
    content: getArticleContentText(item, "ta"),
    source: item.source,
    sourceUrl: item.sourceUrl,
    category: item.category,
    publishedAt: item.publishedAt,
  };
}

function currentNewsQueueFor(item: QueueItem): QueueItem[] {
  const seen = new Set<string>();
  const queue = useNewsStore.getState().articles
    .filter((article) => article.retention !== "archived")
    .filter((article) => {
      if (seen.has(article.id)) return false;
      seen.add(article.id);
      return true;
    })
    .map(toQueueItem);

  return queue.some((queued) => queued.id === item.id) ? queue : [item];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeNav: "home",
      setActiveNav: (section) => set({ activeNav: section }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      newspaperView: "closed" as NewspaperView,
      setNewspaperView: (view) => set({ newspaperView: view }),
      newspaperSpreadIndex: 0,
      setNewspaperSpreadIndex: (index) => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("kural_spread", String(index));
        }
        set({ newspaperSpreadIndex: index });
      },

      setShowPlayerPopup: (show) => {
        useAudioStore.getState().setPopupOpen(show);
      },
      setShowMiniPlayer: () => {},
      isNewspaperAudioMode: false,
      setNewspaperAudioMode: (mode) => set({ isNewspaperAudioMode: mode }),
      autoAdvance: true,
      setAutoAdvance: (val) => set({ autoAdvance: val }),

      timeFilter: "all" as TimePeriod,
      setTimeFilter: (period) => set({ timeFilter: period }),

      theme: "light",
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === "light" ? "dark" : "light";
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", next);
          }
          return { theme: next };
        }),

      likedArticles: [],
      toggleLike: (articleId) =>
        set((state) => ({
          likedArticles: state.likedArticles.includes(articleId)
            ? state.likedArticles.filter((id) => id !== articleId)
            : [...state.likedArticles, articleId],
        })),

      articleReactions: {},
      setReaction: (articleId, reaction) =>
        set((state) => {
          const current = useUserStore.getState().currentUser;
          const uid = current?.username || "anonymous";
          const article = state.articleReactions[articleId] || {};
          return {
            articleReactions: {
              ...state.articleReactions,
              [articleId]: { ...article, [uid]: reaction },
            },
          };
        }),
      removeReaction: (articleId) =>
        set((state) => {
          const current = useUserStore.getState().currentUser;
          const uid = current?.username || "anonymous";
          const article = state.articleReactions[articleId];
          if (!article) return state;
          const rest = { ...article };
          delete rest[uid];
          if (Object.keys(rest).length === 0) {
            const remaining = { ...state.articleReactions };
            delete remaining[articleId];
            return { articleReactions: remaining };
          }
          return {
            articleReactions: { ...state.articleReactions, [articleId]: rest },
          };
        }),
      getReactionCounts: (articleId) => {
        const article = get().articleReactions[articleId] || {};
        const counts: Record<ReactionType, number> = {
          love: 0, trending: 0, celebrate: 0, helpful: 0,
        };
        for (const val of Object.values(article)) {
          if (val in counts) counts[val as ReactionType]++;
        }
        return counts;
      },
      getUserReaction: (articleId, username) => {
        const article = get().articleReactions[articleId];
        if (!article || !article[username]) return null;
        return article[username];
      },

      savedArticles: [],
      saveArticle: (articleId) =>
        set((state) => ({
          savedArticles: state.savedArticles.includes(articleId)
            ? state.savedArticles
            : [...state.savedArticles, articleId],
        })),
      unsaveArticle: (articleId) =>
        set((state) => ({
          savedArticles: state.savedArticles.filter((id) => id !== articleId),
        })),

      toasts: [],
      addToast: (message, type = "success") => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }],
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, 3000);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      playNews: (item, index, queue) => {
        const audio = useAudioStore.getState();
        const playQueue = queue.length > 1 ? queue : currentNewsQueueFor(item);
        const queueIndex = playQueue.findIndex((queued) => queued.id === item.id);
        audio.setTrack(item, {
          index: queueIndex >= 0 ? queueIndex : index,
          queue: playQueue,
          language: audio.language,
        });
      },
      pauseNews: () => useAudioStore.getState().pause(),
      resumeNews: () => useAudioStore.getState().play(),
      stopNews: () => useAudioStore.getState().reset(),
      replayNews: () => useAudioStore.getState().replay(),
      nextNews: () => useAudioStore.getState().next(),
      prevNews: () => useAudioStore.getState().prev(),
      setEngineVolume: (v) => useAudioStore.getState().setVolume(v),
      setEngineSpeed: (s) => useAudioStore.getState().setSpeed(s),
      setEngineVoice: (v) => useAudioStore.getState().setVoice(v),
      setEngineVoiceGender: (g) => useAudioStore.getState().setVoiceGender(g),
      setEngineLanguage: (l) => useAudioStore.getState().setLanguage(l),
      seekEngine: (t) => useAudioStore.getState().seek(t),
      retryEngine: () => {
        const audio = useAudioStore.getState();
        if (audio.currentTrack) audio.setTrack(audio.currentTrack, { index: audio.currentIndex, queue: audio.queue, language: audio.language });
      },

      comments: {},
      addComment: (newsId, comment) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [newsId]: [...(state.comments[newsId] || []), comment],
          },
        })),
      addReply: (newsId, commentId, reply) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [newsId]: (state.comments[newsId] || []).map((c) =>
              c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c
            ),
          },
        })),
      likeComment: (newsId, commentId, username) =>
        set((state) => {
          const updateLikes = (comments: Comment[]): Comment[] =>
            comments.map((c) => {
              if (c.id === commentId) {
                const likedBy = c.likedBy || [];
                const likes = typeof c.likes === "number" ? c.likes : 0;
                const alreadyLiked = likedBy.includes(username);
                return {
                  ...c,
                  likes: alreadyLiked ? Math.max(0, likes - 1) : likes + 1,
                  likedBy: alreadyLiked
                    ? likedBy.filter((u) => u !== username)
                    : [...likedBy, username],
                };
              }
              const replies = c.replies || [];
              if (replies.length > 0) {
                return { ...c, replies: updateLikes(replies) };
              }
              return c;
            });
          return {
            comments: {
              ...state.comments,
              [newsId]: updateLikes(state.comments[newsId] || []),
            },
          };
        }),
    }),
    {
      name: "kural-app-storage",
      version: 2,
      partialize: (state) => ({
        likedArticles: state.likedArticles,
        articleReactions: state.articleReactions,
        savedArticles: state.savedArticles,
        comments: state.comments,
        timeFilter: state.timeFilter,
        theme: state.theme,
      }),
      migrate: (persistedState: unknown, version: number) => {
        const persisted = asPersistedAppState(persistedState);
        const state = {
          likedArticles: persisted.likedArticles ?? [],
          articleReactions: persisted.articleReactions ?? {},
          savedArticles: persisted.savedArticles ?? [],
          comments: {} as Record<string, Comment[]>,
          timeFilter: persisted.timeFilter ?? "all",
          theme: persisted.theme ?? "light",
        };
        const rawComments = persisted.comments ?? {};
        for (const newsId of Object.keys(rawComments)) {
          state.comments[newsId] = (rawComments[newsId] || []).map(normalizeComment);
        }
        if (version < 2) {
          const oldLiked = persisted.likedArticles ?? [];
          if (oldLiked.length > 0 && Object.keys(state.articleReactions).length === 0) {
            state.articleReactions = {};
          }
        }
        return state;
      },
    }
  )
);
