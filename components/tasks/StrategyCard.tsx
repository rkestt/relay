"use client";

import { cn } from "@/lib/utils";
import { VoteButtons } from "./VoteButtons";
import Image from "next/image";
import type {
  TaskAssignment,
  StrategyTemplate,
  StrategyTemplateWithRelations,
  StrategyHotspot,
  Operator,
} from "@/types";

interface StrategyCardProps {
  assignment: TaskAssignment & {
    strategy: StrategyTemplateWithRelations | null;
    user_vote?: "up" | "down" | null;
    upvotes?: number;
    downvotes?: number;
  };
  hotspots: StrategyHotspot[];
  username?: string;
  operators?: Operator[];
  onVote: (voteType: "up" | "down" | null) => void;
  onClick: () => void;
}

function getFirstImage(strategy: StrategyTemplateWithRelations): string | null {
  if (strategy.images && strategy.images.length > 0) {
    const sorted = [...strategy.images].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return sorted[0].image_url;
  }
  return strategy.image_url ?? null;
}

export function StrategyCard({
  assignment,
  username,
  operators,
  onVote,
  onClick,
}: StrategyCardProps) {
  const { strategy } = assignment;
  const score = (assignment.upvotes ?? 0) - (assignment.downvotes ?? 0);

  // ── Strategy removed ──────────────────────────────────
  if (!strategy) {
    return (
      <div className="flex rounded-2xl border border-border bg-card overflow-hidden cursor-default">
        <div className="p-5 w-full">
          <h2 className="text-base font-bold text-muted-foreground">
            Strategy removed
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            This strategy is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const thumbnailUrl = getFirstImage(strategy);
  const imageCount = strategy.images?.length ?? 0;

  // ── Operator badges (main + auxiliaries) ────────
  const opMap = new Map((operators ?? []).map((o) => [o.id, o]));
  const auxOperatorIds = (strategy.strategy_operators ?? [])
    .map((so) => so.operator_id)
    .filter((id) => id !== strategy.operator_id);
  const showOperators =
    operators &&
    operators.length > 0 &&
    (strategy.operator_id || auxOperatorIds.length > 0);
  const operatorBadge = (id: string, primary: boolean) => {
    const op = opMap.get(id);
    if (!op) return null;
    return (
      <span
        key={id}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          primary
            ? "border-primary/40 bg-primary/15 text-foreground"
            : "border-border bg-card text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full bg-current",
            op.side === "defender" ? "text-defender" : "text-attacker",
          )}
        />
        {op.name}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex rounded-2xl border border-border bg-card overflow-hidden",
        "hover:border-border transition-colors duration-200 cursor-pointer",
      )}
    >
      {/* Vote column */}
      <div className="flex flex-col items-center pt-4 px-2 min-w-[48px]">
        <VoteButtons
          score={score}
          userVote={assignment.user_vote}
          onVote={onVote}
          orientation="vertical"
          size="sm"
        />
      </div>

      {/* Content column */}
      <div className="flex flex-col flex-1 min-w-0 py-4 pr-4 pl-1">
        {/* Title - h3 */}
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground truncate">
            {strategy.title}
          </h3>
          {strategy.side && (
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                strategy.side === "defender"
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
              )}
            >
              {strategy.side === "defender" ? "🛡 DEF" : "🎯 ATK"}
            </span>
          )}
        </div>

        {/* Description - 2-line clamp */}
        {strategy.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-1">
            {strategy.description}
          </p>
        )}

        {/* Thumbnail */}
        {thumbnailUrl ? (
          <div className="mt-3 aspect-video max-h-[160px] overflow-hidden rounded-lg bg-muted relative">
            <Image
              src={thumbnailUrl}
              alt={strategy.title}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
              unoptimized={thumbnailUrl.startsWith('blob:') || thumbnailUrl.startsWith('data:')}
            />
          </div>
        ) : (
          <div className="mt-3 aspect-video max-h-[160px] rounded-lg bg-muted border border-border flex items-center justify-center">
            <svg
              className="size-6 text-muted-foreground"
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
          </div>
        )}

        {/* Operators: main (primary) + auxiliaries */}
        {showOperators && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {strategy.operator_id && operatorBadge(strategy.operator_id, true)}
            {auxOperatorIds.map((id) => operatorBadge(id, false))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>{username ?? "Unknown"}</span>
          {imageCount > 1 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span>
                {imageCount} image{imageCount > 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
