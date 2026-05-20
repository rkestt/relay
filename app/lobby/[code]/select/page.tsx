"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { useLobbyRealtime } from "@/hooks/useLobbyRealtime";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SkeletonGrid } from "@/components/ui/SkeletonCard";
import { logger } from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Map, Site, Operator, OperatorTag } from "@/types";

type SelectionStep = "site" | "operator";

interface LobbyState {
  lobby: { id: string; room_code: string; leader_id: string };
  members: { user_id: string; profiles: { username: string } | null }[];
  currentRound: { id: string; round_number: number; team_side: "attacker" | "defender" | null } | null;
  selections: {
    user_id: string;
    map_id: string | null;
    site_id: string | null;
    operator_id: string | null;
    locked_at: string | null;
  }[];
  bans: { operator_id: string }[];
}

export default function SelectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [step, setStep] = useState<SelectionStep>("site");
  const [maps, setMaps] = useState<Map[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [operatorTags, setOperatorTags] = useState<OperatorTag[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { lastEventAt } = useLobbyRealtime(lobbyId);
  const { lastSync } = useHeartbeat(lobbyId);

  const refreshLobbyState = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/lobby/${id}/state`);
      if (res.ok) {
        const data: LobbyState = await res.json();
        setLobbyState(data);
        logger.debug("SelectPage", "Lobby state refreshed", { members: data.members.length, selections: data.selections.length });
      }
    } catch {
      // silent fail during refresh
    }
  }, []);

  useEffect(() => {
    logger.info("SelectPage", "SelectPage mount");
    params.then(({ code: c }) => setCode(c));
  }, [params]);

  // Load reference data
  useEffect(() => {
    const supabase = createBrowserClient();
    Promise.all([
      supabase.from("maps").select("*").then(({ data }) => data ?? []),
      supabase.from("operators").select("*").then(({ data }) => data ?? []),
      supabase.from("operator_tags").select("*").then(({ data }) => data ?? []),
    ]).then(([mapsData, opsData, tagsData]) => {
      logger.debug("SelectPage", "Reference data loaded", { maps: mapsData.length, operators: opsData.length, tags: tagsData.length });
      setMaps(mapsData as Map[]);
      setOperators(opsData as Operator[]);
      setOperatorTags(tagsData as OperatorTag[]);
    });
  }, []);

  // Resolve room_code → lobby_id
  useEffect(() => {
    if (!code) return;

    const load = async () => {
      logger.debug("SelectPage", "Fetch lobby state start", { code });
      try {
        const supabase = createBrowserClient();
        const { data: lobby } = await supabase
          .from("lobbies")
          .select("id, room_code, leader_id, phase, map_id")
          .eq("room_code", code)
          .single();

        if (!lobby) {
          logger.warn("SelectPage", "Lobby not found", { code });
          setError("Lobby not found");
          setLoading(false);
          return;
        }

        setLobbyId(lobby.id);

        if (lobby.map_id) {
          setSelectedMapId(lobby.map_id);
        }

        if (lobby.phase === "waiting") {
          router.push(`/lobby/${code}`);
          return;
        }

        await refreshLobbyState(lobby.id);
        logger.info("SelectPage", "Lobby state loaded for initial");
      } catch (err) {
        logger.error("SelectPage", "Failed to load lobby", err);
        setError("Failed to load lobby");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [code, refreshLobbyState]);

  // Refresh lobby state on realtime events or heartbeat
  useEffect(() => {
    if (!lobbyId || (!lastEventAt && !lastSync)) return;
    refreshLobbyState(lobbyId);
  }, [lobbyId, lastEventAt, lastSync, refreshLobbyState]);

  // Filter sites by selected map
  useEffect(() => {
    if (!selectedMapId) {
      setSites([]);
      return;
    }
    const supabase = createBrowserClient();
    supabase
      .from("sites")
      .select("*")
      .eq("map_id", selectedMapId)
      .then(({ data }) => setSites(data as Site[]));
  }, [selectedMapId]);

  const handleLockIn = useCallback(async () => {
    if (!lobbyId) return;
    logger.info("SelectPage", "Lock selection click", { selectedMapId, selectedSiteId, selectedOperatorId });
    setLocking(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      if (selectedMapId) body.map_id = selectedMapId;
      if (selectedSiteId) body.site_id = selectedSiteId;
      if (selectedOperatorId) body.operator_id = selectedOperatorId;

      const res = await fetch(`/api/lobby/${lobbyId}/lock-selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to lock selection");
      }

      // -- Auto-assign task if operator was selected ----------------------
      if (selectedOperatorId) {
        const supabase = createBrowserClient();
        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData?.user?.id;
        if (currentUserId) {
          logger.info("SelectPage", "Auto-assigning task", { operatorId: selectedOperatorId });
          const assignRes = await fetch(`/api/lobby/${lobbyId}/assign-tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUserId, operator_id: selectedOperatorId }),
          });
          if (!assignRes.ok) {
            const assignData = await assignRes.json();
            logger.warn("SelectPage", "Task auto-assignment failed", { error: assignData.error });
            // Non-fatal: redirect anyway so user sees tasks page
          } else {
            logger.info("SelectPage", "Task auto-assigned successfully");
          }
        }
      }

      logger.info("SelectPage", "Selection locked, navigating to tasks");
      router.push(`/lobby/${code}/tasks`);
    } catch (err) {
      logger.error("SelectPage", "Lock selection failed", err);
      setError(err instanceof Error ? err.message : "Failed to lock selection");
    } finally {
      setLocking(false);
    }
  }, [lobbyId, selectedMapId, selectedSiteId, selectedOperatorId, router, code]);

  const bannedOperatorIds = new Set(lobbyState?.bans.map((b) => b.operator_id) ?? []);

  const getOperatorTags = (operatorId: string) =>
    operatorTags.filter((t) => t.operator_id === operatorId).map((t) => t.tag);

  // ── Loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center gap-2 px-5 py-4 border-b border-neutral-800">
          {["site", "operator"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-neutral-800 animate-pulse" />
              {i < 1 && <div className="w-8 h-px bg-neutral-800" />}
            </div>
          ))}
          <div className="h-4 w-24 rounded bg-neutral-800 animate-pulse ml-2" />
        </header>
        <div className="flex flex-col gap-4 p-5">
          <SkeletonGrid count={6} />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────
  if (error && !lobbyId) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="h-5 w-20 rounded bg-neutral-800 animate-pulse" />
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
          title="Failed to load selection"
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

  const steps: SelectionStep[] = ["site", "operator"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
      {/* ── Step Indicator ─────────────────────────────── */}
      <header className="flex items-center gap-2 px-5 py-4 border-b border-neutral-800">
        {steps.map((s, i) => {
          const isComplete = i < currentStepIndex;
          const isActive = step === s;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300",
                  isActive
                    ? "bg-neutral-50 text-neutral-950 shadow-[0_0_12px_-2px_rgba(240,240,240,0.3)]"
                    : isComplete
                    ? "bg-green-500 text-neutral-950"
                    : "bg-neutral-800 text-neutral-500"
                )}
              >
                {isComplete ? (
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-10 h-px transition-all duration-300",
                    isComplete ? "bg-green-500" : "bg-neutral-800"
                  )}
                />
              )}
            </div>
          );
        })}
        <span className="ml-3 text-sm font-semibold text-neutral-200 capitalize">
          {step === "site" ? "Choose Site" : "Choose Operator"}
        </span>
        {lobbyState?.currentRound?.team_side && (
          <span className={cn(
            "ml-auto text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-lg",
            lobbyState.currentRound.team_side === "attacker"
              ? "bg-amber-500/20 text-amber-400"
              : "bg-sky-500/20 text-sky-400"
          )}>
            {lobbyState.currentRound.team_side}
          </span>
        )}
      </header>

      <div className="flex flex-col flex-1 gap-4 p-5 pb-8">

        {/* ── Site Selection ────────────────────────────── */}
        {step === "site" && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
            <button
              onClick={() => {
                logger.info("SelectPage", "Back to lobby");
                router.push(`/lobby/${code}`);
              }}
              className="flex items-center gap-2 self-start px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-all duration-200 active:scale-95"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Lobby
            </button>

            {sites.length === 0 ? (
              <EmptyState
                title="No sites for this map"
                description="The selected map doesn't have sites configured yet."
                className="py-12"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {sites.map((site, i) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      logger.info("SelectPage", "Site selected", { siteId: site.id, siteName: site.name });
                      setSelectedSiteId(site.id);
                      setStep("operator");
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left",
                      "transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/50",
                      "active:scale-[0.99]",
                      selectedSiteId === site.id
                        ? "border-neutral-50 bg-neutral-800 shadow-[0_0_12px_-2px_rgba(240,240,240,0.12)]"
                        : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-neutral-50">{site.name}</span>
                      {site.floor && (
                        <span className="text-xs text-neutral-500">{site.floor}</span>
                      )}
                    </div>
                    <svg
                      className="ml-auto size-4 text-neutral-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Operator Selection ────────────────────────── */}
        {step === "operator" && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <button
              onClick={() => {
                logger.info("SelectPage", "Back to sites");
                setStep("site");
              }}
              className="flex items-center gap-2 self-start px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-all duration-200 active:scale-95"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Sites
            </button>

            {/* Attackers — shown when team is attacker or no round set */}
            {(!lobbyState?.currentRound?.team_side || lobbyState.currentRound.team_side === "attacker") && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-red-400 uppercase mb-3">
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                Attackers
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {operators
                  .filter((op) => op.side === "attacker")
                  .map((op) => {
                    const banned = bannedOperatorIds.has(op.id);
                    const tags = getOperatorTags(op.id);
                    return (
                      <button
                        key={op.id}
                        onClick={() => {
                          if (!banned) {
                            logger.info("SelectPage", "Operator selected (attacker)", { operatorId: op.id, operatorName: op.name });
                            setSelectedOperatorId(op.id);
                          }
                        }}
                        disabled={banned}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center",
                          "transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/50",
                          "active:scale-[0.96]",
                          selectedOperatorId === op.id
                            ? "border-neutral-50 bg-neutral-800 ring-2 ring-neutral-500/40"
                            : "border-neutral-800 bg-neutral-900 hover:border-neutral-600",
                          banned && "opacity-35 grayscale cursor-not-allowed"
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
                        {tags.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-0.5">
                            {tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-medium px-1 py-0.5 rounded bg-neutral-800 text-neutral-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {banned && (
                          <span className="text-[9px] font-bold text-red-400 tracking-wider uppercase">
                            Banned
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
            )}

            {/* Defenders — shown when team is defender or no round set */}
            {(!lobbyState?.currentRound?.team_side || lobbyState.currentRound.team_side === "defender") && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Defenders
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {operators
                  .filter((op) => op.side === "defender")
                  .map((op) => {
                    const banned = bannedOperatorIds.has(op.id);
                    const tags = getOperatorTags(op.id);
                    return (
                      <button
                        key={op.id}
                        onClick={() => {
                          if (!banned) {
                            logger.info("SelectPage", "Operator selected (defender)", { operatorId: op.id, operatorName: op.name });
                            setSelectedOperatorId(op.id);
                          }
                        }}
                        disabled={banned}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center",
                          "transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/50",
                          "active:scale-[0.96]",
                          selectedOperatorId === op.id
                            ? "border-neutral-50 bg-neutral-800 ring-2 ring-neutral-500/40"
                            : "border-neutral-800 bg-neutral-900 hover:border-neutral-600",
                          banned && "opacity-35 grayscale cursor-not-allowed"
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
                        {tags.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-0.5">
                            {tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-medium px-1 py-0.5 rounded bg-neutral-800 text-neutral-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {banned && (
                          <span className="text-[9px] font-bold text-red-400 tracking-wider uppercase">
                            Banned
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
            )}
          </div>
        )}

        {/* ── Teammates' Selections ─────────────────────── */}
        {lobbyState && lobbyState.selections.length > 0 && (
          <section className="mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-2">
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
              Squad Selections
            </h3>
            <div className="flex flex-col gap-1.5">
              {lobbyState.selections.map((sel) => {
                const member = lobbyState.members.find(
                  (m) => m.user_id === sel.user_id
                );
                const isLocked = Boolean(sel.locked_at);
                return (
                  <div
                    key={sel.user_id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all duration-200",
                      isLocked
                        ? "bg-green-500/5 border-green-400/20"
                        : "bg-neutral-950 border-neutral-800"
                    )}
                  >
                    <span className="font-medium text-neutral-200">
                      {member?.profiles?.username ?? "Unknown"}
                    </span>
                    <span className="ml-auto text-neutral-500">
                      {sel.operator_id
                        ? `Op: ${sel.operator_id}`
                        : sel.map_id
                        ? `Map: ${sel.map_id}`
                        : "Choosing…"}
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-green-400 font-bold tracking-wider uppercase text-[10px]">
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

        {/* ── Error ────────────────────────────────────── */}
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

        {/* ── Lock In ──────────────────────────────────── */}
        {step === "operator" && (
          <div className="mt-auto pt-4">
            <Button
              size="lg"
              className={cn(
                "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                "bg-green-500 text-neutral-950",
                "hover:bg-green-400 active:scale-[0.99]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "shadow-[0_0_20px_-4px_rgba(34,197,94,0.25)]"
              )}
              onClick={handleLockIn}
              disabled={locking || !selectedOperatorId}
            >
              {locking ? (
                <span className="flex items-center gap-2">
                  <div className="size-4 border-2 border-neutral-700 border-t-neutral-950 rounded-full animate-spin" />
                  Locking…
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Lock In
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}