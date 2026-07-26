"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MatchCompleteProps {
  score: { attacker: number; defender: number } | null;
  winner: string | null;
  onBackToHome: () => void;
}

export function MatchComplete({ score, winner, onBackToHome }: MatchCompleteProps) {
  return (
    <section className="flex flex-col items-center justify-center flex-1 gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">
          Match Complete
        </span>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-wider uppercase text-attacker">Attackers</span>
            <span className="text-4xl font-black text-attacker">{score?.attacker ?? 0}</span>
          </div>
          <span className="text-2xl font-bold text-on-surface-variant">—</span>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-wider uppercase text-defender">Defenders</span>
            <span className="text-4xl font-black text-defender">{score?.defender ?? 0}</span>
          </div>
        </div>
      </div>
      {winner && (
        <div className={cn(
          "px-6 py-3 rounded-xl border font-bold text-lg tracking-wide",
          winner === "attacker"
            ? "bg-attacker/10 border-attacker/30 text-attacker"
            : "bg-defender/10 border-defender/30 text-defender"
        )}>
          {winner === "attacker" ? "Attackers" : "Defenders"} Win!
        </div>
      )}
      <Button
        variant="outlined"
        size="lg"
        className="h-12 rounded-xl text-sm font-semibold"
        onClick={onBackToHome}
      >
        Back to Home
      </Button>
    </section>
  );
}
