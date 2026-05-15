"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LobbyMember, Profile } from "@/types";

const ROOM_CODE_KEY = "r6hub_room_code";

interface LobbyState {
  lobby: {
    id: string;
    room_code: string;
    leader_id: string;
  };
  members: (LobbyMember & {
    profiles: Profile | null;
  })[];
  currentRound: { id: string; round_number: number } | null;
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
    params.then(({ code: c }) => setCode(c));
  }, [params]);

  // Fetch session
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const fetchLobbyState = useCallback(async (roomCode: string) => {
    const supabase = createBrowserClient();

    const { data: lobby } = await supabase
      .from("lobbies")
      .select("id, room_code, leader_id")
      .eq("room_code", roomCode)
      .single();

    if (!lobby) {
      setError("Lobby not found.");
      setLoading(false);
      return;
    }

    setLobbyId(lobby.id);
    storeSetLobbyId(lobby.id);
    storeSetLobbyCode(roomCode);
    setIsLeader(currentUserId === lobby.leader_id);

    localStorage.setItem(ROOM_CODE_KEY, roomCode);

    const res = await fetch(`/api/lobby/${lobby.id}/state`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to fetch lobby state");
    }
    const data: LobbyState = await res.json();
    setState(data);
    setIsLeader(currentUserId === lobby.leader_id);
    setLoading(false);
  }, [currentUserId, storeSetLobbyId, storeSetLobbyCode, setIsLeader]);

  useEffect(() => {
    if (!code || !currentUserId) return;
    fetchLobbyState(code);
  }, [code, currentUserId, fetchLobbyState]);

  // Poll for updates every 3s
  useEffect(() => {
    if (!code || !lobbyId) return;
    const interval = setInterval(() => fetchLobbyState(code), 3000);
    return () => clearInterval(interval);
  }, [code, lobbyId, fetchLobbyState]);

  const handleLeave = useCallback(async () => {
    if (!lobbyId) return;
    if (!confirm("Leave this lobby?")) return;
    try {
      await fetch(`/api/lobby/${lobbyId}/leave`, { method: "POST" });
      localStorage.removeItem(ROOM_CODE_KEY);
      router.push("/");
    } catch {
      setError("Failed to leave lobby");
    }
  }, [lobbyId, router]);

  const handleNewRound = useCallback(async () => {
    if (!lobbyId) return;
    try {
      const res = await fetch(`/api/lobby/${lobbyId}/new-round`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await fetchLobbyState(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start new round");
    }
  }, [lobbyId, code, fetchLobbyState]);

  const handleSetBans = () => {
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
            <span className="text-xs text-neutral-600">
              Round {state.currentRound.round_number}
            </span>
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
            onClick={() => router.push(`/lobby/${code}/select`)}
          >
            Select Operator
          </Button>
        </section>
      </div>
    </div>
  );
}