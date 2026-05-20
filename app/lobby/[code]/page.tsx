"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { logger } from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLobbyRealtime } from "@/hooks/useLobbyRealtime";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import type { LobbyMember, Profile } from "@/types";

const ROOM_CODE_KEY = "r6hub_room_code";

interface LobbyState {
  lobby: {
    id: string;
    room_code: string;
    leader_id: string;
    phase: "waiting" | "playing" | "closed";
    map_id: string | null;
  };
  members: (LobbyMember & {
    profiles: Profile | null;
  })[];
  currentRound: { id: string; round_number: number; team_side: "attacker" | "defender" | null } | null;
  selections: unknown[];
  bans: {
    id: string;
    operator_id: string;
    side: "attacker" | "defender";
    operators: { id: string; name: string; side: "attacker" | "defender"; icon_url: string | null } | null;
  }[];
}

export default function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [state, setState] = useState<LobbyState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isLeader, setIsLeader, setLobbyId: storeSetLobbyId, setLobbyCode: storeSetLobbyCode } =
    useLobbyStore();

  // Resolve params
  useEffect(() => {
    logger.info("LobbyPage", "LobbyPage mount");
    params.then(({ code: c }) => setCode(c));
  }, [params]);

  // Fetch session
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const loadLobby = useCallback(async (roomCode: string) => {
    logger.debug("LobbyPage", "loadLobby start", { roomCode });
    const supabase = createBrowserClient();

    const { data: lobby } = await supabase
      .from("lobbies")
      .select("id, room_code, leader_id")
      .eq("room_code", roomCode)
      .single();

    if (!lobby) {
      logger.warn("LobbyPage", "loadLobby error - lobby not found", { roomCode });
      setError("Lobby not found.");
      setLoading(false);
      return;
    }

    setLobbyId(lobby.id);
    storeSetLobbyId(lobby.id);
    storeSetLobbyCode(roomCode);

    localStorage.setItem(ROOM_CODE_KEY, roomCode);
  }, [storeSetLobbyId, storeSetLobbyCode]);

  const refreshState = useCallback(async (lid: string) => {
    logger.debug("LobbyPage", "refreshState start", { lobbyId: lid });
    const res = await fetch(`/api/lobby/${lid}/state`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to fetch lobby state");
    }
    const data: LobbyState = await res.json();
    logger.info("LobbyPage", "refreshState ok", { lobbyId: lid, members: data.members.length });
    setState(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!code || !currentUserId) return;
    loadLobby(code);
  }, [code, currentUserId, loadLobby]);

  const { lastEventAt } = useLobbyRealtime(lobbyId);
  const { lastSync } = useHeartbeat(lobbyId);

  useEffect(() => {
    if (lobbyId && (lastEventAt || lastSync)) {
      refreshState(lobbyId);
    }
  }, [lobbyId, lastEventAt, lastSync]);

  useEffect(() => {
    if (state?.lobby && currentUserId) {
      setIsLeader(currentUserId === state.lobby.leader_id);
    }
  }, [currentUserId, state?.lobby?.leader_id, setIsLeader]);

  const handleLeave = useCallback(async () => {
    if (!lobbyId) return;
    if (!confirm("Leave this lobby?")) return;
    logger.info("LobbyPage", "Leave lobby", { lobbyId });
    try {
      await fetch(`/api/lobby/${lobbyId}/leave`, { method: "POST" });
      localStorage.removeItem(ROOM_CODE_KEY);
      router.push("/");
    } catch (err) {
      logger.error("LobbyPage", "Leave lobby failed", err);
      setError("Failed to leave lobby");
    }
  }, [lobbyId, router]);

  const handleNewRound = useCallback(async () => {
    if (!lobbyId) return;
    logger.info("LobbyPage", "New round click", { lobbyId });
    try {
      const res = await fetch(`/api/lobby/${lobbyId}/new-round`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      logger.debug("LobbyPage", "New round successful, refetching state");
      await refreshState(lobbyId);
    } catch (err) {
      logger.error("LobbyPage", "New round failed", err);
      setError(err instanceof Error ? err.message : "Failed to start new round");
    }
  }, [lobbyId, refreshState]);

  const handleStartGame = useCallback(async () => {
    if (!lobbyId) return;
    if (state?.members.length === 1) {
      if (!confirm("You are the only player. Start anyway?")) return;
    }
    logger.info("LobbyPage", "Start game click", { lobbyId });
    try {
      const res = await fetch(`/api/lobby/${lobbyId}/start`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      logger.debug("LobbyPage", "Start game successful, refetching state");
      await refreshState(lobbyId);
    } catch (err) {
      logger.error("LobbyPage", "Start game failed", err);
      setError(err instanceof Error ? err.message : "Failed to start game");
    }
  }, [lobbyId, refreshState, state?.members.length]);

  const handleSetBans = () => {
    logger.info("LobbyPage", "Set bans click", { code });
    router.push(`/lobby/${code}/bans`);
  };

  // ── Loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-16 rounded bg-neutral-800 animate-pulse" />
            <div className="h-2.5 w-12 rounded bg-neutral-800/60 animate-pulse" />
          </div>
          <div className="h-9 w-16 rounded-lg bg-neutral-800 animate-pulse" />
        </header>
        <div className="flex flex-col gap-6 p-5">
          <div className="h-4 w-28 rounded bg-neutral-800 animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-neutral-800 animate-pulse" />
            ))}
          </div>
          <div className="h-4 w-20 rounded bg-neutral-800 animate-pulse" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} className="p-4" lines={2} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────
  if (error || !state) {
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
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          title={error ?? "Failed to load lobby"}
          description="Check your connection and try again."
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-[120px] rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-all duration-200"
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>
          }
          className="flex-1"
        />
      </div>
    );
  }

  const bannedOperatorIds = new Set(state.bans.map((b) => b.operator_id));

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase">
              Room
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-neutral-50">
              {code}
            </span>
          </div>
          {state.currentRound ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600">
                Round {state.currentRound.round_number}
              </span>
              {state.currentRound.team_side && (
                <span className={cn(
                  "text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded",
                  state.currentRound.team_side === "attacker"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-sky-500/20 text-sky-400"
                )}>
                  {state.currentRound.team_side}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-neutral-600">Waiting for round…</span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-11 min-w-[80px] rounded-xl text-sm font-medium text-neutral-400 hover:bg-red-400/10 hover:text-red-400 transition-all duration-200 active:scale-95"
          onClick={handleLeave}
        >
          Leave
        </Button>
      </header>

      <div className="flex flex-col flex-1 gap-8 p-5 pb-8">

        {state.lobby.phase === "waiting" ? (
          /* ── WAITING ROOM ──────────────────────────────── */
          <>
            {/* ── Room Code Display ──────────────────────── */}
            <section className="flex flex-col items-center justify-center gap-3 py-8 animate-in fade-in duration-300">
              <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                Share this code with your squad
              </p>
              <button
                type="button"
                className="group relative"
                onClick={() => {
                  navigator.clipboard.writeText(code);
                }}
                title="Click to copy"
              >
                <span className="text-5xl sm:text-6xl font-mono font-black tracking-[0.15em] text-amber-400 select-all">
                  {code}
                </span>
                <span className="absolute -top-1 -right-1 flex items-center gap-1 text-[10px] font-medium text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </span>
              </button>
            </section>

            {/* ── Squad Members (reused) ────────────────── */}
            <section className="animate-in fade-in slide-in-from-bottom-3 duration-400">
              <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Squad
                <span className="ml-auto text-neutral-700 font-normal tracking-normal">
                  {state.members.length} member{state.members.length !== 1 ? "s" : ""}
                </span>
              </h2>

              {state.members.length === 0 ? (
                <EmptyState
                  title="No members yet"
                  description="Share the room code to invite your squad."
                  className="py-10"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {state.members.map((member, index) => {
                    const isMemberLeader = state.lobby.leader_id === member.user_id;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-neutral-900 border border-neutral-800 transition-all duration-200 hover:border-neutral-700 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center">
                          {member.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.profiles.avatar_url}
                              alt={member.profiles.username ?? "User"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-neutral-500">
                              {(member.profiles?.username ?? "?")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Name + badge */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-neutral-50 truncate">
                            {member.profiles?.username ?? "Unknown"}
                          </span>
                          {isMemberLeader && (
                            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                              <svg
                                className="size-3"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              Leader
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Start Game (leader) / Waiting (non-leader) ── */}
            {isLeader ? (
              <section className="flex flex-col gap-3 mt-auto pt-4 border-t border-neutral-800 animate-in fade-in duration-300">
                <p className="text-xs text-neutral-600 font-medium">
                  Squad Leader Actions
                </p>
                <Button
                  size="lg"
                  className={cn(
                    "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                    "bg-amber-500 text-neutral-950",
                    "hover:bg-amber-400 active:scale-[0.99]",
                    "transition-all duration-200",
                    "shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)]"
                  )}
                  onClick={handleStartGame}
                >
                  <svg
                    className="size-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Start Game
                </Button>
              </section>
            ) : (
              <section className="flex flex-col items-center justify-center gap-2 mt-auto pt-4 border-t border-neutral-800 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-neutral-500">
                  <svg
                    className="size-4 animate-pulse"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-sm font-medium">
                    Waiting for squad leader to start the game…
                  </span>
                </div>
              </section>
            )}
          </>
        ) : state.lobby.phase === 'playing' && !state.lobby.map_id ? (
          /* ── MAP SELECTION PENDING ─────────────────────── */
          <section className="flex flex-col items-center justify-center flex-1 gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-amber-400">
              <svg className="size-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 21 18 21 2 16 6 8 2 1 6" />
              </svg>
              <span className="text-sm font-semibold">Map Selection</span>
            </div>
            {isLeader ? (
              <Button
                size="lg"
                className={cn(
                  "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                  "bg-amber-500 text-neutral-950",
                  "hover:bg-amber-400 active:scale-[0.99]",
                  "transition-all duration-200",
                  "shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)]"
                )}
                onClick={() => router.push(`/lobby/${code}/map`)}
              >
                Choose Map
              </Button>
            ) : (
              <p className="text-sm text-neutral-500">
                Waiting for squad leader to choose the map…
              </p>
            )}
          </section>
        ) : (
          /* ── PLAYING PHASE (existing content) ──────────── */
          <>
            {/* ── Banned Operators ──────────────────────────── */}
            {state.bans.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-red-400 uppercase mb-3">
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  Banned Operators
                </h2>
                <div className="flex flex-wrap gap-2">
                  {state.bans.map((ban) =>
                    ban.operators ? (
                      <div
                        key={ban.id}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-red-400/20"
                      >
                        {ban.operators.icon_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ban.operators.icon_url}
                            alt={ban.operators.name}
                            className="w-6 h-6 rounded object-contain"
                          />
                        )}
                        <span className="text-xs font-medium text-neutral-50">
                          {ban.operators.name}
                        </span>
                        <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase">
                          Banned
                        </span>
                      </div>
                    ) : null
                  )}
                </div>
              </section>
            )}

            {/* ── Squad Members ─────────────────────────────── */}
            <section className="animate-in fade-in slide-in-from-bottom-3 duration-400">
              <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Squad
                <span className="ml-auto text-neutral-700 font-normal tracking-normal">
                  {state.members.length} member{state.members.length !== 1 ? "s" : ""}
                </span>
              </h2>

              {state.members.length === 0 ? (
                <EmptyState
                  title="No members yet"
                  description="Share the room code to invite your squad."
                  className="py-10"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {state.members.map((member, index) => {
                    const isMemberLeader = state.lobby.leader_id === member.user_id;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-neutral-900 border border-neutral-800 transition-all duration-200 hover:border-neutral-700 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center">
                          {member.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.profiles.avatar_url}
                              alt={member.profiles.username ?? "User"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-neutral-500">
                              {(member.profiles?.username ?? "?")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Name + badge */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-neutral-50 truncate">
                            {member.profiles?.username ?? "Unknown"}
                          </span>
                          {isMemberLeader && (
                            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                              <svg
                                className="size-3"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              Leader
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Selections ───────────────────────────────── */}
            {state.selections.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Selections
                </h2>
                <div className="flex flex-col gap-2">
                  {state.selections
                    .filter((s) => s && typeof s === "object")
                    .map((sel: unknown) => {
                      const selection = sel as {
                        user_id: string;
                        map_id: string | null;
                        operator_id: string | null;
                        locked_at: string | null;
                      };
                      const member = state.members.find(
                        (m) => m.user_id === selection.user_id
                      );
                      const isLocked = Boolean(selection.locked_at);
                      return (
                        <div
                          key={selection.user_id}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200",
                            isLocked
                              ? "bg-green-500/5 border-green-400/20"
                              : "bg-neutral-900 border-neutral-800"
                          )}
                        >
                          <span className="text-sm font-medium text-neutral-50 min-w-0 truncate">
                            {member?.profiles?.username ?? "Unknown"}
                          </span>
                          <span className="ml-auto text-xs text-neutral-500">
                            {selection.operator_id
                              ? `Op: ${selection.operator_id}`
                              : selection.map_id
                              ? `Map: ${selection.map_id}`
                              : "Choosing…"}
                          </span>
                          {isLocked && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 tracking-wider uppercase">
                              <svg
                                className="size-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              Locked
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            {/* ── Leader Controls ──────────────────────────── */}
            {isLeader && (
              <section className="flex flex-col gap-3 mt-auto pt-4 border-t border-neutral-800 animate-in fade-in duration-300">
                <p className="text-xs text-neutral-600 font-medium">
                  Squad Leader Actions
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "flex-1 h-12 rounded-xl text-sm font-semibold",
                      "border-amber-500/30 text-amber-400",
                      "hover:bg-amber-500/10 hover:text-amber-300",
                      "active:scale-[0.98] transition-all duration-200"
                    )}
                    onClick={handleSetBans}
                  >
                    <svg
                      className="size-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    Set Bans
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "flex-1 h-12 rounded-xl text-sm font-semibold",
                      "border-amber-500/30 text-amber-400",
                      "hover:bg-amber-500/10 hover:text-amber-300",
                      "active:scale-[0.98] transition-all duration-200"
                    )}
                    onClick={handleNewRound}
                  >
                    <svg
                      className="size-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    New Round
                  </Button>
                </div>
              </section>
            )}

            {/* ── Select Operator CTA ──────────────────────── */}
            <section className="mt-2">
              <Button
                size="lg"
                className={cn(
                  "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                  "bg-neutral-50 text-neutral-950",
                  "hover:bg-neutral-200 active:scale-[0.99]",
                  "transition-all duration-200",
                  "shadow-[0_0_24px_-4px_rgba(240,240,240,0.12)]"
                )}
                onClick={() => {
                  logger.info("LobbyPage", "Select operator click", { code });
                  router.push(`/lobby/${code}/select`);
                }}
              >
                Select Operator
              </Button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}