"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { logger } from "@/lib/logger";
import { apiFetch } from "@/lib/fetch";
import { handleApiError, errorMessage } from "@/lib/api-error";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLobbyRealtime } from "@/hooks/useLobbyRealtime";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import type { LobbyMember, Operator, Profile } from "@/types";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertIcon, CheckIcon, CrownIcon, MapIcon, UsersIcon } from "@/components/icons";
import { WaitingRoom } from "@/components/lobby/WaitingRoom";
import { PlayingPhase } from "@/components/lobby/PlayingPhase";
import { MatchComplete } from "@/components/lobby/MatchComplete";
import { LeaderControls } from "@/components/lobby/LeaderControls";

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
  score: { attacker: number; defender: number };
  completedRounds: {
    id: string;
    round_number: number;
    status: string;
    team_side: "attacker" | "defender" | null;
    winner_side: "attacker" | "defender" | null;
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
  const [showRoundWinnerModal, setShowRoundWinnerModal] = useState(false);
  const [showOvertimeSideModal, setShowOvertimeSideModal] = useState(false);
  const [pendingWinnerSide, setPendingWinnerSide] = useState<"attacker" | "defender" | null>(null);
  const [matchResult, setMatchResult] = useState<{ winner: string; score: { attacker: number; defender: number } } | null>(null);

  const { isLeader, setIsLeader, setLobbyId: storeSetLobbyId, setLobbyCode: storeSetLobbyCode } =
    useLobbyStore();

  // Resolve params
  useEffect(() => {
    logger.info("LobbyPage", "LobbyPage mount");
    params.then(({ code: c }) => setCode(c));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const res = await apiFetch(`/api/lobby/${lid}/state`);
    await handleApiError(res);
    const data: LobbyState = await res.json();
    logger.info("LobbyPage", "refreshState ok", { lobbyId: lid, members: data.members.length });
    setState(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!code || !currentUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserClient();
        const { data: lobby } = await supabase
          .from("lobbies")
          .select("id, room_code, leader_id")
          .eq("room_code", code)
          .single();

        if (cancelled) return;

        if (!lobby) {
          logger.warn("LobbyPage", "loadLobby error - lobby not found", { code });
          setError("Lobby not found.");
          setLoading(false);
          return;
        }

        setLobbyId(lobby.id);
        storeSetLobbyId(lobby.id);
        storeSetLobbyCode(code);
        localStorage.setItem(ROOM_CODE_KEY, code);
      } catch (err) {
        if (cancelled) return;
        logger.error("LobbyPage", "loadLobby failed", err);
        setError(err instanceof Error ? err.message : "Failed to load lobby");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, currentUserId, storeSetLobbyId, storeSetLobbyCode]);

  const { lastEventAt } = useLobbyRealtime(lobbyId);
  const { lastSync } = useHeartbeat(lobbyId);

  useEffect(() => {
    if (!lobbyId || (!lastEventAt && !lastSync)) return;
    let cancelled = false;
    (async () => {
      logger.debug("LobbyPage", "refreshState start", { lobbyId });
      const res = await apiFetch(`/api/lobby/${lobbyId}/state`);
      if (cancelled) return;
      if (!res.ok) {
        const data = await res.json();
        logger.warn("LobbyPage", "refreshState failed", { status: res.status, error: data.error });
        return;
      }
      const data: LobbyState = await res.json();
      if (cancelled) return;
      logger.info("LobbyPage", "refreshState ok", { lobbyId, members: data.members.length });
      setState(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
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
      await apiFetch(`/api/lobby/${lobbyId}/leave`, { method: "POST" });
      localStorage.removeItem(ROOM_CODE_KEY);
      router.push("/");
    } catch (err) {
      logger.error("LobbyPage", "Leave lobby failed", err);
      setError("Failed to leave lobby");
    }
  }, [lobbyId, router]);

  const handleNewRound = useCallback(() => {
    setShowRoundWinnerModal(true);
  }, []);

  const handleRoundWinner = useCallback(async (winnerSide: "attacker" | "defender") => {
    if (!lobbyId) return;
    setShowRoundWinnerModal(false);

    // Detect OT: round 6 ends with 3-3 → next round is OT
    const currentRoundNum = state?.currentRound?.round_number ?? 0;
    const curScore = state?.score ?? { attacker: 0, defender: 0 };
    const newAttacker = curScore.attacker + (winnerSide === "attacker" ? 1 : 0);
    const newDefender = curScore.defender + (winnerSide === "defender" ? 1 : 0);
    const isOT = currentRoundNum >= 6 && newAttacker === 3 && newDefender === 3;

    if (isOT) {
      // Round 6 completed → show side picker for OT before creating round 7
      setPendingWinnerSide(winnerSide);
      setShowOvertimeSideModal(true);
      // Mark round 6 as completed via API first
      try {
        const res = await apiFetch(`/api/lobby/${lobbyId}/new-round`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winner_side: winnerSide }),
        });
        await handleApiError(res);
        const data = await res.json();
        if (data.matchOver) {
          setMatchResult({ winner: data.winner, score: data.score });
        }
        await refreshState(lobbyId);
      } catch (err) {
        const msg = errorMessage(err, "Failed to complete round");
        logger.error("LobbyPage", "New round (regulation) failed", err, {
          winnerSide,
          currentRoundNum,
          isOT,
        });
        setError(msg);
      }
      return;
    }

    try {
      const res = await apiFetch(`/api/lobby/${lobbyId}/new-round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner_side: winnerSide }),
      });
      await handleApiError(res);
      const data = await res.json();
      if (data.matchOver) {
        setMatchResult({ winner: data.winner, score: data.score });
      }
      await refreshState(lobbyId);
    } catch (err) {
      const msg = errorMessage(err, "Failed to start new round");
      logger.error("LobbyPage", "New round failed", err, {
        winnerSide,
        currentRoundNum,
        isOT,
      });
      setError(msg);
    }
  }, [lobbyId, refreshState, state?.currentRound?.round_number, state?.score]);

  const handleOvertimeSide = useCallback(async (teamSide: "attacker" | "defender") => {
    if (!lobbyId || !pendingWinnerSide) return;
    setShowOvertimeSideModal(false);
    try {
      const res = await apiFetch(`/api/lobby/${lobbyId}/new-round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winner_side: pendingWinnerSide,
          team_side: teamSide,
        }),
      });
      await handleApiError(res);
      const data = await res.json();
      if (data.matchOver) {
        setMatchResult({ winner: data.winner, score: data.score });
      }
      await refreshState(lobbyId);
    } catch (err) {
      const msg = errorMessage(err, "Failed to start overtime round");
      logger.error("LobbyPage", "Overtime new round failed", err, {
        pendingWinnerSide,
        teamSide,
      });
      setError(msg);
    }
  }, [lobbyId, pendingWinnerSide, refreshState]);

  const handleStartGame = useCallback(async () => {
    if (!lobbyId) return;
    if (state?.members.length === 1) {
      setShowStartConfirm(true);
      return;
    }
    logger.info("LobbyPage", "Start game click", { lobbyId });
    try {
      const res = await apiFetch(`/api/lobby/${lobbyId}/start`, { method: "POST" });
      await handleApiError(res);
      logger.debug("LobbyPage", "Start game successful, refetching state");
      await refreshState(lobbyId);
    } catch (err) {
      const msg = errorMessage(err, "Failed to start game");
      logger.error("LobbyPage", "Start game failed", err);
      setError(msg);
    }
  }, [lobbyId, refreshState, state?.members.length]);

  const confirmStartGame = useCallback(async () => {
    if (!lobbyId) return;
    setShowStartConfirm(false);
    logger.info("LobbyPage", "Start game confirmed (solo)", { lobbyId });
    try {
      const res = await apiFetch(`/api/lobby/${lobbyId}/start`, { method: "POST" });
      await handleApiError(res);
      await refreshState(lobbyId);
    } catch (err) {
      const msg = errorMessage(err, "Failed to start game");
      logger.error("LobbyPage", "Start game failed", err);
      setError(msg);
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
      case "waiting": return { label: "Waiting Room", color: "text-on-surface-variant" };
      case "playing": return state.lobby.map_id
        ? { label: "In Game", color: "text-success" }
        : { label: "Map Selection", color: "text-primary" };
      case "closed": return { label: "Closed", color: "text-error" };
      default: return null;
    }
  })();

  // ── Loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-surface text-on-surface" aria-busy="true">
        <header className="flex items-center justify-between px-5 py-4 border-b border-outline">
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-16 rounded bg-surface-variant animate-pulse" />
            <div className="h-2.5 w-12 rounded bg-surface-variant/60 animate-pulse" />
          </div>
          <div className="h-9 w-16 rounded-lg bg-surface-variant animate-pulse" />
        </header>
        <div className="flex flex-col gap-6 p-5">
          <div className="h-4 w-28 rounded bg-surface-variant animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-surface-variant animate-pulse" />
            ))}
          </div>
          <div className="h-4 w-20 rounded bg-surface-variant animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
      <div className="flex flex-col flex-1 min-h-dvh bg-surface text-on-surface">
        <header className="flex items-center justify-between px-5 py-4 border-b border-outline">
          <div className="h-5 w-24 rounded bg-surface-variant animate-pulse" />
        </header>
        <EmptyState
          icon={
            <AlertIcon className="size-7 text-error" />
          }
          title={error ?? "Failed to load lobby"}
          description={error ? "Check your connection and try again." : "Lobby data unavailable."}
          action={
            <div className="flex gap-3">
              <Button
                variant="outlined"
                size="sm"
                className="h-11 min-w-[120px] rounded-xl"
                onClick={() => router.push("/")}
              >
                Back to Home
              </Button>
              {error && (
                <Button
                  variant="filled"
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

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-surface text-on-surface">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-outline">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-on-surface-variant uppercase">
                Room
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-on-surface">
                {code}
              </span>
            </div>
            {/* Phase indicator */}
            {phaseLabel && (
              <span className={cn(
                "text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-surface-container border border-outline",
                phaseLabel.color
              )}>
                {phaseLabel.label}
              </span>
            )}
          </div>
          {state.currentRound ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">
                Round {state.currentRound.round_number}
              </span>
              {state.score && (
                <span className="text-xs font-bold text-on-surface-variant">
                  ({state.score.attacker} - {state.score.defender})
                </span>
              )}
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
            <span className="text-xs text-on-surface-variant">Waiting for players…</span>
          ) : null}
        </div>

        <Button
          variant="text"
          size="sm"
          className="h-11 min-w-[80px] rounded-xl text-sm font-medium text-on-surface-variant hover:bg-error/10 hover:text-error transition-all duration-200 active:scale-95"
          onClick={handleLeave}
        >
          Leave
        </Button>
      </header>

      <div className="flex flex-col flex-1 gap-8 p-5 pb-8">

        {state.lobby.phase === "waiting" ? (
          /* ── WAITING ROOM ──────────────────────────────── */
          <WaitingRoom
            code={code}
            members={state.members}
            leaderId={state.lobby.leader_id}
            isLeader={isLeader}
            copied={copied}
            onCopyCode={handleCopyCode}
            onStartGame={handleStartGame}
          />
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
                  "bg-primary text-on-primary",
                  "hover:bg-primary-hover active:scale-[0.99]",
                  "transition-all duration-200",
                  "shadow-1 hover:shadow-2"
                )}
                onClick={() => router.push(`/lobby/${code}/map`)}
              >
                Choose Map
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <svg className="size-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-sm text-on-surface-variant">
                  Waiting for squad leader to choose the map…
                </p>
              </div>
            )}
          </section>
        ) : state.lobby.phase === "closed" ? (
          /* ── MATCH COMPLETE ─────────────────────────────── */
          <MatchComplete
            score={state.score}
            winner={matchResult?.winner ?? null}
            onBackToHome={() => router.push("/")}
          />
        ) : (
          /* ── PLAYING PHASE ─────────────────────────────── */
          <>
            <PlayingPhase
              members={state.members}
              leaderId={state.lobby.leader_id}
              operators={operators}
              selections={state.selections}
              bans={state.bans}
              score={state.score}
              currentRound={state.currentRound}
            />

            {/* ── Leader Controls ──────────────────────────── */}
            {isLeader && (
              <LeaderControls
                onSetBans={handleSetBans}
                onNewRound={handleNewRound}
              />
            )}

            {/* ── Round Actions ──────────────────────────── */}
            <section className="flex flex-col gap-3 mt-2">
              <Button
                size="lg"
                className={cn(
                  "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                  "bg-on-surface text-surface",
                  "hover:bg-on-surface-variant active:scale-[0.99]",
                  "transition-all duration-200",
                  "shadow-1 hover:shadow-2"
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
            <Button variant="text" onClick={() => setShowLeaveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLeave}>
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Round Winner Modal ──────────────────────────── */}
      <Dialog open={showRoundWinnerModal} onOpenChange={setShowRoundWinnerModal}>
        <DialogContent>
          <DialogTitle>Who won this round?</DialogTitle>
          <DialogDescription>
            Select the winning side to proceed to the next round.
          </DialogDescription>
          <div className="flex gap-3 mt-4">
            <Button
              className="flex-1 h-14 rounded-xl text-base font-bold bg-attacker/20 text-attacker border border-attacker/30 hover:bg-attacker/30"
              onClick={() => handleRoundWinner("attacker")}
            >
              Attackers
            </Button>
            <Button
              className="flex-1 h-14 rounded-xl text-base font-bold bg-defender/20 text-defender border border-defender/30 hover:bg-defender/30"
              onClick={() => handleRoundWinner("defender")}
            >
              Defenders
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Overtime Side Modal ──────────────────────────── */}
      <Dialog open={showOvertimeSideModal} onOpenChange={setShowOvertimeSideModal}>
        <DialogContent>
          <DialogTitle>Overtime!</DialogTitle>
          <DialogDescription>
            Round 7 — which side did your team get?
          </DialogDescription>
          <div className="flex gap-3 mt-4">
            <Button
              className="flex-1 h-14 rounded-xl text-base font-bold bg-attacker/20 text-attacker border border-attacker/30 hover:bg-attacker/30"
              onClick={() => handleOvertimeSide("attacker")}
            >
              Attackers
            </Button>
            <Button
              className="flex-1 h-14 rounded-xl text-base font-bold bg-defender/20 text-defender border border-defender/30 hover:bg-defender/30"
              onClick={() => handleOvertimeSide("defender")}
            >
              Defenders
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
            <Button variant="text" onClick={() => setShowStartConfirm(false)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={confirmStartGame}>
              Start Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
