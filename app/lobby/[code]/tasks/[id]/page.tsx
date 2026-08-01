"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { logger } from "@/lib/logger";
import { apiFetch } from "@/lib/fetch";
import { VoteButtons } from "@/components/tasks/VoteButtons";
import Image from "next/image";
import type {
  StrategyTemplate,
  StrategyImage,
  TaskAssignment,
  Profile,
  Map,
} from "@/types";
import { AlertIcon, ArrowRightIcon, BackArrowIcon, CheckIcon, SpinnerIcon, UserIcon } from "@/components/icons";

interface DetailData {
  assignment: TaskAssignment & {
    strategy: (StrategyTemplate & { images: StrategyImage[] }) | null;
    user: Profile | null;
  };
  map: Map | null;
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
  const [finishing, setFinishing] = useState(false);
  const [, setCurrentUserId] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // ── Finish round: return to lobby home ─────────
  const handleFinish = useCallback(() => {
    if (finishing) return;
    setFinishing(true);
    router.push(`/lobby/${code}`);
  }, [finishing, router, code]);

  useEffect(() => {
    logger.info("TaskDetailPage", "Mount");
    params.then(({ code: c, id }) => {
      setCode(c);
      setAssignmentId(id);
    });
  }, [params]);

  // ── Keyboard navigation for gallery ─────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data || !data.assignment.strategy) return;
      const images = getOrderedImages(data.assignment.strategy);
      if (images.length <= 1) return;

      if (e.key === "ArrowLeft") {
        setActiveImageIdx((prev) =>
          prev > 0 ? prev - 1 : images.length - 1,
        );
      } else if (e.key === "ArrowRight") {
        setActiveImageIdx((prev) =>
          prev < images.length - 1 ? prev + 1 : 0,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data]);

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
        setCurrentUserId(userData.user.id);

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

        let map: Map | null = null;
        if (fullAssignment.strategy) {
          // Fetch map for tactical background
          if (fullAssignment.strategy.map_id) {
            const { data: mapData } = await supabase
              .from("maps")
              .select("id, name")
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        const res = await apiFetch(
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
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded bg-muted animate-pulse" />
            <div className="h-6 w-8 rounded bg-muted animate-pulse" />
            <div className="size-8 rounded bg-muted animate-pulse" />
          </div>
        </header>
        <div className="p-5">
          <div className="aspect-video rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse mt-5" />
          <div className="h-3 w-full rounded bg-muted/60 animate-pulse mt-3" />
          <div className="h-3 w-5/6 rounded bg-muted/60 animate-pulse mt-2" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 min-w-[80px] rounded-lg text-sm text-muted-foreground hover:bg-card hover:text-foreground"
            onClick={() => router.push(`/lobby/${code}/tasks`)}
          >
            <BackArrowIcon className="size-4 mr-1" />
            Back
          </Button>
        </header>
        <EmptyState
          icon={<AlertIcon className="size-7 text-destructive" />}
          title={error ?? "Task not found"}
          description="Could not load this task assignment."
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-[120px] rounded-xl border-primary/30 text-primary hover:bg-primary/10"
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

  const { assignment } = data;
  const { strategy } = assignment;
  const score = data.upvotes - data.downvotes;


  // ── Strategy removed ────────────────────────────────────
  if (!strategy) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 min-w-[80px] rounded-lg text-sm text-muted-foreground hover:bg-card hover:text-foreground"
            onClick={() => router.push(`/lobby/${code}/tasks`)}
          >
            <BackArrowIcon className="size-4 mr-1" />
            Back
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-lg font-bold text-muted-foreground">
              Strategy removed
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
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
    <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 min-w-[80px] rounded-lg text-sm text-muted-foreground hover:bg-card hover:text-foreground transition-all duration-200 active:scale-95"
          onClick={() => router.push(`/lobby/${code}/tasks`)}
        >
            <BackArrowIcon className="size-4 mr-1" />
            Back
        </Button>

        <h1 className="text-base font-bold truncate max-w-[40%]">
          {strategy.title}
        </h1>

        <div className="flex items-center gap-3">
          <VoteButtons
            score={score}
            userVote={data.userVote}
            onVote={handleVote}
            orientation="horizontal"
            size="md"
          />
          <Button
            size="sm"
            onClick={handleFinish}
            disabled={finishing}
            className="h-9 min-w-[90px] rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-95 hidden md:inline-flex"
          >
            {finishing ? (
              <SpinnerIcon className="size-4 mr-1.5" />
            ) : (
              <CheckIcon className="size-4 mr-1.5" />
            )}
            Finish
          </Button>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 pb-8 max-w-2xl mx-auto w-full">
          {/* ── Image Gallery ──────────────────────────────── */}
          {images.length > 0 && (
            <div className="space-y-3" ref={galleryRef} aria-label="Strategy image gallery">
              {images.length === 1 ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-muted relative">
                  <Image
                    src={currentImage.image_url}
                    alt={currentImage.caption ?? strategy.title}
                    fill
                    className="object-cover"
                    unoptimized={currentImage.image_url.startsWith('blob:') || currentImage.image_url.startsWith('data:')}
                  />
                </div>
              ) : (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                  <Image
                    src={currentImage.image_url}
                    alt={currentImage.caption ?? strategy.title}
                    fill
                    className="object-cover"
                    unoptimized={currentImage.image_url.startsWith('blob:') || currentImage.image_url.startsWith('data:')}
                  />

                  {/* Prev button */}
                  <button
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev > 0 ? prev - 1 : images.length - 1,
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-black/50 flex items-center justify-center text-muted-foreground hover:bg-black/70 hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-black/50 flex items-center justify-center text-muted-foreground hover:bg-black/70 hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label="Next image"
                  >
                    <ArrowRightIcon className="size-4" />
                  </button>

                  {/* Image counter */}
                  <div className="absolute bottom-2 right-2 z-10 px-2 py-1 rounded-md bg-black/60 text-xs text-foreground font-medium">
                    {safeIdx + 1} / {images.length}
                  </div>
                </div>
              )}

              {/* Caption */}
              {currentImage.caption && (
                <p className="text-xs text-muted-foreground text-center">
                  {currentImage.caption}
                </p>
              )}

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIdx(i)}
                      className={cn(
                        "size-2 rounded-full transition-all duration-200",
                        i === safeIdx
                          ? "bg-primary w-4"
                          : "bg-muted-foreground hover:bg-foreground",
                      )}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Strategy Info ──────────────────────────────── */}
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-foreground">
              {strategy.title}
            </h1>

            {/* Author + timestamp */}
            <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <UserIcon className="size-4" />
                {assignment.user?.username ?? "Unknown"}
              </span>
              <span className="text-muted-foreground">·</span>
              <span>
                {new Date(assignment.assigned_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Map / Site / Operator badges */}
            {data.map && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-medium text-muted-foreground">
                  {data.map.name}
                </span>
              </div>
            )}
          </div>

          {/* ── Description ──────────────────────────────── */}
          <div className="mt-8 pt-6 border-t border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Description
            </h2>
            {strategy.description ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {strategy.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No description provided.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ── Sticky Vote Bar (mobile) ────────────────────── */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm p-3 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <VoteButtons
            score={score}
            userVote={data.userVote}
            onVote={handleVote}
            orientation="horizontal"
            size="md"
          />
          <Button
            size="sm"
            onClick={handleFinish}
            disabled={finishing}
            className="h-11 min-w-[100px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-95"
          >
            {finishing ? (
              <SpinnerIcon className="size-4 mr-1.5" />
            ) : (
              <CheckIcon className="size-4 mr-1.5" />
            )}
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
}
