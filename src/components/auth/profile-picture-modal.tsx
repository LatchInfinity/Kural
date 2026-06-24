"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Camera, Trash2, Upload } from "lucide-react";
import { useUserStore } from "@/store/user-store";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SIZE = 5 * 1024 * 1024;

export default function ProfilePictureModal({ onClose }: { onClose: () => void }) {
  const currentUser = useUserStore((s) => s.currentUser);
  const updateProfileImage = useUserStore((s) => s.updateProfileImage);
  const removeProfileImage = useUserStore((s) => s.removeProfileImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setError("");
    if (!ACCEPT.includes(file.type)) {
      setError("Accepted formats: JPG, PNG, WebP");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File must be under 5MB");
      return;
    }
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

  const handleRemove = () => {
    removeProfileImage();
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const currentAvatar = currentUser?.profileImage;

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
            <Camera size={13} style={{ color: "var(--color-accent)" }} />
            <span className="text-xs font-semibold text-foreground">Profile Picture</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-sm text-foreground-secondary hover:text-foreground hover:bg-surface-highlight transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center gap-3">
          <div
            className={`w-20 h-20 rounded-full overflow-hidden bg-background border-2 border-dashed flex items-center justify-center transition-colors ${dragOver ? "border-accent bg-accent/5" : "border-border"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : currentAvatar ? (
              <img src={currentAvatar} alt="Current" className="w-full h-full object-cover" />
            ) : (
              <Camera size={22} style={{ color: "var(--color-foreground-secondary)", opacity: 0.3 }} />
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
            <div className="flex gap-2 w-full">
              <button onClick={handleUpload} disabled={loading} className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-accent rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
                {loading ? "Uploading..." : "Save"}
              </button>
              <button onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ""; }} className="px-3 py-1.5 text-xs text-foreground-secondary border border-border rounded-sm hover:bg-surface-highlight transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          )}

          {currentAvatar && !preview && (
            <button onClick={handleRemove} className="flex items-center gap-1 text-[10px] text-foreground-secondary/50 hover:text-red-500 transition-colors cursor-pointer">
              <Trash2 size={11} />
              Remove Image
            </button>
          )}

          {error && <div className="text-[10px] text-red-500 text-center">{error}</div>}
        </div>
      </motion.div>
    </div>
  );
}
