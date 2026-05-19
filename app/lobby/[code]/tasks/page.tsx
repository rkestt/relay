"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { logger } from "@/lib/logger";
import { MapViewer } from "@/components/maps/MapViewer";
import { useLobbyRealtime } from "@/hooks/useLobbyRealtime";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import type { StrategyTemplate, StrategyHotspot, TaskAssignment } from "@/types";

interface AssignedTask {
  assignment: TaskAssignment & {
    strategy: StrategyTemplate | null;
  };
  hotspots: StrategyHotspot[];
}

interface LobbyState {
  lobby: { id: string; room_code: string };
  currentRound: { id: string; round_number: number } | null;
}

export default function TasksPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Realtime & heartbeat ──────────────────────────────
  const { lastEventAt } = useLobbyRealtime(lobbyId);
  const { lastSync } = useHeartbeat(lobbyId);

  useEffect(() => {
    logger.info("TasksPage", "TasksPage mount");
    params.then(({ code: c }) => setCode(c));
  }, [params]);

  // ── Resolve room_code → lobby_id ──────────────────────
  useEffect(() => {
    if (!code) return;

    const init = async () => {
      logger.debug("TasksPage", "Resolve lobby by code", { code });
      try {
        const supabase = createBrowserClient();

        const { data: lobby } = await supabase
          .from("lobbies")
          .select("id")
          .eq("room_code", code)
          .single();

        if (!lobby) {
          logger.warn("TasksPage", "Lobby not found", { code });
          setError("Lobby not found");
          setLoading(false);
          return;
        }

        setLobbyId(lobby.id);
      } catch (err) {
        logger.error("TasksPage", "Failed to resolve lobby", err);
        setError("Failed to load lobby");
        setLoading(false);
      }
    };

    init();
  }, [code]);

  // ── Fetch tasks ───────────────────────────────────────
  const loadTasks = useCallback(async (id: string) => {
    logger.debug("TasksPage", "Fetch tasks start", { lobbyId: id });
    try {
      const supabase = createBrowserClient();

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        logger.debug("TasksPage", "No authenticated user");
        setLoading(false);
        return;
      }

      const stateRes = await fetch(`/api/lobby/${id}/state`);
      if (!stateRes.ok) {
        throw new Error("Failed to fetch lobby state");
      }
      const stateData: LobbyState = await stateRes.json();

      if (!stateData?.currentRound) {
        logger.debug("TasksPage", "No current round");
        setTasks([]);
        setLoading(false);
        return;
      }

      const { data: assignments } = await supabase
        .from("task_assignments")
        .select("*, strategy:strategy_templates(*)")
        .eq("lobby_id", id)
        .eq("round_id", stateData.currentRound.id)
        .eq("user_id", userData.user.id);

      const allAssignments = (assignments ?? []) as (TaskAssignment & { strategy: StrategyTemplate | null })[];

      // Batch-fetch all hotspots in a single query (fix N+1)
      const strategyIds = allAssignments
        .filter((a) => a.strategy)
        .map((a) => a.strategy_id);

      const hotspotsByStrategy = new Map<string, StrategyHotspot[]>();
      if (strategyIds.length > 0) {
        const { data: hotspots } = await supabase
          .from("strategy_hotspots")
          .select("*")
          .in("strategy_id", strategyIds);

        for (const h of (hotspots ?? []) as StrategyHotspot[]) {
          const existing = hotspotsByStrategy.get(h.strategy_id) ?? [];
          existing.push(h);
          hotspotsByStrategy.set(h.strategy_id, existing);
        }
      }

      const tasksWithHotspots: AssignedTask[] = allAssignments.map((assignment) => ({
        assignment,
        hotspots: hotspotsByStrategy.get(assignment.strategy_id) ?? [],
      }));

      logger.info("TasksPage", "Tasks fetched", { taskCount: tasksWithHotspots.length });
      setTasks(tasksWithHotspots);
    } catch (err) {
      logger.error("TasksPage", "Failed to load tasks", err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch when lobbyId is resolved
  useEffect(() => {
    if (!lobbyId) return;
    loadTasks(lobbyId);
  }, [lobbyId, loadTasks]);

  // Refresh on realtime / heartbeat events
  useEffect(() => {
    if (!lobbyId) return;
    loadTasks(lobbyId);
  }, [lastEventAt, lastSync, lobbyId, loadTasks]);

  // ── Loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex flex-col gap-1">
            <div className="h-4 w-20 rounded bg-neutral-800 animate-pulse" />
            <div className="h-3 w-28 rounded bg-neutral-800/60 animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded-lg bg-neutral-800 animate-pulse" />
        </header>
        <div className="flex flex-col gap-5 p-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden animate-pulse"
            >
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 w-40 rounded bg-neutral-800" />
                    <div className="h-3 w-60 rounded bg-neutral-800/60" />
                  </div>
                  <div className="w-20 h-20 rounded-lg bg-neutral-800" />
                </div>
              </div>
              <div className="aspect-video bg-neutral-800 m-4 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────
  if (error) {
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
          title="Failed to load tasks"
          description={error}
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-[120px] rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={() => {
                if (!code) return;
                router.push(`/lobby/${code}`);
              }}
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
      {/* ── Header ───────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-50">Your Tasks</h1>
          <p className="text-xs text-neutral-500">
            Room {code}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 min-w-[100px] rounded-xl text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50 transition-all duration-200 active:scale-95"
          onClick={() => {
            if (!code) return;
            router.push(`/lobby/${code}`);
          }}
        >
          <svg
            className="size-4 mr-1.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </Button>
      </header>

      <div className="flex flex-col gap-5 p-5 pb-8">

        {/* ── Empty state ──────────────────────────────── */}
        {tasks.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="size-7 text-neutral-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            }
            title="No tasks assigned yet"
            description="Tasks are assigned after selecting your operator in a round."
            className="py-20"
          />
        ) : (
          tasks.map(({ assignment, hotspots }, index) => {
            // ── Strategy deleted fallback ──────────────────
            if (!assignment.strategy) {
              return (
                <div
                  key={assignment.id}
                  className="flex flex-col rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5">
                        <h2 className="text-base font-bold text-neutral-500">
                          Strategy removed
                        </h2>
                        <p className="text-sm text-neutral-600">
                          This strategy is no longer available.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={assignment.id}
                className="flex flex-col rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Strategy header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        {/* Step indicator */}
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                          {index + 1}
                        </span>
                        <h2 className="text-base font-bold text-neutral-50">
                          {assignment.strategy.title}
                        </h2>
                      </div>
                      {assignment.strategy.description && (
                        <p className="text-sm text-neutral-400 leading-relaxed">
                          {assignment.strategy.description}
                        </p>
                      )}
                    </div>
                    {/* Screenshot */}
                    {assignment.strategy.image_url && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assignment.strategy.image_url}
                          alt="Strategy screenshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Map with hotspots */}
                {assignment.strategy.image_url && hotspots.length > 0 && (
                  <div className="px-5 pb-5">
                    <MapViewer
                      imageUrl={assignment.strategy.image_url}
                      hotspots={hotspots.map((h) => ({
                        x_percent: h.x_percent,
                        y_percent: h.y_percent,
                        label: h.label ?? "",
                      }))}
                    />
                  </div>
                )}

                {/* Fallback if no map image */}
                {(!assignment.strategy.image_url || hotspots.length === 0) && (
                  <div className="px-5 pb-5">
                    <div className="aspect-video rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center gap-2">
                      <svg
                        className="size-5 text-neutral-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-neutral-600 text-xs">No map available</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}