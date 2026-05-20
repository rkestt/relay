"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SkeletonGrid } from "@/components/ui/SkeletonCard";
import { logger } from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Map } from "@/types";

export default function LobbyMapPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [maps, setMaps] = useState<Map[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    logger.info("LobbyMapPage", "LobbyMapPage mount");
    params.then(({ code: c }) => setCode(c));
  }, [params]);

  // Load maps from Supabase
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase
      .from("maps")
      .select("*")
      .then(({ data }) => {
        const mapsData = (data ?? []) as Map[];
        logger.debug("LobbyMapPage", "Maps loaded", { count: mapsData.length });
        setMaps(mapsData);
      });
  }, []);

  // Resolve room_code → lobby_id + check leader + check existing map_id
  useEffect(() => {
    if (!code) return;

    const load = async () => {
      logger.debug("LobbyMapPage", "Resolve lobby start", { code });
      try {
        const supabase = createBrowserClient();

        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData?.user?.id ?? null;
        if (!currentUserId) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const { data: lobby } = await supabase
          .from("lobbies")
          .select("id, leader_id, phase, map_id")
          .eq("room_code", code)
          .single();

        if (!lobby) {
          logger.warn("LobbyMapPage", "Lobby not found", { code });
          setError("Lobby not found");
          setLoading(false);
          return;
        }

        setLobbyId(lobby.id);

        // If map_id is already set, redirect to lobby home
        if (lobby.map_id) {
          logger.info("LobbyMapPage", "Map already set, redirecting to lobby", { mapId: lobby.map_id });
          router.push(`/lobby/${code}`);
          return;
        }

        const leader = currentUserId === lobby.leader_id;
        setIsLeader(leader);

        if (!leader) {
          // Non-leader — stop loading, show waiting message
          setLoading(false);
          return;
        }
      } catch (err) {
        logger.error("LobbyMapPage", "Failed to resolve lobby", err);
        setError("Failed to load lobby");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [code, router]);

  // Submit selected map
  const handleConfirmMap = useCallback(async () => {
    if (!lobbyId || !selectedMapId) return;
    logger.info("LobbyMapPage", "Confirm map click", { lobbyId, selectedMapId });
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/lobby/${lobbyId}/set-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ map_id: selectedMapId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to set map");
      }
      logger.info("LobbyMapPage", "Map set successfully, redirecting", { code });
      router.push(`/lobby/${code}`);
    } catch (err) {
      logger.error("LobbyMapPage", "Confirm map failed", err);
      setError(err instanceof Error ? err.message : "Failed to set map");
    } finally {
      setSubmitting(false);
    }
  }, [lobbyId, selectedMapId, router, code]);

  // ── Loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="h-5 w-32 rounded bg-neutral-800 animate-pulse" />
          <div className="h-9 w-16 rounded-lg bg-neutral-800 animate-pulse" />
        </header>
        <div className="flex flex-col gap-4 p-5">
          <div className="h-4 w-24 rounded bg-neutral-800 animate-pulse" />
          <SkeletonGrid count={6} />
        </div>
      </div>
    );
  }

  // ── Non-leader waiting state ─────────────────────────
  if (!isLeader && lobbyId) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h1 className="text-base font-semibold text-neutral-50">Choose Map</h1>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50"
            onClick={() => router.push(`/lobby/${code}`)}
          >
            Back
          </Button>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-5">
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <svg
              className="size-5 text-neutral-500 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm font-medium text-neutral-400">
              Waiting for leader to choose the map…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────
  if (error && !lobbyId) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="h-5 w-24 rounded bg-neutral-800 animate-pulse" />
        </header>
        <EmptyState
          icon={
            <svg
              className="size-7 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          title="Failed to load"
          description={error}
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-[120px] rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={() => router.push(`/lobby/${code}`)}
            >
              Back to Lobby
            </Button>
          }
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-semibold text-neutral-50">Choose Map</h1>
          <p className="text-xs text-neutral-500">Room {code}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50"
          onClick={() => router.push(`/lobby/${code}`)}
        >
          Back
        </Button>
      </header>

      <div className="flex flex-col flex-1 gap-4 p-5 pb-8">
        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20">
            <svg
              className="size-4 text-red-400 flex-shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── Map Grid ─────────────────────────────────── */}
        {maps.length === 0 ? (
          <EmptyState
            title="No maps available"
            description="Maps will appear here once added to the database."
            className="py-16"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {maps.map((map, i) => (
              <button
                key={map.id}
                onClick={() => {
                  logger.info("LobbyMapPage", "Map selected", { mapId: map.id, mapName: map.name });
                  setSelectedMapId(map.id);
                  setError(null);
                }}
                className={cn(
                  "flex flex-col rounded-2xl overflow-hidden border text-left",
                  "transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/50",
                  "active:scale-[0.98] active:brightness-95",
                  selectedMapId === map.id
                    ? "border-amber-500 bg-neutral-800 shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]"
                    : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
                )}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="aspect-video bg-neutral-800 overflow-hidden">
                  {map.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={map.image_url}
                      alt={map.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <span className="text-sm font-semibold text-neutral-50">{map.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Confirm Button ───────────────────────────── */}
        <div className="mt-auto pt-4">
          <Button
            size="lg"
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
              "bg-amber-500 text-neutral-950",
              "hover:bg-amber-400 active:scale-[0.99]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              "shadow-[0_0_20px_-4px_rgba(245,158,11,0.25)]"
            )}
            onClick={handleConfirmMap}
            disabled={submitting || !selectedMapId}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="size-4 border-2 border-neutral-600 border-t-neutral-950 rounded-full animate-spin" />
                Confirming…
              </span>
            ) : (
              <>
                <svg
                  className="size-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Confirm Map
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
