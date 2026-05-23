"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { logger } from "@/lib/logger";
import { MapViewer } from "@/components/maps/MapViewer";
import { VoteButtons } from "@/components/tasks/VoteButtons";
import type {
  StrategyTemplate,
  StrategyHotspot,
  StrategyImage,
  TaskAssignment,
  Profile,
  Map,
} from "@/types";

interface DetailData {
  assignment: TaskAssignment & {
    strategy: (StrategyTemplate & { images: StrategyImage[] }) | null;
    user: Profile | null;
  };
  map: Map | null;
  hotspots: StrategyHotspot[];
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ code: string; id: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [assignmentId, setAssignmentId] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    logger.info("TaskDetailPage", "Mount");
    params.then(({ code: c, id }) => {
      setCode(c);
      setAssignmentId(id);
    });
  }, [params]);

  // ── Resolve room_code → lobby_id ──────────────────────
  useEffect(() => {
    if (!code) return;

    const init = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: lobby } = await supabase
          .from("lobbies")
          .select("id, phase")
          .eq("room_code", code)
          .single();

        if (!lobby) {
          setError("Lobby not found");
          setLoading(false);
          return;
        }

        setLobbyId(lobby.id);

        if (lobby.phase === "waiting") {
          router.push(`/lobby/${code}`);
        }
      } catch (err) {
        logger.error("TaskDetailPage", "Failed to resolve lobby", err);
        setError("Failed to load lobby");
        setLoading(false);
      }
    };

    init();
  }, [code, router]);

  // ── Fetch detail data ────────────────────────────────
  const loadDetail = useCallback(
    async (lobby: string, taskId: string) => {
      logger.debug("TaskDetailPage", "Fetch detail", {
        lobbyId: lobby,
        taskId,
      });
      try {
        const supabase = createBrowserClient();

        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Fetch assignment with strategy (including images) and user profile
        const { data: assignment, error: assignErr } = await supabase
          .from("task_assignments")
          .select(
            "*, strategy:strategy_templates(*, images:strategy_images(*)), user:profiles(*)",
          )
          .eq("id", taskId)
          .eq("lobby_id", lobby)
          .single();

        if (assignErr || !assignment) {
          logger.warn("TaskDetailPage", "Assignment not found", {
            taskId,
            error: assignErr,
          });
          setError("Task assignment not found");
          setLoading(false);
          return;
        }

        const fullAssignment = assignment as TaskAssignment & {
          strategy: (StrategyTemplate & { images: StrategyImage[] }) | null;
          user: Profile | null;
        };

        // Fetch hotspots for this strategy
        let hotspots: StrategyHotspot[] = [];
        let map: Map | null = null;
        if (fullAssignment.strategy) {
          const { data: hs } = await supabase
            .from("strategy_hotspots")
            .select("*")
            .eq("strategy_id", fullAssignment.strategy_id);

          hotspots = (hs ?? []) as StrategyHotspot[];

          // Fetch map for tactical background
          if (fullAssignment.strategy.map_id) {
            const { data: mapData } = await supabase
              .from("maps")
              .select("id, name, image_url")
              .eq("id", fullAssignment.strategy.map_id)
              .maybeSingle();

            map = (mapData as Map) ?? null;
          }
        }

        // Fetch vote counts
        const { data: votes } = await supabase
          .from("task_votes")
          .select("vote_type")
          .eq("task_assignment_id", taskId);

        let upvotes = 0;
        let downvotes = 0;
        for (const v of (votes ?? []) as { vote_type: "up" | "down" }[]) {
          if (v.vote_type === "up") upvotes++;
          else if (v.vote_type === "down") downvotes++;
        }

        // Fetch current user's vote
        const { data: myVote } = await supabase
          .from("task_votes")
          .select("vote_type")
          .eq("task_assignment_id", taskId)
          .eq("user_id", userData.user.id)
          .maybeSingle();

        const userVote: "up" | "down" | null =
          (myVote?.vote_type as "up" | "down") ?? null;

        setData({
          assignment: fullAssignment,
          map,
          hotspots,
          upvotes,
          downvotes,
          userVote,
        });
      } catch (err) {
        logger.error("TaskDetailPage", "Failed to load detail", err);
        setError("Failed to load task details");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!lobbyId || !assignmentId) return;
    loadDetail(lobbyId, assignmentId);
  }, [lobbyId, assignmentId, loadDetail]);

  // ── Vote handler ──────────────────────────────────────
  const handleVote = useCallback(
    async (voteType: "up" | "down" | null) => {
      if (!lobbyId || !assignmentId || !data) return;

      const oldUp = data.upvotes;
      const oldDown = data.downvotes;
      const oldVote = data.userVote;

      // Optimistic
      let newUp = oldUp;
      let newDown = oldDown;
      if (oldVote === "up") newUp = Math.max(0, newUp - 1);
      if (oldVote === "down") newDown = Math.max(0, newDown - 1);
      if (voteType === "up") newUp++;
      if (voteType === "down") newDown++;

      setData((prev) =>
        prev
          ? { ...prev, upvotes: newUp, downvotes: newDown, userVote: voteType }
          : prev,
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
          logger.warn("TaskDetailPage", "Vote failed, refetching");
          loadDetail(lobbyId, assignmentId);
          return;
        }

        const json = await res.json();
        setData((prev) =>
          prev
            ? {
                ...prev,
                upvotes: json.upvotes,
                downvotes: json.downvotes,
                userVote: json.user_vote,
              }
            : prev,
        );
      } catch {
        loadDetail(lobbyId, assignmentId);
      }
    },
    [lobbyId, assignmentId, data, loadDetail],
  );

  // ── Helpers ───────────────────────────────────────────
  function getOrderedImages(
    strategy: StrategyTemplate & { images: StrategyImage[] },
  ): StrategyImage[] {
    if (strategy.images && strategy.images.length > 0) {
      return [...strategy.images].sort((a, b) => a.sort_order - b.sort_order);
    }
    // Fallback: synthetic image from primary image_url
    return [
      {
        id: "primary",
        strategy_id: strategy.id,
        image_url: strategy.image_url,
        sort_order: 0,
        caption: null,
        created_at: strategy.created_at,
      },
    ];
  }

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-neutral-800 animate-pulse" />
            <div className="h-5 w-48 rounded bg-neutral-800 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded bg-neutral-800 animate-pulse" />
            <div className="h-6 w-8 rounded bg-neutral-800 animate-pulse" />
            <div className="size-8 rounded bg-neutral-800 animate-pulse" />
          </div>
        </header>
        <div className="p-5">
          <div className="aspect-video rounded-xl bg-neutral-800 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-neutral-800 animate-pulse mt-5" />
          <div className="h-3 w-full rounded bg-neutral-800/60 animate-pulse mt-3" />
          <div className="h-3 w-5/6 rounded bg-neutral-800/60 animate-pulse mt-2" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 min-w-[80px] rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50"
            onClick={() => router.push(`/lobby/${code}/tasks`)}
          >
            <svg
              className="size-4 mr-1"
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
          title={error ?? "Task not found"}
          description="Could not load this task assignment."
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-[120px] rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={() => router.push(`/lobby/${code}/tasks`)}
            >
              Back to Feed
            </Button>
          }
          className="flex-1"
        />
      </div>
    );
  }

  const { assignment, hotspots } = data;
  const { strategy } = assignment;
  const score = data.upvotes - data.downvotes;

  // ── Strategy removed ────────────────────────────────────
  if (!strategy) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 min-w-[80px] rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50"
            onClick={() => router.push(`/lobby/${code}/tasks`)}
          >
            <svg
              className="size-4 mr-1"
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-lg font-bold text-neutral-500">
              Strategy removed
            </h1>
            <p className="text-sm text-neutral-600 mt-2">
              This strategy is no longer available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const images = getOrderedImages(strategy);
  const safeIdx = Math.min(activeImageIdx, images.length - 1);
  const currentImage = images[safeIdx];

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 min-w-[80px] rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50 transition-all duration-200 active:scale-95"
          onClick={() => router.push(`/lobby/${code}/tasks`)}
        >
          <svg
            className="size-4 mr-1"
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

        <h1 className="text-base font-bold truncate max-w-[50%]">
          {strategy.title}
        </h1>

        <VoteButtons
          score={score}
          userVote={data.userVote}
          onVote={handleVote}
          orientation="horizontal"
          size="md"
        />
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 pb-8 max-w-2xl mx-auto w-full">
          {/* ── Image Gallery ──────────────────────────────── */}
          {images.length > 0 && (
            <div className="space-y-3">
              {images.length === 1 ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-neutral-800">
                  <img
                    src={currentImage.image_url}
                    alt={currentImage.caption ?? strategy.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800">
                  <img
                    src={currentImage.image_url}
                    alt={currentImage.caption ?? strategy.title}
                    loading={activeImageIdx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="w-full h-full object-cover"
                  />

                  {/* Prev button */}
                  <button
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev > 0 ? prev - 1 : images.length - 1,
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-black/50 flex items-center justify-center text-neutral-300 hover:bg-black/70 hover:text-neutral-50 transition-all"
                    aria-label="Previous image"
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
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  {/* Next button */}
                  <button
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev < images.length - 1 ? prev + 1 : 0,
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-black/50 flex items-center justify-center text-neutral-300 hover:bg-black/70 hover:text-neutral-50 transition-all"
                    aria-label="Next image"
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
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Caption */}
              {currentImage.caption && (
                <p className="text-xs text-neutral-500 text-center">
                  {currentImage.caption}
                </p>
              )}

              {/* Dots */}
              {images.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIdx(i)}
                      className={cn(
                        "size-2 rounded-full transition-all",
                        i === safeIdx
                          ? "bg-amber-500 w-4"
                          : "bg-neutral-600 hover:bg-neutral-500",
                      )}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Description ──────────────────────────────── */}
          <div className="mt-8 pt-6 border-t border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Description
            </h2>
            {strategy.description ? (
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                {strategy.description}
              </p>
            ) : (
              <p className="text-sm text-neutral-600 italic">
                No description provided.
              </p>
            )}
          </div>

          {/* ── Tactical Map ──────────────────────────────── */}
          {hotspots.length > 0 && data.map && (
            <div className="mt-8 pt-6 border-t border-amber-500/20">
              <h2 className="text-sm font-semibold text-amber-500/80 uppercase tracking-wider mb-3">
                Tactical Map
              </h2>
              {data.map.image_url ? (
                <MapViewer
                  imageUrl={data.map.image_url}
                  hotspots={hotspots.map((h) => ({
                    x_percent: h.x_percent,
                    y_percent: h.y_percent,
                    label: h.label ?? "",
                  }))}
                />
              ) : (
                <div className="aspect-video rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center gap-2">
                  <svg
                    className="size-6 text-neutral-600"
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
                  <span className="text-neutral-600 text-sm">
                    Map image not available for {data.map.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Meta info ─────────────────────────────────── */}
          <div className="mt-8 pt-6 border-t border-neutral-800 flex items-center gap-3 text-sm text-neutral-500">
            <svg
              className="size-4 text-neutral-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>
              Assigned by{" "}
              <span className="text-neutral-300 font-medium">
                {assignment.user?.username ?? "Unknown"}
              </span>
            </span>
            <span className="text-neutral-700">·</span>
            <span>
              {new Date(assignment.assigned_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
