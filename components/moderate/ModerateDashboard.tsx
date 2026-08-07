"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch";

type ImageRow = { id: string; image_url: string; sort_order: number; caption: string | null };
type TagRow = { id: string; tag: string };
type OperatorRow = { operator_id: string };
type AuthorProfile = { username: string | null };

type Strategy = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: string;
  map_id: string;
  site_id: string;
  operator_id: string;
  side: string | null;
  created_by: string;
  created_at: string;
  strategy_tags?: TagRow[];
  strategy_images?: ImageRow[];
  strategy_operators?: OperatorRow[];
  profiles?: AuthorProfile[];
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ModerateDashboard() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/moderate");
      if (!res.ok) {
        setError(res.status === 403 ? "Not authorized to moderate." : "Failed to load.");
        setStrategies([]);
        return;
      }
      const data = await res.json();
      setStrategies(data.strategies ?? []);
    } catch {
      setError("Failed to load moderation queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, action: "approve" | "reject", reasonText = "") {
    setPendingAction(id);
    try {
      const res = await apiFetch(`/api/strategies/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasonText || undefined }),
      });
      if (res.status === 200) {
        // decided (or idempotent) → drop from queue
        setStrategies((prev) => prev.filter((s) => s.id !== id));
        setReason("");
        setRejectingId(null);
      } else if (res.status === 409 || res.status === 404) {
        // already decided elsewhere / gone → refresh
        setStrategies((prev) => prev.filter((s) => s.id !== id));
      } else if (res.status === 400) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Reason is required.");
      } else {
        setError("Failed to save decision.");
      }
    } catch {
      setError("Failed to save decision.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">Moderation</h1>
          <button
            onClick={load}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Refresh
          </button>
        </header>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && !error && strategies.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            — nothing pending —
          </p>
        )}

        <div className="space-y-3">
          {strategies.map((s) => (
            <article
              key={s.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{s.title}</h2>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {s.side && <span>{s.side}</span>}
                    <span>{timeAgo(s.created_at)}</span>
                    <span>
                      by {s.profiles?.[0]?.username ?? "unknown"}
                    </span>
                  </p>
                  {s.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                  {s.strategy_tags && s.strategy_tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.strategy_tags.map((t) => (
                        <span
                          key={t.id}
                          className="rounded bg-accent/40 px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {t.tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => decide(s.id, "approve")}
                  disabled={pendingAction === s.id}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => {
                    setRejectingId(rejectingId === s.id ? null : s.id);
                    setReason("");
                  }}
                  disabled={pendingAction === s.id}
                  className="rounded-lg border border-destructive px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  ✕ Reject
                </button>
              </div>

              {rejectingId === s.id && (
                <div className="mt-3">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (required, shown to the author)"
                    className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                    minLength={1}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setRejectingId(null)}
                      className="text-sm text-muted-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => decide(s.id, "reject", reason.trim())}
                      disabled={pendingAction === s.id || !reason.trim()}
                      className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
                    >
                      Reject strategy
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}