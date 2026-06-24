"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Lock, Eye, EyeOff } from "lucide-react";
import { useUserStore } from "@/store/user-store";

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const changePassword = useUserStore((s) => s.changePassword);
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
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-surface border border-border rounded-sm shadow-lg w-full max-w-xs mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Lock size={13} style={{ color: "var(--color-accent)" }} />
            <span className="text-xs font-semibold text-foreground">Change Password</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-sm text-foreground-secondary hover:text-foreground hover:bg-surface-highlight transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {success ? (
          <div className="px-4 py-6 text-center">
            <div className="text-xs font-semibold text-accent mb-1">✓ Password Changed</div>
            <div className="text-[10px] text-foreground-secondary/60">Your password has been updated successfully</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-semibold text-foreground-secondary/70 mb-1 block">Current Password</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={inputClass} placeholder="Enter current password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-secondary/40 hover:text-foreground-secondary cursor-pointer">
                  {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-foreground-secondary/70 mb-1 block">New Password</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} className={inputClass} placeholder="Minimum 8 characters" autoComplete="new-password" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-secondary/40 hover:text-foreground-secondary cursor-pointer">
                  {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-foreground-secondary/70 mb-1 block">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inputClass} placeholder="Re-enter new password" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-secondary/40 hover:text-foreground-secondary cursor-pointer">
                  {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            {error && <div className="text-[10px] text-red-500 text-center">{error}</div>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 px-3 py-1.5 text-xs text-foreground-secondary border border-border rounded-sm hover:bg-surface-highlight transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-accent rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
                {loading ? "Saving..." : "Save Password"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
