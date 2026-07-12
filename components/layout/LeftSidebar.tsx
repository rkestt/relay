"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/fetch";
import {
  UsersIcon,
  MapIcon,
  LockIcon,
  CheckIcon,
  CrownIcon,
  XIcon,
} from "@/components/icons";
import Image from "next/image";

function CircleXIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-5", className)}
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
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

function NavLinks() {
  const pathname = usePathname();
  const lobbyCode = useLobbyStore((s) => s.lobbyCode);
  const isLeader = useLobbyStore((s) => s.isLeader);
  const mapId = useLobbyStore((s) => s.mapId);

  if (!lobbyCode) return null;

  const items: NavItem[] = [
    { label: "Lobby", href: `/lobby/${lobbyCode}`, icon: UsersIcon, shortcut: "0" },
    ...(isLeader
      ? [
          { label: "Bans", href: `/lobby/${lobbyCode}/bans`, icon: CircleXIcon, shortcut: "1" },
          ...(!mapId
            ? [{ label: "Map", href: `/lobby/${lobbyCode}/map`, icon: MapIcon, shortcut: "2" }]
            : []),
        ]
      : []),
    { label: "Select", href: `/lobby/${lobbyCode}/select`, icon: LockIcon, shortcut: "3" },
    { label: "Tasks", href: `/lobby/${lobbyCode}/tasks`, icon: CheckIcon, shortcut: "4" },
  ];

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {items.map((item) => {
        const isActive =
          item.href === `/lobby/${lobbyCode}`
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <kbd className="hidden lg:inline-flex items-center justify-center size-5 rounded bg-muted text-[10px] font-mono text-muted-foreground/60 border border-border/50">
                {item.shortcut}
              </kbd>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function MembersList() {
  const members = useLobbyStore((s) => s.members);
  const memberProfiles = useLobbyStore((s) => s.memberProfiles);
  const leaderId = useLobbyStore((s) => s.leaderId);

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <div className="size-8 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {members.map((member) => {
        const profile = memberProfiles.get(member.user_id);
        const username = profile?.username ?? "Unknown";
        const avatarUrl = profile?.avatar_url;
        const isLeader = member.user_id === leaderId;
        const initial = username.charAt(0).toUpperCase();

        return (
          <div
            key={member.user_id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors duration-150"
          >
            <div className="size-8 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0 relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover"
                  unoptimized={
                    avatarUrl.startsWith("blob:") ||
                    avatarUrl.startsWith("data:")
                  }
                />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {initial}
                </span>
              )}
            </div>
            <span className="text-sm text-foreground truncate min-w-0 flex-1">
              {username}
            </span>
            {isLeader && (
              <CrownIcon className="size-3.5 text-warning shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LeaveButton() {
  const lobbyId = useLobbyStore((s) => s.lobbyId);
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLeave = useCallback(async () => {
    if (!lobbyId) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/api/lobby/${lobbyId}/leave`, { method: "POST" });
      localStorage.removeItem("r6hub_room_code");
      router.push("/");
    } catch {
      setConfirming(false);
      setLoading(false);
    }
  }, [lobbyId, confirming, router]);

  return (
    <div className="p-3 border-t border-border">
      <button
        onClick={handleLeave}
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
          confirming
            ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
            : "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
          loading && "opacity-50 pointer-events-none",
        )}
      >
        <XIcon className="size-4" />
        {confirming ? "Confirm Leave" : "Leave Lobby"}
      </button>
    </div>
  );
}

export function LeftSidebar() {
  const membersCount = useLobbyStore((s) => s.members.length);

  return (
    <aside aria-label="Lobby navigation" className="w-70 shrink-0 border-r border-border bg-card flex flex-col h-full">
      <NavLinks />

      <div className="h-px bg-border mx-3" />

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="px-3 pt-3 pb-2">
          <h3 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Members
            <span className="ml-2 text-muted-foreground/60 font-normal tracking-normal normal-case">
              {membersCount}
            </span>
          </h3>
        </div>
        <div className="px-1.5 flex-1">
          <MembersList />
        </div>
      </div>

      <LeaveButton />
    </aside>
  );
}
