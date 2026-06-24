"use client";
import { useState } from "react";
import { useUserStore } from "@/store/user-store";

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const login = useUserStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    const result = login(email, password);
    if (!result.success) {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded bg-accent flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-black tracking-tight">K</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Welcome to Kural</h1>
          <p className="text-sm text-foreground-secondary/60 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-accent bg-accent/5 border border-accent/10 rounded-sm px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent-soft transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <p className="text-xs text-foreground-secondary/50 text-center mt-6">
          Don&apos;t have an account?{" "}
          <button onClick={onSwitch} className="text-accent font-semibold hover:underline cursor-pointer">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
