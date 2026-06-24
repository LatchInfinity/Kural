"use client";
import { useState, useRef } from "react";
import { useUserStore } from "@/store/user-store";
import { Upload } from "lucide-react";

export default function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const register = useUserStore((s) => s.register);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    const result = register({ username, email, password, profileImage: profileImage || undefined });
    if (!result.success) {
      setError(result.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded bg-accent flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-black tracking-tight">K</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Join Kural</h1>
          <p className="text-sm text-foreground-secondary/60 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-surface-highlight border border-border flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={18} className="text-foreground-secondary/40" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center cursor-pointer"
              >
                <span className="text-[9px] font-bold">+</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder-foreground-secondary/40 outline-none focus:border-accent/50 transition-colors"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder-foreground-secondary/40 outline-none focus:border-accent/50 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder-foreground-secondary/40 outline-none focus:border-accent/50 transition-colors"
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <p className="text-xs text-accent bg-accent/5 border border-accent/10 rounded-sm px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent-soft transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </form>

        <p className="text-xs text-foreground-secondary/50 text-center mt-6">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-accent font-semibold hover:underline cursor-pointer">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
