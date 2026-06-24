"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, StreakData, RewardData, DailyTask } from "@/types";

function generateId(): string {
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultStreak(): StreakData {
  return {
    readingStreak: 0,
    listeningStreak: 0,
    bestReadingStreak: 0,
    bestListeningStreak: 0,
    lastReadDate: null,
    lastListenDate: null,
  };
}

const TASK_POOLS: DailyTask[][] = [
  [
    { id: "listen-articles", label: "Listen to 5 Articles", labelTa: "5 கட்டுரைகளை கேளுங்கள்", points: 20, progress: 0, target: 5, completed: false },
    { id: "listen-duration", label: "Listen for 10 Minutes", labelTa: "10 நிமிடம் கேளுங்கள்", points: 15, progress: 0, target: 10, completed: false },
    { id: "listen-categories", label: "Listen from 3 Categories", labelTa: "3 பிரிவுகளில் கேளுங்கள்", points: 15, progress: 0, target: 3, completed: false },
    { id: "save-articles", label: "Bookmark While Listening", labelTa: "கேட்டு சேமிக்க", points: 10, progress: 0, target: 3, completed: false },
    { id: "share-article", label: "Share While Listening", labelTa: "கேட்டு பகிர", points: 15, progress: 0, target: 1, completed: false },
  ],
  [
    { id: "listen-articles", label: "Listen to 8 Articles", labelTa: "8 கட்டுரைகளை கேளுங்கள்", points: 25, progress: 0, target: 8, completed: false },
    { id: "listen-duration", label: "Listen for 15 Minutes", labelTa: "15 நிமிடம் கேளுங்கள்", points: 20, progress: 0, target: 15, completed: false },
    { id: "listen-categories", label: "Listen from 5 Categories", labelTa: "5 பிரிவுகளில் கேளுங்கள்", points: 20, progress: 0, target: 5, completed: false },
    { id: "save-articles", label: "Bookmark 5 Articles", labelTa: "5 கட்டுரைகளை சேமிக்க", points: 15, progress: 0, target: 5, completed: false },
    { id: "share-article", label: "Share 2 Articles", labelTa: "2 கட்டுரைகளை பகிர", points: 20, progress: 0, target: 2, completed: false },
  ],
  [
    { id: "listen-articles", label: "Listen to 3 Articles", labelTa: "3 கட்டுரைகளை கேளுங்கள்", points: 15, progress: 0, target: 3, completed: false },
    { id: "listen-duration", label: "Listen for 5 Minutes", labelTa: "5 நிமிடம் கேளுங்கள்", points: 10, progress: 0, target: 5, completed: false },
    { id: "listen-categories", label: "Listen from 2 Categories", labelTa: "2 பிரிவுகளில் கேளுங்கள்", points: 10, progress: 0, target: 2, completed: false },
    { id: "save-articles", label: "Bookmark 2 Articles", labelTa: "2 கட்டுரைகளை சேமிக்க", points: 8, progress: 0, target: 2, completed: false },
    { id: "share-article", label: "Share 1 Article", labelTa: "1 கட்டுரையை பகிர", points: 12, progress: 0, target: 1, completed: false },
  ],
  [
    { id: "listen-articles", label: "Listen to 10 Articles", labelTa: "10 கட்டுரைகளை கேளுங்கள்", points: 30, progress: 0, target: 10, completed: false },
    { id: "listen-duration", label: "Listen for 20 Minutes", labelTa: "20 நிமிடம் கேளுங்கள்", points: 25, progress: 0, target: 20, completed: false },
    { id: "listen-categories", label: "Listen from 4 Categories", labelTa: "4 பிரிவுகளில் கேளுங்கள்", points: 18, progress: 0, target: 4, completed: false },
    { id: "save-articles", label: "Bookmark 6 Articles", labelTa: "6 கட்டுரைகளை சேமிக்க", points: 18, progress: 0, target: 6, completed: false },
    { id: "share-article", label: "Share 3 Articles", labelTa: "3 கட்டுரைகளை பகிர", points: 25, progress: 0, target: 3, completed: false },
  ],
];

function getDailyTaskPool(): DailyTask[] {
  const day = new Date().getDate();
  const poolIndex = day % TASK_POOLS.length;
  return TASK_POOLS[poolIndex].map(t => ({ ...t, progress: 0, completed: false }));
}

function createDefaultDailyTasks(): DailyTask[] {
  return getDailyTaskPool();
}

function createDefaultRewards(): RewardData {
  return {
    points: 0,
    level: 1,
    dailyTasks: createDefaultDailyTasks(),
    claimedMilestones: [],
    dailyCompletionBonusClaimed: false,
    lastDailyReset: new Date().toISOString().split("T")[0],
  };
}

function getReaderLevel(points: number): number {
  if (points <= 100) return 1;
  if (points <= 300) return 2;
  if (points <= 700) return 3;
  if (points <= 1500) return 4;
  return 5;
}

const MILESTONE_REWARDS: Record<number, number> = { 7: 50, 30: 250, 100: 1000 };

function updateStreak(lastDate: string | null, currentStreak: number, bestStreak: number): { newStreak: number; newBest: number } {
  const today = new Date().toISOString().split("T")[0];
  if (lastDate === today) {
    return { newStreak: currentStreak, newBest: bestStreak };
  }
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (lastDate === yesterday || lastDate === null) {
    const newStreak = (lastDate === null ? 0 : currentStreak) + 1;
    return { newStreak, newBest: Math.max(bestStreak, newStreak) };
  }
  return { newStreak: 1, newBest: bestStreak };
}

interface PersistedUserState {
  currentUser?: UserProfile | null;
  users?: UserProfile[];
  isAuthenticated?: boolean;
}

function asPersistedUserState(value: unknown): PersistedUserState {
  return value && typeof value === "object" ? value as PersistedUserState : {};
}

function normalizeUserProfile(user: UserProfile): UserProfile {
  return {
    ...user,
    streak: user.streak || createDefaultStreak(),
    rewards: user.rewards || createDefaultRewards(),
  };
}

function resetUserDailyTasks(user: UserProfile, today: string): UserProfile {
  return {
    ...normalizeUserProfile(user),
    rewards: {
      ...(user.rewards || createDefaultRewards()),
      dailyTasks: getDailyTaskPool(),
      lastDailyReset: today,
      dailyCompletionBonusClaimed: false,
    },
  };
}

interface UserState {
  currentUser: UserProfile | null;
  users: UserProfile[];
  isAuthenticated: boolean;

  register: (data: { username: string; email: string; password: string; profileImage?: string }) => { success: boolean; error?: string };
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  getCurrentUser: () => UserProfile | null;

  trackReading: () => void;
  trackListening: () => void;
  getStreaks: () => StreakData;

  addPoints: (amount: number) => void;
  getReaderLevel: (points: number) => number;
  updateDailyTaskProgress: (taskId: string, increment: number) => void;
  claimMilestoneReward: (milestoneDay: number) => boolean;

  changePassword: (currentPassword: string, newPassword: string) => { success: boolean; error?: string };
  updateProfileImage: (url: string) => void;
  removeProfileImage: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      isAuthenticated: false,

      register: (data) => {
        const { users } = get();
        const trimmed = data.username.trim();
        const emailTrimmed = data.email.trim().toLowerCase();

        if (trimmed.length < 3) {
          return { success: false, error: "Username must be at least 3 characters" };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
          return { success: false, error: "Invalid email address" };
        }
        if (data.password.length < 8) {
          return { success: false, error: "Password must be at least 8 characters" };
        }
        if (users.some((u) => u.email.toLowerCase() === emailTrimmed)) {
          return { success: false, error: "Email already registered" };
        }

        const newUser: UserProfile = {
          id: generateId(),
          username: trimmed,
          email: emailTrimmed,
          password: data.password,
          profileImage: data.profileImage || "",
          createdAt: Date.now(),
          streak: createDefaultStreak(),
          rewards: createDefaultRewards(),
        };

        set({
          users: [...users, newUser],
          currentUser: newUser,
          isAuthenticated: true,
        });

        try {
          localStorage.setItem("kural-current-user", JSON.stringify(newUser));
        } catch {}

        return { success: true };
      },

      login: (email, password) => {
        const { users } = get();
        const emailTrimmed = email.trim().toLowerCase();
        const user = users.find((u) => u.email.toLowerCase() === emailTrimmed);

        if (!user) {
          return { success: false, error: "No account found with this email" };
        }
        if (user.password !== password) {
          return { success: false, error: "Incorrect password" };
        }

        const safe = { ...user, streak: user.streak || createDefaultStreak(), rewards: { ...(user.rewards || createDefaultRewards()), dailyTasks: getDailyTaskPool() } };
        set({ currentUser: safe, isAuthenticated: true });

        try {
          localStorage.setItem("kural-current-user", JSON.stringify(safe));
        } catch {}

        return { success: true };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
        try {
          localStorage.removeItem("kural-current-user");
        } catch {}
      },

      getCurrentUser: () => {
        return get().currentUser;
      },

      trackReading: () => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const streak = currentUser.streak || createDefaultStreak();
        const today = new Date().toISOString().split("T")[0];
        const { newStreak, newBest } = updateStreak(streak.lastReadDate, streak.readingStreak, streak.bestReadingStreak);
        const rewards = { ...(currentUser.rewards || createDefaultRewards()) };
        const claimed = [...rewards.claimedMilestones];
        let pts = rewards.points;
        for (const [day, ptsAward] of Object.entries(MILESTONE_REWARDS)) {
          const m = Number(day);
          if (newStreak >= m && !claimed.includes(m)) {
            claimed.push(m);
            pts += ptsAward;
          }
        }
        const updatedUser: UserProfile = {
          ...currentUser,
          streak: { ...streak, readingStreak: newStreak, bestReadingStreak: newBest, lastReadDate: today },
          rewards: { ...rewards, points: pts, level: getReaderLevel(pts), claimedMilestones: claimed },
        };
        set({
          currentUser: updatedUser,
          users: users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        });
        try {
          localStorage.setItem("kural-current-user", JSON.stringify(updatedUser));
        } catch {}
      },

      trackListening: () => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const streak = currentUser.streak || createDefaultStreak();
        const today = new Date().toISOString().split("T")[0];
        const { newStreak, newBest } = updateStreak(streak.lastListenDate, streak.listeningStreak, streak.bestListeningStreak);
        const rewards = { ...(currentUser.rewards || createDefaultRewards()) };
        const claimed = [...rewards.claimedMilestones];
        let pts = rewards.points;
        for (const [day, ptsAward] of Object.entries(MILESTONE_REWARDS)) {
          const m = Number(day);
          if (newStreak >= m && !claimed.includes(m)) {
            claimed.push(m);
            pts += ptsAward;
          }
        }
        const updatedUser: UserProfile = {
          ...currentUser,
          streak: { ...streak, listeningStreak: newStreak, bestListeningStreak: newBest, lastListenDate: today },
          rewards: { ...rewards, points: pts, level: getReaderLevel(pts), claimedMilestones: claimed },
        };
        set({
          currentUser: updatedUser,
          users: users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        });
        try {
          localStorage.setItem("kural-current-user", JSON.stringify(updatedUser));
        } catch {}
      },

      getStreaks: () => {
        const { currentUser } = get();
        return (currentUser?.streak) || createDefaultStreak();
      },

      addPoints: (amount) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const rewards = currentUser.rewards || createDefaultRewards();
        const newPoints = rewards.points + amount;
        const updatedUser: UserProfile = {
          ...currentUser,
          rewards: { ...rewards, points: newPoints, level: getReaderLevel(newPoints) },
        };
        set({
          currentUser: updatedUser,
          users: users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        });
        try {
          localStorage.setItem("kural-current-user", JSON.stringify(updatedUser));
        } catch {}
      },

      getReaderLevel,

      updateDailyTaskProgress: (taskId, increment) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const today = new Date().toISOString().split("T")[0];
        const rewards = { ...(currentUser.rewards || createDefaultRewards()) };
        if (rewards.lastDailyReset !== today) {
          rewards.dailyTasks = createDefaultDailyTasks();
          rewards.dailyCompletionBonusClaimed = false;
          rewards.lastDailyReset = today;
        }
        const taskIndex = rewards.dailyTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        const task = rewards.dailyTasks[taskIndex];
        if (task.completed && task.progress >= task.target) return;
        const newProgress = Math.min(task.progress + increment, task.target);
        const justCompleted = newProgress >= task.target && !task.completed;
        let pointsToAdd = justCompleted ? task.points : 0;
        const updatedTasks = rewards.dailyTasks.map((t, i) =>
          i === taskIndex ? { ...t, progress: newProgress, completed: justCompleted || t.completed } : t
        );
        const allDone = updatedTasks.every(t => t.completed);
        if (allDone && !rewards.dailyCompletionBonusClaimed) {
          pointsToAdd += 100;
          rewards.dailyCompletionBonusClaimed = true;
        }
        const newPoints = rewards.points + pointsToAdd;
        const updatedUser: UserProfile = {
          ...currentUser,
          rewards: {
            ...rewards,
            points: newPoints,
            level: getReaderLevel(newPoints),
            dailyTasks: updatedTasks,
          },
        };
        set({
          currentUser: updatedUser,
          users: users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        });
        try {
          localStorage.setItem("kural-current-user", JSON.stringify(updatedUser));
        } catch {}
      },

      claimMilestoneReward: (milestoneDay) => {
        const { currentUser, users } = get();
        if (!currentUser) return false;
        const streak = Math.max(currentUser.streak.readingStreak, currentUser.streak.listeningStreak);
        if (streak < milestoneDay) return false;
        const rewards = currentUser.rewards || createDefaultRewards();
        if (rewards.claimedMilestones.includes(milestoneDay)) return false;
        const milestonePoints = MILESTONE_REWARDS[milestoneDay] || 0;
        if (milestonePoints === 0) return false;
        const newPoints = rewards.points + milestonePoints;
        const updatedUser: UserProfile = {
          ...currentUser,
          rewards: {
            ...rewards,
            points: newPoints,
            level: getReaderLevel(newPoints),
            claimedMilestones: [...rewards.claimedMilestones, milestoneDay],
          },
        };
        set({
          currentUser: updatedUser,
          users: users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        });
        try {
          localStorage.setItem("kural-current-user", JSON.stringify(updatedUser));
        } catch {}
        return true;
      },

      changePassword: (currentPassword, newPassword) => {
        const { currentUser, users } = get();
        if (!currentUser) return { success: false, error: "Not logged in" };
        if (currentUser.password !== currentPassword) return { success: false, error: "Current password is incorrect" };
        const updatedUser: UserProfile = { ...currentUser, password: newPassword };
        set({
          currentUser: updatedUser,
          users: users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        });
        try {
          localStorage.setItem("kural-current-user", JSON.stringify(updatedUser));
        } catch {}
        return { success: true };
      },

      updateProfileImage: (url) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const updatedUser: UserProfile = { ...currentUser, profileImage: url };
        set({
          currentUser: updatedUser,
          users: users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        });
        try {
          localStorage.setItem("kural-current-user", JSON.stringify(updatedUser));
        } catch {}
      },

      removeProfileImage: () => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const updatedUser: UserProfile = { ...currentUser, profileImage: "" };
        set({
          currentUser: updatedUser,
          users: users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        });
        try {
          localStorage.setItem("kural-current-user", JSON.stringify(updatedUser));
        } catch {}
      },
    }),
    {
      name: "kural-user-storage",
      version: 5,
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persistedState: unknown, version: number) => {
        const persisted = asPersistedUserState(persistedState);
        if (version < 2) {
          const users = (persisted.users || []).map(normalizeUserProfile);
          const current = persisted.currentUser;
          const currentUser = current ? normalizeUserProfile(current) : null;
          return {
            ...persisted,
            users,
            currentUser,
          };
        }
        if (version < 3) {
          const users = (persisted.users || []).map(normalizeUserProfile);
          const current = persisted.currentUser;
          const currentUser = current ? normalizeUserProfile(current) : null;
          return {
            ...persisted,
            users,
            currentUser,
          };
        }
        if (version < 4) {
          const today = new Date().toISOString().split("T")[0];
          const users = (persisted.users || []).map((user) => resetUserDailyTasks(user, today));
          const current = persisted.currentUser;
          const currentUser = current ? resetUserDailyTasks(current, today) : null;
          return {
            ...persisted,
            users,  
            currentUser,
          };
        }
        if (version < 5) {
          const today = new Date().toISOString().split("T")[0];
          const users = (persisted.users || []).map((user) => resetUserDailyTasks(user, today));
          const current = persisted.currentUser;
          const currentUser = current ? resetUserDailyTasks(current, today) : null;
          return {
            ...persisted,
            users,
            currentUser,
          };
        }
        return persisted;
      },
    }
  )
);

export function bootstrapAuth(): UserProfile | null {
  try {
    const raw = localStorage.getItem("kural-current-user");
    if (raw) {
      const user = JSON.parse(raw) as UserProfile;
      const rewards = user.rewards || createDefaultRewards();
      const today = new Date().toISOString().split("T")[0];
      const freshTasks = getDailyTaskPool();
      const oldTasks = rewards.dailyTasks || [];

      const mergedTasks = freshTasks.map((fresh) => {
        const old = oldTasks.find((t) => t.id === fresh.id);
        if (old) {
          return { ...fresh, progress: old.progress, completed: old.completed };
        }
        return fresh;
      });

      const updatedUser: UserProfile = {
        ...user,
        streak: user.streak || createDefaultStreak(),
        rewards: {
          ...rewards,
          dailyTasks: mergedTasks,
          lastDailyReset: today,
        },
      };

      try {
        localStorage.setItem("kural-current-user", JSON.stringify(updatedUser));
      } catch {}

      return updatedUser;
    }
  } catch {}
  return null;
}
