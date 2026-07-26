"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckIcon, CrownIcon, UsersIcon } from "@/components/icons";
import Image from "next/image";
import type { LobbyMember, Operator, Profile } from "@/types";

interface PlayingPhaseProps {
  members: (LobbyMember & { profiles: Profile | null })[];
  leaderId: string;
  operators: Operator[];
  selections: unknown[];
  bans: {
    id: string;
    operator_id: string;
    side: "attacker" | "defender";
    operators: { id: string; name: string; side: "attacker" | "defender"; icon_url: string | null } | null;
  }[];
  score: { attacker: number; defender: number };
  currentRound: { id: string; round_number: number; team_side: "attacker" | "defender" | null } | null;
}

export function PlayingPhase({
  members,
  leaderId,
  operators,
  selections,
  bans,
  score,
  currentRound,
}: PlayingPhaseProps) {
  const operatorMap = new Map(operators.map(op => [op.id, op.name]));

  return (
    <>
      {/* Score Display */}
      {score && (
        <section className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-surface-container border border-outline-variant">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-attacker">Attackers</span>
              <span className="text-3xl font-black text-attacker">{score.attacker}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-bold text-on-surface-variant">—</span>
              <span className="text-[10px] font-medium text-on-surface-variant">
                {currentRound
                  ? (currentRound.round_number <= 6 ? "Regulation" : "Overtime")
                  : ""}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-defender">Defenders</span>
              <span className="text-3xl font-black text-defender">{score.defender}</span>
            </div>
          </div>
        </section>
      )}

      {/* Banned Operators */}
      {bans.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-error uppercase mb-3">
            <svg
              className="size-3.5"
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
            Banned Operators
          </h2>
          <div className="flex flex-wrap gap-2">
            {bans.map((ban) =>
              ban.operators ? (
                <div
                  key={ban.id}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-surface-container border border-error/20"
                >
                  {ban.operators.icon_url && (
                    <div className="w-6 h-6 rounded relative overflow-hidden flex-shrink-0">
                      <Image
                        src={ban.operators.icon_url}
                        alt={ban.operators.name}
                        fill
                        sizes="44px"
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span className="text-xs font-medium text-on-surface">
                    {ban.operators.name}
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-error uppercase">
                    Banned
                  </span>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* Squad Members */}
      <section className="animate-in fade-in slide-in-from-bottom-3 duration-400">
        <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-on-surface-variant uppercase mb-3">
          <UsersIcon className="size-3.5" />
          Squad
          <span className="ml-auto text-on-surface-variant font-normal tracking-normal">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </h2>

        {members.length === 0 ? (
          <EmptyState
            title="No members yet"
            description="Share the room code to invite your squad."
            className="py-10"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map((member, index) => {
              const isMemberLeader = leaderId === member.user_id;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-container border border-outline-variant transition-all duration-200 hover:border-outline/80 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-surface-variant border border-outline-variant overflow-hidden flex items-center justify-center relative">
                    {member.profiles?.avatar_url ? (
                      <Image
                        src={member.profiles.avatar_url}
                        alt={member.profiles.username ?? "User"}
                        fill
                        sizes="44px"
                        className="object-cover"
                        unoptimized={member.profiles.avatar_url.startsWith('blob:') || member.profiles.avatar_url.startsWith('data:')}
                      />
                    ) : (
                      <span className="text-sm font-bold text-on-surface-variant">
                        {(member.profiles?.username ?? "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Name + badge */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-on-surface truncate">
                      {member.profiles?.username ?? "Unknown"}
                    </span>
                    {isMemberLeader && (
                      <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-warning uppercase">
                        <CrownIcon className="size-3" />
                        Leader
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Selections */}
      {selections.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-on-surface-variant uppercase mb-3">
            <CheckIcon className="size-3.5" />
            Selections
          </h2>
          <div className="flex flex-col gap-2">
            {selections
              .filter((s) => s && typeof s === "object")
              .map((sel: unknown) => {
                const selection = sel as {
                  user_id: string;
                  map_id: string | null;
                  operator_id: string | null;
                  locked_at: string | null;
                };
                const member = members.find(
                  (m) => m.user_id === selection.user_id
                );
                const isLocked = Boolean(selection.locked_at);
                return (
                  <div
                    key={selection.user_id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200",
                      isLocked
                        ? "bg-success/5 border-success/20"
                        : "bg-surface-container border-outline-variant"
                    )}
                  >
                    <span className="text-sm font-medium text-on-surface min-w-0 truncate">
                      {member?.profiles?.username ?? "Unknown"}
                    </span>
                    <span className="ml-auto text-xs text-on-surface-variant">
                      {selection.operator_id
                        ? `Op: ${operatorMap.get(selection.operator_id) || selection.operator_id}`
                        : selection.map_id
                        ? `Map: ${selection.map_id}`
                        : "Choosing…"}
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-success tracking-wider uppercase">
                        <CheckIcon className="size-3" strokeWidth={2.5} />
                        Locked
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </>
  );
}
