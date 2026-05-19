"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { useLobbyRealtime } from "@/hooks/useLobbyRealtime";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import type { Operator, OperatorTag, LobbyBan } from "@/types";

interface LobbyBanWithOperator extends LobbyBan {
  operators: { id: string; name: string; side: "attacker" | "defender"; icon_url: string | null } | null;
}

interface LobbyState {
  lobby: { id: string; room_code: string; leader_id: string };
  currentRound: { id: string; round_number: number; team_side: "attacker" | "defender" | null } | null;
  bans: LobbyBanWithOperator[];
}

export default function BansPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [operatorTags, setOperatorTags] = useState<OperatorTag[]>([]);
  const [bans, setBans] = useState<LobbyBanWithOperator[]>([]);
  const [currentRound, setCurrentRound] = useState<{ round_number: number; team_side: "attacker" | "defender" | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.info("BansPage", "BansPage mount");
    params.then(({ code: c }) => setCode(c));
  }, [params]);

  // Load operators + tags
  useEffect(() => {
    const supabase = createBrowserClient();
    Promise.all([
      supabase.from("operators").select("*").then(({ data }) => data ?? []),
      supabase.from("operator_tags").select("*").then(({ data }) => data ?? []),
    ]).then(([opsData, tagsData]) => {
      logger.debug("BansPage", "Operators and tags loaded", { operators: opsData.length, tags: tagsData.length });
      setOperators(opsData as Operator[]);
      setOperatorTags(tagsData as OperatorTag[]);
    });
  }, []);

  // Resolve room_code → lobby_id and fetch state
  useEffect(() => {
    if (!code) return;

    const load = async () => {
      logger.debug("BansPage", "Fetch bans start", { code });
      try {
        const supabase = createBrowserClient();
        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData?.user?.id ?? null;

        const { data: lobby } = await supabase
          .from("lobbies")
          .select("id, leader_id")
          .eq("room_code", code)
          .single();

        if (!lobby) {
          logger.warn("BansPage", "Lobby not found", { code });
          setError("Lobby not found");
          setLoading(false);
          return;
        }

        setLobbyId(lobby.id);
        setIsLeader(currentUserId === lobby.leader_id);

        const res = await fetch(`/api/lobby/${lobby.id}/state`);
        if (!res.ok) throw new Error("Failed to fetch state");
        const data: LobbyState = await res.json();
        logger.info("BansPage", "Bans fetched", { banCount: data.bans.length });
        setBans(data.bans);
        setCurrentRound(data.currentRound);
      } catch (err) {
        logger.error("BansPage", "Failed to load bans", err);
        setError("Failed to load bans");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [code]);

  // ── Refresh bans from server ────────────────────────────
  const refreshBans = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/lobby/${id}/state`);
      if (res.ok) {
        const data: LobbyState = await res.json();
        setBans(data.bans);
        setCurrentRound(data.currentRound);
        logger.debug("BansPage", "Bans refreshed via sync", { banCount: data.bans.length });
      }
    } catch {
      // silent fail during refresh
    }
  }, []);

  const { lastEventAt } = useLobbyRealtime(lobbyId);
  const { lastSync } = useHeartbeat(lobbyId);

  // Refresh bans when realtime or heartbeat detects changes
  useEffect(() => {
    if (!lobbyId || (!lastEventAt && !lastSync)) return;
    refreshBans(lobbyId);
  }, [lobbyId, lastEventAt, lastSync, refreshBans]);

  const bannedOperatorIds = new Set(bans.map((b) => b.operator_id));

  const handleBan = useCallback(
    async (operatorId: string, side: "attacker" | "defender") => {
      if (!lobbyId) return;
      logger.info("BansPage", "Toggle ban", { operatorId, side, lobbyId });
      setBanning(true);
      setError(null);
      try {
        const res = await fetch(`/api/lobby/${lobbyId}/bans`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operator_id: operatorId, side }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to ban operator");
        }
        logger.debug("BansPage", "Ban saved, refreshing bans");
        // Refresh bans
        const stateRes = await fetch(`/api/lobby/${lobbyId}/state`);
        if (stateRes.ok) {
          const data: LobbyState = await stateRes.json();
          setBans(data.bans);
        }
      } catch (err) {
        logger.error("BansPage", "Ban failed", err);
        setError(err instanceof Error ? err.message : "Failed to ban operator");
      } finally {
        setBanning(false);
      }
    },
    [lobbyId]
  );

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 bg-neutral-950 text-neutral-50">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-50 rounded-full animate-spin" />
        <p className="text-neutral-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-semibold text-neutral-50">Set Bans</h1>
          <div className="flex items-center gap-2">
            <p className="text-xs text-neutral-500">Room {code}</p>
            {currentRound && (
              <span className={cn(
                "text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded",
                currentRound.team_side === "attacker"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-sky-500/20 text-sky-400"
              )}>
                Round {currentRound.round_number} — {currentRound.team_side ?? "?"}
              </span>
            )}
          </div>
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

      <div className="flex flex-col gap-5 p-5 pb-8">
        {/* ── Active bans ─────────────────────────────────── */}
        {bans.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
              Active Bans
            </h2>
            <div className="flex flex-wrap gap-2">
              {bans.map((ban) =>
                ban.operators ? (
                  <div
                    key={ban.id}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800"
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
                      BANNED
                    </span>
                  </div>
                ) : null
              )}
            </div>
          </section>
        )}

        {!isLeader && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-400">
            <svg className="size-4 text-neutral-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Only the lobby leader can ban operators.
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        {/* ── Attackers ────────────────────────────────────── */}
        {isLeader && (
          <>
            <section>
              <h3 className="text-xs font-semibold tracking-widest text-red-400 uppercase mb-3">
                Attackers
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {operators
                  .filter((op) => op.side === "attacker")
                  .map((op) => {
                    const banned = bannedOperatorIds.has(op.id);
                    return (
                      <button
                        key={op.id}
                        onClick={() => !banned && handleBan(op.id, "attacker")}
                        disabled={banned || banning}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all",
                          "focus:outline-none focus:ring-2 focus:ring-neutral-500/50",
                          "hover:border-neutral-500 active:scale-[0.98]",
                          "border-neutral-800 bg-neutral-900",
                          banned && "opacity-40 grayscale cursor-not-allowed"
                        )}
                      >
                        <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden">
                          {op.icon_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={op.icon_url}
                              alt={op.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                              {op.name[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-neutral-50 leading-tight">
                          {op.name}
                        </span>
                        {banned && (
                          <span className="text-[9px] font-bold text-red-400 tracking-wider uppercase">
                            Banned
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </section>

            {/* ── Defenders ─────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">
                Defenders
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {operators
                  .filter((op) => op.side === "defender")
                  .map((op) => {
                    const banned = bannedOperatorIds.has(op.id);
                    return (
                      <button
                        key={op.id}
                        onClick={() => !banned && handleBan(op.id, "defender")}
                        disabled={banned || banning}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all",
                          "focus:outline-none focus:ring-2 focus:ring-neutral-500/50",
                          "hover:border-neutral-500 active:scale-[0.98]",
                          "border-neutral-800 bg-neutral-900",
                          banned && "opacity-40 grayscale cursor-not-allowed"
                        )}
                      >
                        <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden">
                          {op.icon_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={op.icon_url}
                              alt={op.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                              {op.name[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-neutral-50 leading-tight">
                          {op.name}
                        </span>
                        {banned && (
                          <span className="text-[9px] font-bold text-red-400 tracking-wider uppercase">
                            Banned
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}