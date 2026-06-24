"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function SunMoon() {
  const [hour, setHour] = useState(new Date().getHours());
  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);
  const isMorning = hour >= 6 && hour <= 11;
  const isAfternoon = hour >= 12 && hour <= 16;
  const isEvening = hour === 17;
  const isNight = hour < 6 || hour >= 18;
  const isDay = !isNight;
  let label = "NIGHT";
  if (isMorning) label = "MORNING";
  else if (isAfternoon) label = "AFTERNOON";
  else if (isEvening) label = "EVENING";
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-start"
    >
      <div className="relative flex flex-col items-center">
        {isDay ? (
          isEvening ? (
            <motion.div animate={{ y: [-1, 1, -1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="15" r="5" fill="#FF8C42" />
                <circle cx="12" cy="15" r="3.5" fill="#FFD700" opacity="0.6" />
                <path d="M4 12a8 8 0 0 0 16 0" fill="rgba(255,140,66,0.12)" />
                <path d="M12 2v2M4 12H2M22 12h-2M7 7L5.5 5.5M17 7l1.5-1.5" stroke="#FF8C42" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </motion.div>
          ) : (
            <motion.div
              animate={{ y: [-2, 2, -2], rotate: 360 }}
              transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 60, repeat: Infinity, ease: "linear" } }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" fill="#FDB813" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                  <line key={a} x1="12" y1="1.5" x2="12" y2="4" stroke="#FDB813" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${a} 12 12)`} />
                ))}
              </svg>
            </motion.div>
          )
        ) : (
          <motion.div animate={{ y: [-2, 2, -2] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" fill="#d4d4f0" stroke="#b0b0d0" strokeWidth="0.5" />
            </svg>
          </motion.div>
        )}
        <motion.div
          className="absolute w-9 h-9 rounded-full pointer-events-none"
          animate={
            isNight
              ? { opacity: [0.06, 0.15, 0.06] }
              : { opacity: [0.1, 0.25, 0.1] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: isNight
              ? "radial-gradient(circle, rgba(180,180,240,0.12), transparent)"
              : isEvening
                ? "radial-gradient(circle, rgba(255,140,66,0.18), transparent)"
                : "radial-gradient(circle, rgba(253,184,19,0.2), transparent)",
          }}
        />
        <span className="text-[7px] font-semibold tracking-[2px] mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
          {label}
        </span>
      </div>
    </motion.div>
  );
}

export function DeskCalendar() {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const month = now.toLocaleDateString("en-US", { month: "long" });
  const day = now.getDate();
  const year = now.getFullYear();
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-end px-3.5 py-2 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div className="text-[12px] font-bold tracking-wide leading-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
        {weekday}
      </div>
      <div className="text-[9px] font-medium leading-tight mt-[1px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        {month} {day}, {year}
      </div>
    </motion.div>
  );
}

function createParticles() {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: 3 + Math.random() * 20,
    y: 3 + Math.random() * 30,
    size: 0.5 + Math.random() * 1,
    delay: Math.random() * 12,
    duration: 18 + Math.random() * 22,
    drift: (Math.random() - 0.5) * 15,
    yEnd: -(20 + Math.random() * 30),
  }));
}

function DustParticles() {
  const isNight = new Date().getHours() < 6 || new Date().getHours() >= 18;
  const [particles] = useState(createParticles);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: isNight ? "rgba(180,180,240,0.05)" : "rgba(255,215,140,0.06)",
          }}
          animate={{
            y: [0, p.yEnd, 0],
            x: [0, p.drift, 0],
            opacity: [0, 0.06, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function DeskEnvironment({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  return (
    <motion.div
      className="fixed inset-0 z-[5] pointer-events-none select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <DustParticles />
      <div className="absolute left-[4%] top-[5%]">
        <SunMoon />
      </div>
      <div className="absolute right-[4%] top-[5%]">
        <DeskCalendar />
      </div>
    </motion.div>
  );
}
