"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SkeletonGrid } from "@/components/ui/SkeletonCard";
import { logger } from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyState";
import Image from "next/image";
import type { Map } from "@/types";
import { AlertIcon, CheckIcon } from "@/components/icons";

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
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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
      logger.info("LobbyMapPage", "Map set successfully, redirecting to lobby", { code });
      setConfirmed(true);
      // Brief feedback before redirect
      timerRef.current = setTimeout(() => {
        router.push(`/lobby/${code}`);
      }, 800);
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
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground" aria-busy="true">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="h-9 w-16 rounded-lg bg-muted animate-pulse" />
        </header>
        <div className="flex flex-col gap-4 p-5">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <SkeletonGrid count={6} />
        </div>
      </div>
    );
  }

  // ── Non-leader waiting state ─────────────────────────
  if (!isLeader && lobbyId) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h1 className="text-base font-semibold text-foreground">Choose Map</h1>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => router.push(`/lobby/${code}`)}
          >
            Back
          </Button>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-5">
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-card border border-border">
            <svg
              className="size-5 text-muted-foreground animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm font-medium text-muted-foreground">
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
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        </header>
        <EmptyState
          icon={
            <AlertIcon className="size-7 text-destructive" />
          }
          title="Failed to load"
          description={error}
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-[120px] rounded-xl"
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
    <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h1 className="text-base font-semibold text-foreground">Choose Map</h1>
          <p className="text-xs text-muted-foreground">Room {code}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => router.push(`/lobby/${code}`)}
        >
          Back
        </Button>
      </header>

      <div className="flex flex-col flex-1 gap-4 p-5 pb-8">
        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20" role="alert" aria-live="polite">
            <AlertIcon className="size-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {maps.map((map, i) => {
              const isSelected = selectedMapId === map.id;
              return (
                <button
                  key={map.id}
                  onClick={() => {
                    if (submitting || confirmed) return;
                    logger.info("LobbyMapPage", "Map selected", { mapId: map.id, mapName: map.name });
                    setSelectedMapId(map.id);
                    setError(null);
                  }}
                  disabled={submitting || confirmed}
                  className={cn(
                    "group flex flex-col rounded-2xl overflow-hidden border text-left",
                    "transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "active:scale-[0.98]",
                    isSelected
                      ? "ring-2 ring-primary bg-card shadow-[0_0_16px_-4px_oklch(0.65_0.22_25_/_0.3)]"
                      : "border-border bg-card hover:border-border/80 hover:bg-card/80"
                  )}
                  style={{ animationDelay: `${i * 30}ms` }}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `${map.name} (selected)` : map.name}
                >
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    {map.image_url ? (
                      <Image
                        src={map.image_url}
                        alt={map.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                    {/* Selected checkmark overlay */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <CheckIcon className="size-4 text-primary-foreground" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <span className="text-sm font-semibold text-foreground">{map.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Confirm Button ───────────────────────────── */}
        <div className="mt-auto pt-4">
          {confirmed ? (
            <div className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-success/10 border border-success/20 text-success text-sm font-semibold animate-in fade-in">
              <CheckIcon className="size-5" strokeWidth={2.5} />
              Map confirmed! Redirecting…
            </div>
          ) : (
            <Button
              size="lg"
              className={cn(
                "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                "bg-primary text-primary-foreground",
                "hover:bg-primary-hover active:scale-[0.99]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "shadow-[0_0_20px_-4px_oklch(0.65_0.22_25_/_0.35)]"
              )}
              onClick={handleConfirmMap}
              disabled={submitting || !selectedMapId || confirmed}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
          )}
        </div>
      </div>
    </div>
  );
}
