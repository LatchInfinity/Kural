"use client";
import { useState, useEffect } from "react";
import { useUserStore, bootstrapAuth } from "@/store/user-store";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const currentUser = useUserStore((s) => s.currentUser);
  const [view, setView] = useState<"login" | "register">("login");
  const [checkingBrowserUser, setCheckingBrowserUser] = useState(true);

  useEffect(() => {
    const storeState = useUserStore.getState();

    if (storeState.currentUser && !storeState.isAuthenticated) {
      useUserStore.setState({ isAuthenticated: true });
      queueMicrotask(() => setCheckingBrowserUser(false));
      return;
    }

    if (!storeState.isAuthenticated) {
      const user = bootstrapAuth();
      if (user) {
        useUserStore.setState({ currentUser: user, isAuthenticated: true });
      }
    }

    queueMicrotask(() => setCheckingBrowserUser(false));
  }, []);

  if (checkingBrowserUser) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-6">
        <div className="kural-glass-panel max-w-sm w-full text-center p-8 rounded-[28px]">
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-accent text-white grid place-items-center font-black shadow-lg shadow-accent/20">
            K
          </div>
          <p className="text-sm font-bold text-foreground">Opening Kural</p>
          <p className="text-xs text-foreground-secondary/70 mt-1">Checking saved browser profile...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && currentUser) {
    return <>{children}</>;
  }

  if (view === "register") {
    return <RegisterForm onSwitch={() => setView("login")} />;
  }

  return <LoginForm onSwitch={() => setView("register")} />;
}
