"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { VoteUpIcon, VoteDownIcon } from "@/components/icons";

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
  const [animatingVote, setAnimatingVote] = useState<"up" | "down" | null>(null);

  const triggerVoteAnim = useCallback((type: "up" | "down") => {
    setAnimatingVote(type);
    setTimeout(() => setAnimatingVote(null), 200);
  }, []);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerVoteAnim("up");
    onVote(userVote === "up" ? null : "up");
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerVoteAnim("down");
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
          "hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          size === "sm" ? "size-7" : "size-9",
          userVote === "up"
            ? "text-primary"
            : "text-muted-foreground hover:text-primary",
          animatingVote === "up" && "scale-125",
        )}
        aria-label="Upvote"
        aria-pressed={userVote === "up"}
      >
        <VoteUpIcon className={cn(size === "sm" ? "size-4" : "size-5")} />
      </button>

      {/* Score */}
      <span
        className={cn(
          "font-bold tabular-nums leading-none transition-all duration-150",
          size === "sm" ? "text-sm" : "text-lg",
          score > 0
            ? "text-success"
            : score < 0
              ? "text-destructive"
              : "text-muted-foreground",
          animatingVote && "scale-110",
        )}
      >
        {score}
      </span>

      {/* Downvote */}
      <button
        onClick={handleDownvote}
        className={cn(
          "flex items-center justify-center rounded-md transition-all duration-150",
          "hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          size === "sm" ? "size-7" : "size-9",
          userVote === "down"
            ? "text-destructive"
            : "text-muted-foreground hover:text-destructive",
          animatingVote === "down" && "scale-125",
        )}
        aria-label="Downvote"
        aria-pressed={userVote === "down"}
      >
        <VoteDownIcon className={cn(size === "sm" ? "size-4" : "size-5")} />
      </button>
    </div>
  );
}
