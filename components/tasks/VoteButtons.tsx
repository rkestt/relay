"use client";

import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  score: number;
  userVote?: "up" | "down" | null;
  onVote: (voteType: "up" | "down" | null) => void;
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md";
}

export function VoteButtons({
  score,
  userVote,
  onVote,
  orientation = "vertical",
  size = "sm",
}: VoteButtonsProps) {
  const isVertical = orientation === "vertical";

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote(userVote === "up" ? null : "up");
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote(userVote === "down" ? null : "down");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 select-none",
        isVertical ? "flex-col" : "flex-row",
      )}
    >
      {/* Upvote */}
      <button
        onClick={handleUpvote}
        className={cn(
          "flex items-center justify-center rounded-md transition-all duration-150",
          "hover:scale-110 active:scale-95",
          size === "sm" ? "size-7" : "size-9",
          userVote === "up"
            ? "text-amber-500"
            : "text-neutral-500 hover:text-amber-400",
        )}
        aria-label="Upvote"
      >
        <svg
          className={cn(size === "sm" ? "size-4" : "size-5")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {/* Score */}
      <span
        className={cn(
          "font-bold tabular-nums leading-none transition-colors duration-150",
          size === "sm" ? "text-sm" : "text-lg",
          userVote === "up"
            ? "text-amber-500"
            : userVote === "down"
              ? "text-red-400"
              : "text-neutral-500",
        )}
      >
        {score}
      </span>

      {/* Downvote */}
      <button
        onClick={handleDownvote}
        className={cn(
          "flex items-center justify-center rounded-md transition-all duration-150",
          "hover:scale-110 active:scale-95",
          size === "sm" ? "size-7" : "size-9",
          userVote === "down"
            ? "text-red-400"
            : "text-neutral-500 hover:text-red-400",
        )}
        aria-label="Downvote"
      >
        <svg
          className={cn(size === "sm" ? "size-4" : "size-5")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
