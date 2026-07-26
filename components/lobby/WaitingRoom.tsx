"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckIcon, CopyIcon, CrownIcon, UsersIcon } from "@/components/icons";
import Image from "next/image";
import type { LobbyMember, Profile } from "@/types";

interface WaitingRoomProps {
  code: string;
  members: (LobbyMember & { profiles: Profile | null })[];
  leaderId: string;
  isLeader: boolean;
  copied: boolean;
  onCopyCode: () => void;
  onStartGame: () => void;
}

export function WaitingRoom({
  code,
  members,
  leaderId,
  isLeader,
  copied,
  onCopyCode,
  onStartGame,
}: WaitingRoomProps) {
  return (
    <>
      {/* Room Code Display */}
      <section className="flex flex-col items-center justify-center gap-3 py-8 animate-in fade-in duration-300">
        <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase">
          Share this code with your squad
        </p>
        <div className="flex items-center gap-3">
          <span className="text-5xl sm:text-6xl font-mono font-black tracking-[0.15em] text-primary select-all">
            {code}
          </span>
          <Button
            variant="text"
            size="icon"
            onClick={onCopyCode}
            className="w-12 h-12 rounded-xl"
            aria-label={copied ? "Code copied" : "Copy room code"}
          >
            {copied ? (
              <CheckIcon className="size-5 text-success" />
            ) : (
              <CopyIcon className="size-5 text-on-surface-variant" />
            )}
          </Button>
        </div>
        {copied && (
          <span className="text-xs text-success font-medium animate-in fade-in" role="status" aria-live="polite">
            Copied!
          </span>
        )}
      </section>

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

      {/* Start Game (leader) / Waiting (non-leader) */}
      {isLeader ? (
        <section className="flex flex-col gap-3 mt-auto pt-4 border-t border-outline-variant animate-in fade-in duration-300">
          <p className="text-xs text-on-surface-variant font-medium">
            Squad Leader Actions
          </p>
          <Button
            size="lg"
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
              "bg-primary text-on-primary",
              "hover:bg-primary-hover active:scale-[0.99]",
              "transition-all duration-200",
              "shadow-1 hover:shadow-2"
            )}
            onClick={onStartGame}
          >
            <svg
              className="size-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Game
          </Button>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center gap-2 mt-auto pt-4 border-t border-outline-variant animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <svg
              className="size-4 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-sm font-medium">
              Waiting for squad leader to start the game…
            </span>
          </div>
        </section>
      )}
    </>
  );
}
