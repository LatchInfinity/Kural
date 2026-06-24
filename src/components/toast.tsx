"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info } from "lucide-react";
import { useAppStore } from "@/store/app-store";

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);

  const iconMap = {
    success: <CheckCircle size={14} className="text-success" />,
    error: <XCircle size={14} className="text-accent" />,
    info: <Info size={14} className="text-foreground-secondary" />,
  };

  return (
    <div className="fixed top-20 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-md bg-surface border border-border shadow-sm"
          >
            {iconMap[toast.type]}
            <span className="text-xs font-medium text-foreground">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
