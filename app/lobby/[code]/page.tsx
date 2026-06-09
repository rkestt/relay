"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import type { LobbyMember, Operator, Profile } from "@/types";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertIcon, CheckIcon, CopyIcon, CrownIcon, MapIcon, UsersIcon } from "@/components/icons";
import Image from "next/image";

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
  const [copied, setCopied] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);

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
    }, (reason) => logger.error("LobbyPage", "Session fetch failed", reason));
  }, []);

  // Fetch operators
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.from("operators").select("*").then(({ data }) => {
      if (data) setOperators(data as Operator[]);
    }, (reason) => logger.error("LobbyPage", "Operators fetch failed", reason));
  }, []);

  const loadLobby = useCallback(async (roomCode: string) => {
    logger.debug("LobbyPage", "loadLobby start", { roomCode });
    try {
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
    } catch (err) {
      logger.error("LobbyPage", "loadLobby failed", err);
      setError(err instanceof Error ? err.message : "Failed to load lobby");
      setLoading(false);
    }
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

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy room code");
    }
  }, [code]);

  const handleLeave = useCallback(() => {
    if (!lobbyId) return;
    setShowLeaveConfirm(true);
  }, [lobbyId]);

  const confirmLeave = useCallback(async () => {
    if (!lobbyId) return;
    setShowLeaveConfirm(false);
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
      setShowStartConfirm(true);
      return;
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

  const confirmStartGame = useCallback(async () => {
    if (!lobbyId) return;
    setShowStartConfirm(false);
    logger.info("LobbyPage", "Start game confirmed (solo)", { lobbyId });
    try {
      const res = await fetch(`/api/lobby/${lobbyId}/start`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await refreshState(lobbyId);
    } catch (err) {
      logger.error("LobbyPage", "Start game failed", err);
      setError(err instanceof Error ? err.message : "Failed to start game");
    }
  }, [lobbyId, refreshState]);

  const handleSetBans = () => {
    logger.info("LobbyPage", "Set bans click", { code });
    router.push(`/lobby/${code}/bans`);
  };

  // ── Phase label helper ─────────────────────────────
  const phaseLabel = (() => {
    if (!state?.lobby) return null;
    switch (state.lobby.phase) {
      case "waiting": return { label: "Waiting Room", color: "text-muted-foreground" };
      case "playing": return state.lobby.map_id
        ? { label: "In Game", color: "text-success" }
        : { label: "Map Selection", color: "text-primary" };
      case "closed": return { label: "Closed", color: "text-destructive" };
      default: return null;
    }
  })();

  // ── Loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground" aria-busy="true">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-12 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="h-9 w-16 rounded-lg bg-muted animate-pulse" />
        </header>
        <div className="flex flex-col gap-6 p-5">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
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
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        </header>
        <EmptyState
          icon={
            <AlertIcon className="size-7 text-destructive" />
          }
          title={error ?? "Failed to load lobby"}
          description={error ? "Check your connection and try again." : "Lobby data unavailable."}
          action={
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-11 min-w-[120px] rounded-xl"
                onClick={() => router.push("/")}
              >
                Back to Home
              </Button>
              {error && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-11 min-w-[120px] rounded-xl"
                  onClick={() => { setError(null); setLoading(true); if (code) loadLobby(code); }}
                >
                  Retry
                </Button>
              )}
            </div>
          }
          className="flex-1"
        />
      </div>
    );
  }

  const bannedOperatorIds = new Set(state.bans.map((b) => b.operator_id));
  const operatorMap = useMemo(() =>
    new Map(operators.map(op => [op.id, op.name])),
    [operators]
  );

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase">
                Room
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-foreground">
                {code}
              </span>
            </div>
            {/* Phase indicator */}
            {phaseLabel && (
              <span className={cn(
                "text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-card border border-border",
                phaseLabel.color
              )}>
                {phaseLabel.label}
              </span>
            )}
          </div>
          {state.currentRound ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Round {state.currentRound.round_number}
              </span>
              {state.currentRound.team_side && (
                <span className={cn(
                  "text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded",
                  state.currentRound.team_side === "attacker"
                    ? "bg-attacker/20 text-attacker"
                    : "bg-defender/20 text-defender"
                )}>
                  {state.currentRound.team_side}
                </span>
              )}
            </div>
          ) : state.lobby.phase === "waiting" ? (
            <span className="text-xs text-muted-foreground">Waiting for players…</span>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-11 min-w-[80px] rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 active:scale-95"
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
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Share this code with your squad
              </p>
              <div className="flex items-center gap-3">
                <span className="text-5xl sm:text-6xl font-mono font-black tracking-[0.15em] text-primary select-all">
                  {code}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="w-12 h-12 rounded-xl"
                  aria-label={copied ? "Code copied" : "Copy room code"}
                >
                  {copied ? (
                    <CheckIcon className="size-5 text-success" />
                  ) : (
                    <CopyIcon className="size-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {copied && (
                <span className="text-xs text-success font-medium animate-in fade-in" role="status" aria-live="polite">
                  Copied!
                </span>
              )}
            </section>

            {/* ── Squad Members ────────────────────────── */}
            <section className="animate-in fade-in slide-in-from-bottom-3 duration-400">
              <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                <UsersIcon className="size-3.5" />
                Squad
                <span className="ml-auto text-muted-foreground font-normal tracking-normal">
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
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-card border border-border transition-all duration-200 hover:border-border/80 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center relative">
                          {member.profiles?.avatar_url ? (
                            <Image
                              src={member.profiles.avatar_url}
                              alt={member.profiles.username ?? "User"}
                              fill
                              sizes="44px"
                              className="object-cover"
                              unoptimized={member.profiles.avatar_url.startsWith('blob:') || member.profiles.avatar_url.startsWith('data:')}
                            />
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">
                              {(member.profiles?.username ?? "?")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Name + badge */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {member.profiles?.username ?? "Unknown"}
                          </span>
                          {isMemberLeader && (
                            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-warning uppercase">
                              <CrownIcon className="size-3" />
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
              <section className="flex flex-col gap-3 mt-auto pt-4 border-t border-border animate-in fade-in duration-300">
                <p className="text-xs text-muted-foreground font-medium">
                  Squad Leader Actions
                </p>
                <Button
                  size="lg"
                  className={cn(
                    "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary-hover active:scale-[0.99]",
                    "transition-all duration-200",
                    "shadow-[0_0_24px_-4px_oklch(0.65_0.22_25_/_0.35)]"
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
              <section className="flex flex-col items-center justify-center gap-2 mt-auto pt-4 border-t border-border animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <svg
                    className="size-4 animate-pulse"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
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
            <div className="flex items-center gap-2 text-primary">
              <MapIcon className="size-6 animate-pulse" />
              <span className="text-sm font-semibold">Map Selection</span>
            </div>
            {isLeader ? (
              <Button
                size="lg"
                className={cn(
                  "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary-hover active:scale-[0.99]",
                  "transition-all duration-200",
                  "shadow-[0_0_24px_-4px_oklch(0.65_0.22_25_/_0.35)]"
                )}
                onClick={() => router.push(`/lobby/${code}/map`)}
              >
                Choose Map
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg className="size-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-sm text-muted-foreground">
                  Waiting for squad leader to choose the map…
                </p>
              </div>
            )}
          </section>
        ) : (
          /* ── PLAYING PHASE ─────────────────────────────── */
          <>
            {/* ── Banned Operators ──────────────────────────── */}
            {state.bans.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-destructive uppercase mb-3">
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
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-card border border-destructive/20"
                      >
                        {ban.operators.icon_url && (
                          <div className="w-6 h-6 rounded relative overflow-hidden flex-shrink-0">
                            <Image
                              src={ban.operators.icon_url}
                              alt={ban.operators.name}
                              fill
                              sizes="44px"
                              className="object-contain"
                            />
                          </div>
                        )}
                        <span className="text-xs font-medium text-foreground">
                          {ban.operators.name}
                        </span>
                        <span className="text-[10px] font-bold tracking-wider text-destructive uppercase">
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
              <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                <UsersIcon className="size-3.5" />
                Squad
                <span className="ml-auto text-muted-foreground font-normal tracking-normal">
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
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-card border border-border transition-all duration-200 hover:border-border/80 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center relative">
                          {member.profiles?.avatar_url ? (
                            <Image
                              src={member.profiles.avatar_url}
                              alt={member.profiles.username ?? "User"}
                              fill
                              sizes="44px"
                              className="object-cover"
                              unoptimized={member.profiles.avatar_url.startsWith('blob:') || member.profiles.avatar_url.startsWith('data:')}
                            />
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">
                              {(member.profiles?.username ?? "?")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Name + badge */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {member.profiles?.username ?? "Unknown"}
                          </span>
                          {isMemberLeader && (
                            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-warning uppercase">
                              <CrownIcon className="size-3" />
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
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                  <CheckIcon className="size-3.5" />
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
                              ? "bg-success/5 border-success/20"
                              : "bg-card border-border"
                          )}
                        >
                          <span className="text-sm font-medium text-foreground min-w-0 truncate">
                            {member?.profiles?.username ?? "Unknown"}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {selection.operator_id
                              ? `Op: ${operatorMap.get(selection.operator_id) || selection.operator_id}`
                              : selection.map_id
                              ? `Map: ${selection.map_id}`
                              : "Choosing…"}
                          </span>
                          {isLocked && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-success tracking-wider uppercase">
                              <CheckIcon className="size-3" strokeWidth={2.5} />
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
              <section className="flex flex-col gap-3 mt-auto pt-4 border-t border-border animate-in fade-in duration-300">
                <p className="text-xs text-muted-foreground font-medium">
                  Squad Leader Actions
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "flex-1 h-12 rounded-xl text-sm font-semibold",
                      "border-primary/30 text-primary",
                      "hover:bg-primary/10 hover:text-primary-hover",
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
                      "border-primary/30 text-primary",
                      "hover:bg-primary/10 hover:text-primary-hover",
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
                  "bg-foreground text-background",
                  "hover:bg-muted-foreground active:scale-[0.99]",
                  "transition-all duration-200",
                  "shadow-[0_0_24px_-4px_oklch(0.96_0_0_/_0.12)]"
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

      {/* ── Leave Confirmation Dialog ─────────────────────── */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent>
          <DialogTitle>Leave Lobby</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave this lobby? You can rejoin with the room code.
          </DialogDescription>
          <div className="flex gap-3 mt-4 justify-end">
            <Button variant="ghost" onClick={() => setShowLeaveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLeave}>
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Start Game Confirmation Dialog ─────────────────── */}
      <Dialog open={showStartConfirm} onOpenChange={setShowStartConfirm}>
        <DialogContent>
          <DialogTitle>Start Game</DialogTitle>
          <DialogDescription>
            You are the only player in the lobby. Do you want to start anyway?
          </DialogDescription>
          <div className="flex gap-3 mt-4 justify-end">
            <Button variant="ghost" onClick={() => setShowStartConfirm(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={confirmStartGame}>
              Start Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
