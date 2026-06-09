"use client";

import { cn } from "@/lib/utils";
import { VoteButtons } from "./VoteButtons";
import Image from "next/image";
import type {
  TaskAssignment,
  StrategyTemplate,
  StrategyHotspot,
  StrategyImage,
} from "@/types";

interface StrategyCardProps {
  assignment: TaskAssignment & {
    strategy: StrategyTemplate | null;
    user_vote?: "up" | "down" | null;
    upvotes?: number;
    downvotes?: number;
  };
  hotspots: StrategyHotspot[];
  username?: string;
  onVote: (voteType: "up" | "down" | null) => void;
  onClick: () => void;
}

function getFirstImage(strategy: StrategyTemplate): string | null {
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
        <h3 className="text-base font-semibold text-foreground truncate">
          {strategy.title}
        </h3>

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
