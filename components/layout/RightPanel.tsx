"use client";

import { useMemo } from "react";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "size-4"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ScoreDisplay() {
  const rounds = useLobbyStore((s) => s.rounds);

  const score = useMemo(
    () =>
      rounds.reduce(
        (acc, r) => {
          if (r.status === "completed" && r.winner_side) {
            acc[r.winner_side]++;
          }
          return acc;
        },
        { attacker: 0, defender: 0 },
      ),
    [rounds],
  );

  const hasScore = score.attacker > 0 || score.defender > 0;
  if (!hasScore) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-3">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-bold tracking-wider uppercase text-attacker">
          Atk
        </span>
        <span className="text-2xl font-black text-attacker tabular-nums">
          {score.attacker}
        </span>
      </div>
      <span className="text-lg font-bold text-muted-foreground">—</span>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-bold tracking-wider uppercase text-defender">
          Def
        </span>
        <span className="text-2xl font-black text-defender tabular-nums">
          {score.defender}
        </span>
      </div>
    </div>
  );
}

function ConnectionDot() {
  const status = useLobbyStore((s) => s.connectionStatus);

  const config = {
    connected: { color: "bg-success", label: "Connected" },
    connecting: { color: "bg-warning animate-pulse", label: "Connecting" },
    disconnected: { color: "bg-muted-foreground", label: "Disconnected" },
    error: { color: "bg-destructive", label: "Error" },
  } as const;

  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2 rounded-full", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function PanelContent() {
  const phase = useLobbyStore((s) => s.phase);
  const currentRound = useLobbyStore((s) => s.currentRound);
  const membersCount = useLobbyStore((s) => s.members.length);
  const bansCount = useLobbyStore((s) => s.bans.length);
  const mapId = useLobbyStore((s) => s.mapId);

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-3">
        <h4 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Status
        </h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Phase</span>
            <span className="text-xs font-medium text-foreground capitalize">
              {phase ?? "waiting"}
            </span>
          </div>
          {currentRound && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Round</span>
              <span className="text-xs font-medium text-foreground tabular-nums">
                {currentRound.round_number}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Members</span>
            <span className="text-xs font-medium text-foreground tabular-nums">
              {membersCount}
            </span>
          </div>
          {bansCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bans</span>
              <span className="text-xs font-medium text-destructive tabular-nums">
                {bansCount}
              </span>
            </div>
          )}
          {mapId && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Map</span>
              <span className="text-xs font-medium text-success">Set</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-border" />

      <ScoreDisplay />

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Connection
        </h4>
        <ConnectionDot />
      </div>
    </div>
  );
}

export function RightPanel() {
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);

  return (
    <aside
      aria-label="Lobby context"
      className={cn(
        "shrink-0 border-l border-border bg-card flex flex-col overflow-hidden transition-[width] duration-250 ease-out",
        rightPanelOpen ? "w-80" : "w-0 border-l-0",
      )}
    >
      <div className="w-80 shrink-0 flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Lobby Context
          </h3>
          <button
            onClick={toggleRightPanel}
            className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
            aria-label="Close context panel"
          >
            <ChevronRightIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rightPanelOpen && <PanelContent />}
        </div>
      </div>
    </aside>
  );
}
