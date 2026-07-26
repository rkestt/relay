"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LeaderControlsProps {
  onSetBans: () => void;
  onNewRound: () => void;
}

export function LeaderControls({ onSetBans, onNewRound }: LeaderControlsProps) {
  return (
    <section className="flex flex-col gap-3 mt-auto pt-4 border-t border-outline-variant animate-in fade-in duration-300">
      <p className="text-xs text-on-surface-variant font-medium">
        Squad Leader Actions
      </p>
      <div className="flex gap-3">
        <Button
          variant="outlined"
          size="lg"
          className={cn(
            "flex-1 h-12 rounded-xl text-sm font-semibold",
            "border-primary/30 text-primary",
            "hover:bg-primary/10 hover:text-primary-hover",
            "active:scale-[0.98] transition-all duration-200"
          )}
          onClick={onSetBans}
        >
          <svg
            className="size-4 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          Set Bans
        </Button>
        <Button
          variant="outlined"
          size="lg"
          className={cn(
            "flex-1 h-12 rounded-xl text-sm font-semibold",
            "border-primary/30 text-primary",
            "hover:bg-primary/10 hover:text-primary-hover",
            "active:scale-[0.98] transition-all duration-200"
          )}
          onClick={onNewRound}
        >
          <svg
            className="size-4 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          New Round
        </Button>
      </div>
    </section>
  );
}
