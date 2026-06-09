"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { useLobbyRealtime } from "@/hooks/useLobbyRealtime";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import Image from "next/image";
import type { Operator, OperatorTag, LobbyBan } from "@/types";
import { CheckIcon } from "@/components/icons";

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
  const [lastBannedId, setLastBannedId] = useState<string | null>(null);

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
          .select("id, leader_id, phase")
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

        if (lobby.phase === "waiting") {
          router.push(`/lobby/${code}`);
          return;
        }

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
        setLastBannedId(operatorId);
        setTimeout(() => setLastBannedId(null), 400);
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

  const attackerBans = bans.filter((b) => b.side === "attacker").length;
  const defenderBans = bans.filter((b) => b.side === "defender").length;
  const hasBans = bans.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 bg-background text-foreground" aria-busy="true">
        <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h1 className="text-base font-semibold text-foreground">Set Bans</h1>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Room {code}</p>
            {currentRound && (
              <span className={cn(
                "text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-card border border-border",
                currentRound.team_side === "attacker"
                  ? "text-attacker"
                  : "text-defender"
              )}>
                Round {currentRound.round_number} — {currentRound.team_side ?? "?"}
              </span>
            )}
          </div>
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

      <div className="flex flex-col gap-5 p-5 pb-8">
        {/* ── Active bans summary ─────────────────────────── */}
        {hasBans && (
          <section>
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              Active Bans
            </h2>
            <div className="flex flex-wrap gap-2">
              {bans.map((ban) =>
                ban.operators ? (
                  <div
                    key={ban.id}
                    className={cn(
                      "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-card border border-destructive/20",
                      lastBannedId === ban.operator_id && "animate-pop-in"
                    )}
                  >
                    {ban.operators.icon_url && (
                      <div className="w-6 h-6 rounded relative overflow-hidden flex-shrink-0">
                        <Image
                          src={ban.operators.icon_url}
                          alt={ban.operators.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="text-xs font-medium text-foreground">
                      {ban.operators.name}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider text-destructive uppercase">
                      BANNED
                    </span>
                  </div>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* ── Banned count summary ──────────────────────────── */}
        {hasBans && (
          <div className="text-center text-xs text-muted-foreground">
            {attackerBans > 0 && <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-attacker" /> {attackerBans} attacker{attackerBans !== 1 ? "s" : ""} banned</span>}
            {defenderBans > 0 && <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-defender" /> {defenderBans} defender{defenderBans !== 1 ? "s" : ""} banned</span>}
            {attackerBans === 0 && defenderBans === 0 && "No operators banned yet"}
          </div>
        )}

        {!isLeader && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border text-sm text-muted-foreground">
            <svg className="size-4 text-muted-foreground flex-shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Leader is selecting bans…
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm text-center" role="alert" aria-live="polite">{error}</p>
        )}

        {/* ── Operator Grid ────────────────────────────────── */}
        {isLeader && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {/* ── Attackers ──────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold tracking-widest text-attacker uppercase mb-3 flex items-center gap-2">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                Attackers
                {attackerBans > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-destructive tracking-wider uppercase bg-destructive/10 px-1.5 py-0.5 rounded">
                    {attackerBans} banned
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {operators
                  .filter((op) => op.side === "attacker")
                  .map((op) => {
                    const banned = bannedOperatorIds.has(op.id);
                    return (
                      <button
                        key={op.id}
                        onClick={() => handleBan(op.id, "attacker")}
                        disabled={banning}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all duration-200 ease-out",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "active:scale-[0.97]",
                          banned
                            ? "border-destructive/20 bg-destructive/10 opacity-40 grayscale cursor-pointer hover:bg-destructive/20 hover:border-destructive/40 hover:opacity-60"
                            : "border-border bg-card hover:border-border/80 hover:bg-card/80 hover:shadow-2 hover:-translate-y-0.5 cursor-pointer",
                          lastBannedId === op.id && banned && "animate-pop-in"
                        )}
                        aria-label={banned ? `Banned: ${op.name}. Click to unban.` : op.name}
                        aria-pressed={banned}
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden relative">
                          {op.icon_url ? (
                            <Image
                              src={op.icon_url}
                              alt={op.name}
                              fill
                              className="object-contain transition-all duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              {op.name[0]}
                            </div>
                          )}
                        </div>
                        <span className={cn(
                          "text-[11px] font-medium leading-tight transition-all duration-200",
                          banned ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {op.name}
                        </span>
                        {banned && (
                          <span className="text-[9px] font-bold text-destructive tracking-wider uppercase animate-fade-in">
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
              <h3 className="text-xs font-semibold tracking-widest text-defender uppercase mb-3 flex items-center gap-2">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Defenders
                {defenderBans > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-destructive tracking-wider uppercase bg-destructive/10 px-1.5 py-0.5 rounded">
                    {defenderBans} banned
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {operators
                  .filter((op) => op.side === "defender")
                  .map((op) => {
                    const banned = bannedOperatorIds.has(op.id);
                    return (
                      <button
                        key={op.id}
                        onClick={() => handleBan(op.id, "defender")}
                        disabled={banning}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all duration-200 ease-out",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "active:scale-[0.97]",
                          banned
                            ? "border-destructive/20 bg-destructive/10 opacity-40 grayscale cursor-pointer hover:bg-destructive/20 hover:border-destructive/40 hover:opacity-60"
                            : "border-border bg-card hover:border-border/80 hover:bg-card/80 hover:shadow-2 hover:-translate-y-0.5 cursor-pointer",
                          lastBannedId === op.id && banned && "animate-pop-in"
                        )}
                        aria-label={banned ? `Banned: ${op.name}. Click to unban.` : op.name}
                        aria-pressed={banned}
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden relative">
                          {op.icon_url ? (
                            <Image
                              src={op.icon_url}
                              alt={op.name}
                              fill
                              className="object-contain transition-all duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              {op.name[0]}
                            </div>
                          )}
                        </div>
                        <span className={cn(
                          "text-[11px] font-medium leading-tight transition-all duration-200",
                          banned ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {op.name}
                        </span>
                        {banned && (
                          <span className="text-[9px] font-bold text-destructive tracking-wider uppercase animate-fade-in">
                            Banned
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </section>
          </div>
        )}

        {/* ── Done Banning Button (leader only) ──────────── */}
        {isLeader && (
          <div className="mt-auto pt-4 border-t border-border">
            <Button
              size="lg"
              className={cn(
                "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                "bg-primary text-primary-foreground",
                "hover:bg-primary-hover active:scale-[0.99]",
                "transition-all duration-200",
                "shadow-[0_0_24px_-4px_oklch(0.65_0.22_25_/_0.35)]"
              )}
              onClick={() => {
                logger.info("BansPage", "Done banning, returning to lobby", { code });
                router.push(`/lobby/${code}`);
              }}
            >
              <CheckIcon className="size-5 mr-2" />
              Done Banning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
