"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { logger } from "@/lib/logger";
import { useLobbyRealtime } from "@/hooks/useLobbyRealtime";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { cn } from "@/lib/utils";
import { SkeletonGrid } from "@/components/ui/SkeletonCard";
import { StrategyCard } from "@/components/tasks/StrategyCard";
import type {
  StrategyTemplate,
  StrategyHotspot,
  TaskAssignment,
  Profile,
} from "@/types";
import { AlertIcon, BackArrowIcon } from "@/components/icons";

type SortMode = "score" | "newest";

interface FeedTask {
  assignment: TaskAssignment & {
    strategy: StrategyTemplate | null;
    user: Profile | null;
    upvotes: number;
    downvotes: number;
    user_vote: "up" | "down" | null;
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
  const [tasks, setTasks] = useState<FeedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("score");
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
          .select("id, phase")
          .eq("room_code", code)
          .single();

        if (!lobby) {
          logger.warn("TasksPage", "Lobby not found", { code });
          setError("Lobby not found");
          setLoading(false);
          return;
        }

        setLobbyId(lobby.id);

        if (lobby.phase === "waiting") {
          router.push(`/lobby/${code}`);
          return;
        }
      } catch (err) {
        logger.error("TasksPage", "Failed to resolve lobby", err);
        setError("Failed to load lobby");
        setLoading(false);
      }
    };

    init();
  }, [code, router]);

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

      // ── Fetch ALL assignments for this round (all users) ──
      const { data: assignments } = await supabase
        .from("task_assignments")
        .select(
          "*, strategy:strategy_templates(*, images:strategy_images(*)), user:profiles(*)",
        )
        .eq("lobby_id", id)
        .eq("round_id", stateData.currentRound.id);

      const allAssignments = (assignments ?? []) as (TaskAssignment & {
        strategy: StrategyTemplate | null;
        user: Profile | null;
      })[];

      if (allAssignments.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // ── Fetch vote counts for all assignments ────────────
      const assignmentIds = allAssignments.map((a) => a.id);

      const { data: allVotes } = await supabase
        .from("task_votes")
        .select("task_assignment_id, vote_type")
        .in("task_assignment_id", assignmentIds);

      // Count upvotes/downvotes per assignment
      const voteCounts = new Map<
        string,
        { upvotes: number; downvotes: number }
      >();
      for (const id of assignmentIds) {
        voteCounts.set(id, { upvotes: 0, downvotes: 0 });
      }
      for (const v of (allVotes ?? []) as {
        task_assignment_id: string;
        vote_type: "up" | "down";
      }[]) {
        const counts = voteCounts.get(v.task_assignment_id);
        if (counts) {
          if (v.vote_type === "up") counts.upvotes++;
          else if (v.vote_type === "down") counts.downvotes++;
        }
      }

      // ── Fetch current user's votes ──────────────────────
      const { data: myVotes } = await supabase
        .from("task_votes")
        .select("task_assignment_id, vote_type")
        .in("task_assignment_id", assignmentIds)
        .eq("user_id", userData.user.id);

      const userVoteMap = new Map<string, "up" | "down">();
      for (const v of (myVotes ?? []) as {
        task_assignment_id: string;
        vote_type: "up" | "down";
      }[]) {
        userVoteMap.set(v.task_assignment_id, v.vote_type);
      }

      // ── Batch-fetch all hotspots ────────────────────────
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

      // ── Merge everything into FeedTask list ─────────────
      const tasksWithVotes: FeedTask[] = allAssignments
        .map((assignment) => {
          const counts = voteCounts.get(assignment.id) ?? {
            upvotes: 0,
            downvotes: 0,
          };
          return {
            assignment: {
              ...assignment,
              upvotes: counts.upvotes,
              downvotes: counts.downvotes,
              user_vote: userVoteMap.get(assignment.id) ?? null,
            },
            hotspots:
              hotspotsByStrategy.get(assignment.strategy_id) ?? [],
          };
        })
        .sort((a, b) => {
          const scoreA =
            (a.assignment.upvotes ?? 0) - (a.assignment.downvotes ?? 0);
          const scoreB =
            (b.assignment.upvotes ?? 0) - (b.assignment.downvotes ?? 0);
          return scoreB - scoreA; // DESC by score
        });

      logger.info("TasksPage", "Tasks fetched", {
        taskCount: tasksWithVotes.length,
      });
      setTasks(tasksWithVotes);
    } catch (err) {
      logger.error("TasksPage", "Failed to load tasks", err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tasks when lobbyId resolves
  const prevLastEventAt = useRef<number | null>(null);
  const prevLastSync = useRef<number | null>(null);
  useEffect(() => {
    if (!lobbyId) return;
    loadTasks(lobbyId);
  }, [lobbyId, loadTasks]);

  // Refresh on realtime / heartbeat events (only on actual changes, not initial null→value)
  useEffect(() => {
    if (!lobbyId) return;
    const eventChanged =
      prevLastEventAt.current !== null && lastEventAt !== prevLastEventAt.current;
    const syncChanged =
      prevLastSync.current !== null && lastSync !== prevLastSync.current;
    prevLastEventAt.current = lastEventAt;
    prevLastSync.current = lastSync;

    if (eventChanged || syncChanged) {
      loadTasks(lobbyId);
    }
  }, [lastEventAt, lastSync, lobbyId, loadTasks]);

  // ── Vote handler ───────────────────────────────────────
  const handleVote = useCallback(
    async (assignmentId: string, voteType: "up" | "down" | null) => {
      if (!lobbyId) return;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => {
          if (t.assignment.id === assignmentId) {
            const oldUp = t.assignment.upvotes ?? 0;
            const oldDown = t.assignment.downvotes ?? 0;
            const oldVote = t.assignment.user_vote;

            let newUp = oldUp;
            let newDown = oldDown;

            // Remove old vote effect
            if (oldVote === "up") newUp = Math.max(0, newUp - 1);
            if (oldVote === "down") newDown = Math.max(0, newDown - 1);

            // Apply new vote effect
            if (voteType === "up") newUp++;
            if (voteType === "down") newDown++;

            return {
              ...t,
              assignment: {
                ...t.assignment,
                upvotes: newUp,
                downvotes: newDown,
                user_vote: voteType,
              },
            };
          }
          return t;
        }),
      );

      try {
        const res = await fetch(
          `/api/lobby/${lobbyId}/tasks/${assignmentId}/vote`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vote_type: voteType }),
          },
        );

        if (!res.ok) {
          // Revert on failure — refetch
          logger.warn("TasksPage", "Vote failed, refetching");
          loadTasks(lobbyId);
          return;
        }

        const data = await res.json();
        // Sync with server values
        setTasks((prev) =>
          prev.map((t) => {
            if (t.assignment.id === assignmentId) {
              return {
                ...t,
                assignment: {
                  ...t.assignment,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                  user_vote: data.user_vote,
                },
              };
            }
            return t;
          }),
        );
      } catch (err) {
        logger.error("TasksPage", "Vote error", err);
        loadTasks(lobbyId);
      }
    },
    [lobbyId, loadTasks],
  );

  // ── Navigation ────────────────────────────────────────
  const handleCardClick = useCallback(
    (assignmentId: string) => {
      if (!code) return;
      router.push(`/lobby/${code}/tasks/${assignmentId}`);
    },
    [code, router],
  );

  // Sort tasks based on sort mode
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortMode === "newest") {
      return (
        new Date(b.assignment.assigned_at).getTime() -
        new Date(a.assignment.assigned_at).getTime()
      );
    }
    // Default: by score (already sorted, but re-sort for safety)
    const scoreA =
      (a.assignment.upvotes ?? 0) - (a.assignment.downvotes ?? 0);
    const scoreB =
      (b.assignment.upvotes ?? 0) - (b.assignment.downvotes ?? 0);
    return scoreB - scoreA;
  });

  // ── Loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex flex-col gap-1">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-28 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
        </header>
        <div className="p-5">
          <SkeletonGrid count={6} />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        </header>
        <EmptyState
          icon={<AlertIcon className="size-7 text-destructive" />}
          title="Failed to load tasks"
          description={error}
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-[120px] rounded-xl border-primary/30 text-primary hover:bg-primary/10"
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
    <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
      {/* ── Header ───────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">
            Strategies Feed
          </h1>
          <p className="text-xs text-muted-foreground">Room {code}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort toggle */}
          <button
            onClick={() => setSortMode(sortMode === "score" ? "newest" : "score")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200"
          >
            <svg
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5h10M11 9h7M11 13h4" />
              <path d="M3 4v16" />
              <path d="M3 4l4 4-4 4" />
            </svg>
            {sortMode === "score" ? "By Score" : "Newest"}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 min-w-[100px] rounded-xl text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all duration-200 active:scale-95"
            onClick={() => {
              if (!code) return;
              router.push(`/lobby/${code}`);
            }}
          >
            <BackArrowIcon className="size-4 mr-1.5" />
            Back
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 pb-8">
          {/* ── Empty state ──────────────────────────────── */}
          {sortedTasks.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  className="size-7 text-muted-foreground"
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
              title="No strategies yet"
              description="Be the first to submit! Strategies appear after selecting an operator in a round."
              action={
                <Button
                  variant="default"
                  size="sm"
                  className="h-11 rounded-xl"
                  onClick={() => {
                    if (!code) return;
                    router.push(`/lobby/${code}/submit`);
                  }}
                >
                  Submit Strategy
                </Button>
              }
              className="py-20"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTasks.map(({ assignment, hotspots }, index) => (
                <div
                  key={assignment.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <StrategyCard
                    assignment={assignment}
                    hotspots={hotspots}
                    username={assignment.user?.username ?? undefined}
                    onVote={(voteType) => handleVote(assignment.id, voteType)}
                    onClick={() => handleCardClick(assignment.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
