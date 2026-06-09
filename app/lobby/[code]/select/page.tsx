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
import Image from "next/image";
import type { Map, Site, Operator, OperatorTag } from "@/types";
import { AlertIcon, BackArrowIcon, ArrowRightIcon, CheckIcon, LockIcon, UsersIcon } from "@/components/icons";

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepDirection, setStepDirection] = useState<"left" | "right">("right");

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
    setShowConfirm(false);
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

      logger.info("SelectPage", "Selection locked successfully");
      setLocked(true);
      // Redirect to tasks after brief success display
      setTimeout(() => router.push(`/lobby/${code}/tasks`), 1500);
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
      <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground">
        <header className="flex items-center gap-2 px-5 py-4 border-b border-border">
          {["site", "operator"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
              {i < 1 && <div className="w-8 h-px bg-muted" />}
            </div>
          ))}
          <div className="h-4 w-24 rounded bg-muted animate-pulse ml-2" />
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
      <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        </header>
        <EmptyState
          icon={<AlertIcon className="size-7 text-destructive" />}
          title="Failed to load selection"
          description={error}
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-[120px] rounded-xl border-primary/30 text-primary hover:bg-primary/10"
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

  // ── Locked success state ─────────────────────────────
  if (locked) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-5 bg-background text-foreground min-h-screen p-6 animate-in fade-in duration-400">
        <div className="w-16 h-16 rounded-full bg-success/20 border border-success/30 flex items-center justify-center shadow-[0_0_24px_-4px_oklch(0.70_0.18_145/0.25)]">
          <CheckIcon className="w-8 h-8 text-success animate-in zoom-in duration-300" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground mb-1 animate-in fade-in slide-in-from-bottom-1 duration-400 delay-100">
            Selection locked!
          </h2>
          <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-400 delay-150">
            Your operator and site are locked. Redirecting to tasks…
          </p>
        </div>
      </div>
    );
  }

  const steps: SelectionStep[] = ["site", "operator"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground">
      {/* ── Step Indicator ─────────────────────────────── */}
      <header className="flex items-center gap-2 px-5 py-4 border-b border-border">
        {steps.map((s, i) => {
          const isComplete = i < currentStepIndex;
          const isActive = step === s;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_-2px_oklch(0.65_0.22_25/0.3)]"
                    : isComplete
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                  {isComplete ? (
                    <CheckIcon className="size-3.5" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </div>
              <span className={cn(
                "text-xs hidden sm:inline font-medium",
                isActive && "text-primary font-semibold",
                isComplete && "text-success",
                !isActive && !isComplete && "text-muted-foreground"
              )}>
                {s === "site" ? "Site" : "Operator"}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-10 h-px transition-all duration-300",
                    isComplete ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
        {lobbyState?.currentRound?.team_side && (
          <span className={cn(
            "ml-auto text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-lg",
            lobbyState.currentRound.team_side === "attacker"
              ? "bg-attacker/20 text-attacker"
              : "bg-defender/20 text-defender"
          )}>
            {lobbyState.currentRound.team_side}
          </span>
        )}
      </header>

      <div className="flex flex-col flex-1 gap-4 p-5 pb-8">

        {/* ── Site Selection (Step 1) ──────────────────── */}
        {step === "site" && (
          <div className={cn(
            "flex flex-col gap-3",
            stepDirection === "right" ? "animate-slide-in-right" : "animate-fade-in"
          )} key="site-step">
            <button
              onClick={() => {
                logger.info("SelectPage", "Back to lobby");
                router.push(`/lobby/${code}`);
              }}
              className="flex items-center gap-2 self-start px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200 active:scale-95"
            >
              <BackArrowIcon className="size-4" />
              Back to Lobby
            </button>

            {sites.length === 0 ? (
              <EmptyState
                title="No sites for this map"
                description="The selected map doesn't have sites configured yet."
                className="py-12"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sites.map((site, i) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      logger.info("SelectPage", "Site selected", { siteId: site.id, siteName: site.name });
                      setSelectedSiteId(site.id);
                      setStepDirection("right");
                      setStep("operator");
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-xl border text-left",
                      "transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      "active:scale-[0.99]",
                      selectedSiteId === site.id
                        ? "border-primary bg-card ring-2 ring-primary"
                        : "border-border bg-card hover:border-border"
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{site.name}</span>
                      {site.floor && (
                        <span className="text-xs text-muted-foreground">{site.floor}</span>
                      )}
                    </div>
                    <ArrowRightIcon className="ml-auto size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Operator Selection (Step 2) ──────────────── */}
        {step === "operator" && (
          <div className={cn(
            "flex flex-col gap-4",
            stepDirection === "right" ? "animate-slide-in-right" : "animate-fade-in"
          )} key="operator-step">
            <button
              onClick={() => {
                logger.info("SelectPage", "Back to sites");
                setStepDirection("left");
                setStep("site");
              }}
              className="flex items-center gap-2 self-start px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200 active:scale-95"
            >
              <BackArrowIcon className="size-4" />
              Back to Sites
            </button>

            {/* Attackers */}
            {(!lobbyState?.currentRound?.team_side || lobbyState.currentRound.team_side === "attacker") && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-attacker uppercase mb-3">
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
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                          "active:scale-[0.96]",
                          selectedOperatorId === op.id
                            ? "border-primary bg-card ring-2 ring-primary"
                            : "border-border bg-card hover:border-border",
                          banned && "opacity-40 bg-destructive/10 cursor-not-allowed grayscale"
                        )}
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden relative">
                          {op.icon_url ? (
                            <Image
                              src={op.icon_url}
                              alt={op.name}
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              {op.name[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-foreground leading-tight">
                          {op.name}
                        </span>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-0.5">
                            {tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-medium px-1 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {banned && (
                          <span className="text-[9px] font-bold text-destructive tracking-wider uppercase">
                            Banned
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
            )}

            {/* Defenders */}
            {(!lobbyState?.currentRound?.team_side || lobbyState.currentRound.team_side === "defender") && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-defender uppercase mb-3">
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
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                          "active:scale-[0.96]",
                          selectedOperatorId === op.id
                            ? "border-primary bg-card ring-2 ring-primary"
                            : "border-border bg-card hover:border-border",
                          banned && "opacity-40 bg-destructive/10 cursor-not-allowed grayscale"
                        )}
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden relative">
                          {op.icon_url ? (
                            <Image
                              src={op.icon_url}
                              alt={op.name}
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              {op.name[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-foreground leading-tight">
                          {op.name}
                        </span>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-0.5">
                            {tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-medium px-1 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {banned && (
                          <span className="text-[9px] font-bold text-destructive tracking-wider uppercase">
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
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                <UsersIcon className="size-3.5" />
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
                        ? "bg-success/5 border-success/20"
                        : "bg-card border-border"
                    )}
                  >
                    <span className="font-medium text-foreground">
                      {member?.profiles?.username ?? "Unknown"}
                    </span>
                    <span className="ml-auto text-muted-foreground">
                      {sel.operator_id
                        ? `Op: ${sel.operator_id}`
                        : sel.map_id
                        ? `Map: ${sel.map_id}`
                        : "Choosing…"}
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-success font-bold tracking-wider uppercase text-[10px]">
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

        {/* ── Error ────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20" role="alert" aria-live="polite">
            <AlertIcon className="size-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* ── Lock In ──────────────────────────────────── */}
        {step === "operator" && (
          <div className="mt-auto pt-4">
            <Button
              size="lg"
              className={cn(
                "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                "bg-primary text-primary-foreground",
                "hover:bg-primary-hover active:bg-primary-active",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "shadow-[0_0_20px_-4px_oklch(0.65_0.22_25/0.25)]"
              )}
              onClick={() => {
                logger.info("SelectPage", "Lock In clicked, showing confirm");
                setShowConfirm(true);
              }}
              disabled={locking || !selectedOperatorId}
            >
              {locking ? (
                <span className="flex items-center gap-2">
                  <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Locking…
                </span>
              ) : (
                <>
                  <LockIcon className="size-5 mr-2" />
                  Lock In
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ── Confirmation Dialog ─────────────────────────── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-popover border border-border rounded-xl shadow-3 p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <LockIcon className="size-5 text-primary" />
              </div>
              <div>
                <h3 id="confirm-title" className="text-base font-semibold text-foreground">
                  Lock in selection?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure? This will lock your selection and assign tasks.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-11 min-w-[100px] rounded-xl"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-11 min-w-[100px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
                onClick={handleLockIn}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
