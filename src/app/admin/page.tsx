"use client";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentEdition } from "@/lib/editions";
import type { AdminStats, RSSSource, SyncLog } from "@/types";
import {
  RefreshCw, Activity, AlertTriangle, CheckCircle,
  Clock, ArrowLeft, Database, Radio, TrendingUp, Archive,
  MapPin, Play, Share2, Bookmark, Heart, Video,
} from "lucide-react";

const edition = getCurrentEdition();
const ADMIN_ENABLED = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_ADMIN === "true";

type BreakdownItem = { category?: string; district?: string; count: number };

function StatCard({ icon, label, value, color }: {
  icon: ReactNode; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-white border border-border rounded-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${color}15` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: "#888" }}>{label}</p>
        <p className="text-xl font-bold" style={{ color: "#1a1a1a" }}>{value}</p>
      </div>
    </div>
  );
}

function SourceRow({ source }: { source: RSSSource }) {
  const isHealthy = source.active && source.errorCount < 3;
  return (
    <div className="flex items-center justify-between py-2 px-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        {isHealthy ? (
          <CheckCircle size={12} style={{ color: "#16a34a" }} />
        ) : (
          <AlertTriangle size={12} style={{ color: "#dc2626" }} />
        )}
        <span className="text-xs font-medium" style={{ color: "#333" }}>{source.nameTa || source.name}</span>
      </div>
      <div className="flex items-center gap-3 text-[9px]" style={{ color: "#888" }}>
        <span>Errors: {source.errorCount}</span>
        <span>Last: {source.lastFetchedAt ? new Date(source.lastFetchedAt).toLocaleTimeString() : "never"}</span>
      </div>
    </div>
  );
}

function BreakdownPanel({
  title,
  icon,
  items,
  itemKey,
}: {
  title: string;
  icon: ReactNode;
  items: BreakdownItem[];
  itemKey: "category" | "district";
}) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white border border-border rounded-sm mb-6">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        {icon}
        <h2 className="text-[11px] font-bold" style={{ color: "#333" }}>{title}</h2>
        <span className="text-[9px] ml-auto" style={{ color: "#888" }}>{items.length} items</span>
      </div>
      <div className="divide-y divide-border text-[10px]">
        {items.map((item) => {
          const name = item[itemKey] || "Unknown";
          return (
            <div key={name} className="flex items-center justify-between px-3 py-1.5">
              <span style={{ color: "#444" }}>{name}</span>
              <span style={{ color: "#888" }}>{item.count} articles</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json() as AdminStats;
      setStats(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => { void fetchStats(); }, 0);
    return () => window.clearTimeout(id);
  }, [fetchStats]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/cron/sync-feeds");
      if (!res.ok) throw new Error("Sync failed");
      await fetchStats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  }, [fetchStats]);

  if (!ADMIN_ENABLED) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#f5f5f0" }}>
        <div className="max-w-md bg-white border border-border rounded-sm p-6 text-center">
          <AlertTriangle size={24} className="mx-auto mb-3" style={{ color: edition.accent }} />
          <h1 className="text-sm font-bold mb-2" style={{ color: "#1a1a1a" }}>Admin dashboard disabled</h1>
          <p className="text-xs leading-relaxed" style={{ color: "#666" }}>
            This page is hidden in production unless NEXT_PUBLIC_ENABLE_ADMIN=true is configured.
          </p>
          <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 rounded-sm text-white text-xs font-semibold" style={{ background: edition.accent }}>
            Back to site
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f0" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${edition.accent}`, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f0" }}>
      <div className="border-b border-border" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-border cursor-pointer"
              style={{ background: "#fff" }}>
              <ArrowLeft size={14} style={{ color: "#555" }} />
            </button>
            <div>
              <h1 className="text-sm font-bold" style={{ color: "#1a1a1a" }}>News Management Panel</h1>
              <p className="text-[10px]" style={{ color: "#888" }}>Developer-only RSS dashboard</p>
            </div>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-white text-[10px] font-semibold cursor-pointer disabled:opacity-50"
            style={{ background: edition.accent }}>
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm mb-4 text-[11px] font-medium"
            style={{ background: "#fef2f2", color: "#dc2626" }}>
            <AlertTriangle size={12} />
            {error}
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <StatCard icon={<Database size={16} />} label="Total Articles" value={stats.totalArticles} color={edition.accent} />
              <StatCard icon={<Radio size={16} />} label="Today" value={stats.todayArticles} color="#2563eb" />
              <StatCard icon={<TrendingUp size={16} />} label="Breaking" value={stats.breakingCount} color="#dc2626" />
              <StatCard icon={<Activity size={16} />} label="Recent" value={stats.recentCount} color="#d97706" />
              <StatCard icon={<Archive size={16} />} label="Archived" value={stats.archivedCount} color="#64748b" />
              <StatCard icon={<CheckCircle size={16} />} label="Healthy Sources" value={`${stats.healthySources}/${stats.sources.length}`} color="#16a34a" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={<Play size={16} />} label="Total Plays" value={stats.totalPlays ?? 0} color="#16a34a" />
              <StatCard icon={<Share2 size={16} />} label="Total Shares" value={stats.totalShares ?? 0} color="#2563eb" />
              <StatCard icon={<Bookmark size={16} />} label="Total Saves" value={stats.totalSaves ?? 0} color="#d97706" />
              <StatCard icon={<Heart size={16} />} label="Total Reactions" value={stats.totalReactions ?? 0} color="#e11d48" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <StatCard icon={<Video size={16} />} label="Videos Ready" value={stats.videoCompletedCount ?? 0} color="#0f766e" />
              <StatCard icon={<Clock size={16} />} label="Videos Pending" value={stats.videoPendingCount ?? 0} color="#d97706" />
              <StatCard icon={<AlertTriangle size={16} />} label="Videos Failed" value={stats.videoFailedCount ?? 0} color="#dc2626" />
            </div>

            <BreakdownPanel title="District Coverage" icon={<MapPin size={12} style={{ color: edition.accent }} />} items={stats.districtBreakdown ?? []} itemKey="district" />
            <BreakdownPanel title="Category Breakdown" icon={<Database size={12} style={{ color: edition.accent }} />} items={stats.categoryBreakdown ?? []} itemKey="category" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-border rounded-sm">
                <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                  <Radio size={12} style={{ color: edition.accent }} />
                  <h2 className="text-[11px] font-bold" style={{ color: "#333" }}>RSS Sources</h2>
                  <span className="text-[9px] ml-auto" style={{ color: "#888" }}>{stats.sources.length} sources</span>
                </div>
                <div className="p-1">
                  {stats.sources.map((source) => (
                    <SourceRow key={source.id} source={source} />
                  ))}
                </div>
              </div>

              <div className="bg-white border border-border rounded-sm">
                <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                  <Clock size={12} style={{ color: edition.accent }} />
                  <h2 className="text-[11px] font-bold" style={{ color: "#333" }}>Recent Syncs</h2>
                  <span className="text-[9px] ml-auto" style={{ color: "#888" }}>Last: {stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : "never"}</span>
                </div>
                <div className="divide-y divide-border text-[10px]" style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {stats.recentSyncs.length === 0 ? (
                    <div className="p-4 text-center" style={{ color: "#aaa" }}>No syncs yet</div>
                  ) : (
                    stats.recentSyncs.slice(0, 15).map((log: SyncLog) => (
                      <div key={log.id} className="flex items-center justify-between px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          {log.status === "success" ? (
                            <CheckCircle size={10} style={{ color: "#16a34a" }} />
                          ) : log.status === "error" ? (
                            <AlertTriangle size={10} style={{ color: "#dc2626" }} />
                          ) : (
                            <RefreshCw size={10} className="animate-spin" style={{ color: "#d97706" }} />
                          )}
                          <span style={{ color: "#444" }}>{log.sourceName || "Full Sync"}</span>
                        </div>
                        <div className="flex items-center gap-3" style={{ color: "#888" }}>
                          <span>+{log.articlesNew} new</span>
                          <span>{log.articlesFound} found</span>
                          <span>{new Date(log.startedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {stats.feedErrors.length > 0 && (
              <div className="bg-white border border-border rounded-sm">
                <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                  <AlertTriangle size={12} style={{ color: "#dc2626" }} />
                  <h2 className="text-[11px] font-bold" style={{ color: "#333" }}>Feed Errors</h2>
                </div>
                <div className="divide-y divide-border text-[10px]">
                  {stats.feedErrors.slice(0, 10).map((feedError) => (
                    <div key={`${feedError.sourceName}-${feedError.occurredAt}`} className="flex items-center justify-between px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: "#444" }}>{feedError.sourceName}</span>
                        <span style={{ color: "#888" }}>{feedError.errorMessage}</span>
                      </div>
                      <span style={{ color: "#aaa" }}>{new Date(feedError.occurredAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
