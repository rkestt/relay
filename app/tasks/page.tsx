"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { TaskAssignment, StrategyTemplate, Lobby, Round, Profile } from "@/types";

interface TaskRow {
  id: string;
  strategy_title: string;
  strategy_description: string | null;
  lobby_room_code: string;
  round_number: number;
  assigned_username: string | null;
  assigned_at: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.info("AllTasksPage", "AllTasksPage mount");

    const fetchTasks = async () => {
      try {
        const supabase = createBrowserClient();

        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          logger.debug("AllTasksPage", "No authenticated user");
          setLoading(false);
          return;
        }

        const { data: assignments, error: fetchError } = await supabase
          .from("task_assignments")
          .select(
            "*, strategy:strategy_templates(title, description, image_url), lobby:lobbies(room_code), round:rounds(round_number), user:profiles(username)",
          )
          .order("assigned_at", { ascending: false });

        if (fetchError) {
          logger.error("AllTasksPage", "Failed to fetch tasks", fetchError);
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        const rows: TaskRow[] = ((assignments ?? []) as (TaskAssignment & {
          strategy: Pick<StrategyTemplate, "title" | "description" | "image_url"> | null;
          lobby: Pick<Lobby, "room_code"> | null;
          round: Pick<Round, "round_number"> | null;
          user: Pick<Profile, "username"> | null;
        })[]).map((a) => ({
          id: a.id,
          strategy_title: a.strategy?.title ?? "Unknown Strategy",
          strategy_description: a.strategy?.description ?? null,
          lobby_room_code: a.lobby?.room_code ?? "???",
          round_number: a.round?.round_number ?? 0,
          assigned_username: a.user?.username ?? null,
          assigned_at: a.assigned_at,
        }));

        logger.info("AllTasksPage", "Tasks loaded", { count: rows.length });
        setTasks(rows);
      } catch (err) {
        logger.error("AllTasksPage", "Error loading tasks", err);
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // ── Loading state ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        </header>
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h1 className="text-base font-bold text-foreground">All Tasks</h1>
        </header>
        <EmptyState
          icon={
            <svg
              className="size-7 text-destructive"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          }
          title="Failed to load tasks"
          description={error}
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
      {/* ── Header ───────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h1 className="text-base font-bold text-foreground">All Tasks</h1>
        {tasks.length > 0 && (
          <span className="text-xs text-muted-foreground">{tasks.length} total</span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 pb-8">
          {tasks.length === 0 ? (
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
              title="No tasks found"
              description="You haven't been assigned any tasks yet."
              className="py-20"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {/* ── Table header ───────────────────────── */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <div className="col-span-4">Strategy</div>
                <div className="col-span-2">Lobby</div>
                <div className="col-span-2">Round</div>
                <div className="col-span-2">Assigned To</div>
                <div className="col-span-2 text-right">Date</div>
              </div>

              {/* ── Task rows ──────────────────────────── */}
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/lobby/${task.lobby_room_code}/tasks`}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-start md:items-center",
                    "px-4 py-3 rounded-xl border border-border bg-card",
                    "hover:bg-card/80 hover:border-primary/20 transition-all duration-200",
                    "active:scale-[0.99]",
                  )}
                >
                  {/* Strategy title (mobile: full width) */}
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {task.strategy_title}
                    </p>
                    {task.strategy_description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5 hidden sm:block">
                        {task.strategy_description}
                      </p>
                    )}
                  </div>

                  {/* Lobby room code */}
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono">
                      {task.lobby_room_code}
                    </span>
                  </div>

                  {/* Round number */}
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">
                      Round {task.round_number}
                    </span>
                  </div>

                  {/* Assigned username */}
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">
                      {task.assigned_username ?? "—"}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-right">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(task.assigned_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
