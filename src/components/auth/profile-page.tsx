"use client";
import { useState, useRef } from "react";
import { useUserStore } from "@/store/user-store";
import { User, Flame, Camera, Lock, Trash2, Upload, X, Eye, EyeOff, Star, Trophy, Target } from "lucide-react";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SIZE = 5 * 1024 * 1024;

const taskIcons: Record<string, React.ReactNode> = {
  "listen-articles": <Star size={13} />,
  "listen-duration": <Flame size={13} />,
  "listen-categories": <Target size={13} />,
  "save-articles": <Trophy size={13} />,
  "share-article": <Target size={13} />,
};

export default function ProfilePage() {
  const currentUser = useUserStore((s) => s.currentUser);
  const streaks = useUserStore((s) => s.getStreaks)();
  const logout = useUserStore((s) => s.logout);
  const changePassword = useUserStore((s) => s.changePassword);
  const updateProfileImage = useUserStore((s) => s.updateProfileImage);
  const removeProfileImage = useUserStore((s) => s.removeProfileImage);

  const [activeSection, setActiveSection] = useState<"profile" | "streak">("profile");

  if (!currentUser) return null;

  const tasks = currentUser.rewards?.dailyTasks ?? [];
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="notranslate max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen" translate="no">
      <div className="flex items-center gap-2 mb-6">
        <User size={16} className="text-accent" />
        <h1 className="text-lg font-bold tracking-tight text-foreground">Profile</h1>
        <div className="h-[1px] flex-1" style={{ background: "linear-gradient(90deg, var(--color-accent)30, transparent)" }} />
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveSection("profile")}
          className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-sm transition-all cursor-pointer text-center"
          style={{
            background: activeSection === "profile" ? "var(--color-accent)" : "var(--color-accent-muted)",
            color: activeSection === "profile" ? "#fff" : "var(--color-accent)",
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveSection("streak")}
          className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-sm transition-all cursor-pointer text-center"
          style={{
            background: activeSection === "streak" ? "var(--color-accent)" : "var(--color-accent-muted)",
            color: activeSection === "streak" ? "#fff" : "var(--color-accent)",
          }}
        >
          Streak & Tasks
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeSection === "profile" && (
          <div className="md:col-span-2">
            <ProfileSection
              currentUser={currentUser}
              changePassword={changePassword}
              updateProfileImage={updateProfileImage}
              removeProfileImage={removeProfileImage}
              logout={logout}
            />
          </div>
        )}

        {activeSection === "streak" && (
          <div className="md:col-span-2">
            <StreakSection
              currentStreak={streaks.listeningStreak}
              bestStreak={streaks.bestListeningStreak}
              totalPoints={currentUser.rewards?.points ?? 0}
              tasks={tasks}
              completedTasks={completedTasks}
              totalTasks={totalTasks}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSection({
  currentUser, changePassword, updateProfileImage, removeProfileImage, logout,
}: {
  currentUser: NonNullable<ReturnType<typeof useUserStore.getState>["currentUser"]>;
  changePassword: (current: string, newPw: string) => { success: boolean; error?: string };
  updateProfileImage: (url: string) => void;
  removeProfileImage: () => void;
  logout: () => void;
}) {
  const [showPwModal, setShowPwModal] = useState(false);
  const [showPicModal, setShowPicModal] = useState(false);

  const avatar = currentUser.profileImage || currentUser.username[0].toUpperCase();
  const isImage = currentUser.profileImage.length > 0;

  return (
    <div className="bg-surface border border-border rounded-sm">
      <div className="p-6 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
            {isImage ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-accent">{avatar}</span>
            )}
          </div>
          <button
            onClick={() => setShowPicModal(true)}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center hover:bg-accent-soft transition-colors cursor-pointer"
          >
            <Camera size={12} className="text-white" />
          </button>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{currentUser.username}</p>
          <p className="text-xs text-foreground-secondary/60 mt-0.5">{currentUser.email}</p>
        </div>
        <div className="flex gap-2 w-full max-w-xs">
          <button
            onClick={() => setShowPwModal(true)}
            className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 text-xs font-semibold text-accent border border-accent/30 rounded-sm hover:bg-accent/5 transition-colors cursor-pointer"
          >
            <Lock size={12} />
            Change Password
          </button>
          <button
            onClick={() => { logout(); }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-foreground-secondary border border-border rounded-sm hover:bg-surface-highlight transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {showPwModal && (
        <ChangePasswordInline onClose={() => setShowPwModal(false)} changePassword={changePassword} />
      )}

      {showPicModal && (
        <ProfilePictureInline
          currentAvatar={currentUser.profileImage}
          onClose={() => setShowPicModal(false)}
          updateProfileImage={updateProfileImage}
          removeProfileImage={removeProfileImage}
        />
      )}
    </div>
  );
}

function ChangePasswordInline({ onClose, changePassword }: {
  onClose: () => void;
  changePassword: (current: string, newPw: string) => { success: boolean; error?: string };
}) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!currentPw) { setError("Enter current password"); return; }
    if (newPw.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match"); return; }
    setLoading(true);
    const result = await changePassword(currentPw, newPw);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to change password");
    } else {
      setSuccess(true);
      setTimeout(onClose, 1500);
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-sm px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent transition-colors pr-8";

  return (
    <div className="border-t border-border p-4">
      {success ? (
        <div className="text-center py-4">
          <div className="text-xs font-semibold text-accent mb-1">✓ Password Changed</div>
          <div className="text-[10px] text-foreground-secondary/60">Your password has been updated successfully</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={12} style={{ color: "var(--color-accent)" }} />
            <span className="text-xs font-semibold text-foreground">Change Password</span>
            <button type="button" onClick={onClose} className="ml-auto p-1 rounded-sm text-foreground-secondary hover:text-foreground hover:bg-surface-highlight transition-colors cursor-pointer">
              <X size={12} />
            </button>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-foreground-secondary/70 mb-1 block">Current Password</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={inputClass} placeholder="Enter current password" autoComplete="current-password" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-secondary/40 hover:text-foreground-secondary cursor-pointer">
                {showCurrent ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-foreground-secondary/70 mb-1 block">New Password</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} className={inputClass} placeholder="Minimum 8 characters" autoComplete="new-password" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-secondary/40 hover:text-foreground-secondary cursor-pointer">
                {showNew ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-foreground-secondary/70 mb-1 block">Confirm Password</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inputClass} placeholder="Re-enter new password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-secondary/40 hover:text-foreground-secondary cursor-pointer">
                {showConfirm ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>
          {error && <div className="text-[10px] text-red-500 text-center">{error}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 px-3 py-1.5 text-xs text-foreground-secondary border border-border rounded-sm hover:bg-surface-highlight transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-accent rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
              {loading ? "Saving..." : "Save Password"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ProfilePictureInline({ currentAvatar, onClose, updateProfileImage, removeProfileImage }: {
  currentAvatar: string;
  onClose: () => void;
  updateProfileImage: (url: string) => void;
  removeProfileImage: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setError("");
    if (!ACCEPT.includes(file.type)) { setError("Accepted formats: JPG, PNG, WebP"); return; }
    if (file.size > MAX_SIZE) { setError("File must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || !inputRef.current?.files?.[0]) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", inputRef.current.files[0]);
    try {
      const res = await fetch("/api/upload/profile", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload failed"); setLoading(false); return; }
      updateProfileImage(data.url);
      onClose();
    } catch {
      setError("Upload failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Camera size={12} style={{ color: "var(--color-accent)" }} />
        <span className="text-xs font-semibold text-foreground">Profile Picture</span>
        <button type="button" onClick={onClose} className="ml-auto p-1 rounded-sm text-foreground-secondary hover:text-foreground hover:bg-surface-highlight transition-colors cursor-pointer">
          <X size={12} />
        </button>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div
          className={`w-20 h-20 rounded-full overflow-hidden bg-background border-2 border-dashed flex items-center justify-center transition-colors ${dragOver ? "border-accent bg-accent/5" : "border-border"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : currentAvatar ? (
            <img src={currentAvatar} alt="Current" className="w-full h-full object-cover" />
          ) : (
            <Camera size={20} style={{ color: "var(--color-foreground-secondary)", opacity: 0.3 }} />
          )}
        </div>
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {!preview && (
          <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-accent border border-accent/30 rounded-sm hover:bg-accent/5 transition-colors cursor-pointer">
            <Upload size={12} />
            Choose Image
          </button>
        )}
        {preview && (
          <div className="flex gap-2 w-full max-w-xs">
            <button onClick={handleUpload} disabled={loading} className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-accent rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
              {loading ? "Uploading..." : "Save"}
            </button>
            <button onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ""; }} className="px-3 py-1.5 text-xs text-foreground-secondary border border-border rounded-sm hover:bg-surface-highlight transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        )}
        {currentAvatar && !preview && (
          <button onClick={() => { removeProfileImage(); onClose(); }} className="flex items-center gap-1 text-[10px] text-foreground-secondary/50 hover:text-red-500 transition-colors cursor-pointer">
            <Trash2 size={11} />
            Remove Image
          </button>
        )}
        {error && <div className="text-[10px] text-red-500 text-center">{error}</div>}
      </div>
    </div>
  );
}

function StreakSection({ currentStreak, bestStreak, totalPoints, tasks, completedTasks, totalTasks }: {
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
  tasks: { id: string; label: string; points: number; progress: number; target: number; completed: boolean }[];
  completedTasks: number;
  totalTasks: number;
}) {
  return (
    <div className="bg-surface border border-border rounded-sm">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} style={{ color: "var(--color-breaking)" }} />
          <span className="text-xs font-bold text-foreground">Streak & Points</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col items-center py-2 px-2 rounded-sm bg-accent/5">
            <Flame size={16} style={{ color: "var(--color-breaking)" }} />
            <span className="text-lg font-bold text-foreground mt-0.5">{currentStreak}</span>
            <span className="text-[9px] text-foreground-secondary/60">Current</span>
          </div>
          <div className="flex flex-col items-center py-2 px-2 rounded-sm bg-accent/5">
            <Star size={16} style={{ color: "var(--color-accent)" }} />
            <span className="text-lg font-bold text-foreground mt-0.5">{totalPoints}</span>
            <span className="text-[9px] text-foreground-secondary/60">Points</span>
          </div>
          <div className="flex flex-col items-center py-2 px-2 rounded-sm bg-accent/5">
            <Trophy size={16} style={{ color: "var(--color-accent)" }} />
            <span className="text-lg font-bold text-foreground mt-0.5">{bestStreak}</span>
            <span className="text-[9px] text-foreground-secondary/60">Best</span>
          </div>
        </div>
      </div>

      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-1.5 mb-2">
          <Target size={13} style={{ color: "var(--color-accent)" }} />
          <span className="text-[10px] font-semibold text-foreground-secondary/80">Today&apos;s Progress</span>
          <span className="ml-auto text-[10px] font-bold text-foreground-secondary/60">{completedTasks}/{totalTasks}</span>
        </div>
        <div className="w-full h-2 bg-background rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{
            width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
            background: "var(--color-accent)",
          }} />
        </div>
      </div>

      <div className="p-5">
        <div className="text-[9px] font-semibold text-foreground-secondary/50 uppercase tracking-wider mb-3">Daily Missions</div>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => {
            const pct = task.target > 0 ? Math.round((task.progress / task.target) * 100) : 0;
            return (
              <div key={task.id} className="px-3 py-2 rounded-sm bg-background border border-border">
                <div className="flex items-center gap-2">
                  <span style={{ opacity: task.completed ? 1 : 0.4, color: "var(--color-accent)" }}>
                    {taskIcons[task.id]}
                  </span>
                  <span className={`text-[11px] flex-1 ${task.completed ? "text-foreground line-through opacity-50" : "text-foreground-secondary/80"}`}>
                    {task.label}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: task.completed ? "var(--color-accent)" : "var(--color-foreground-secondary)" }}>
                    +{task.points}
                  </span>
                </div>
                <div className="mt-1.5 w-full h-1.5 bg-background rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{
                    width: `${pct}%`,
                    background: task.completed ? "var(--color-accent)" : "var(--color-foreground-secondary)",
                    opacity: task.completed ? 1 : 0.2,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
