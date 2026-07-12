"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { useLobbyStore } from "@/stores/lobbyStore";
import { cn } from "@/lib/utils";
import { CopyIcon, CheckIcon } from "@/components/icons";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

function LobbyCodeBadge() {
  const lobbyCode = useLobbyStore((s) => s.lobbyCode);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!lobbyCode) return;
    try {
      await navigator.clipboard.writeText(lobbyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [lobbyCode]);

  if (!lobbyCode) {
    return (
      <div className="h-7 w-24 rounded-lg bg-muted animate-pulse" />
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border">
      <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
        Room
      </span>
      <span className="font-mono text-sm font-bold tracking-wider text-foreground">
        {lobbyCode}
      </span>
      <button
        onClick={handleCopy}
        className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
        aria-label={copied ? "Copied" : "Copy room code"}
      >
        {copied ? (
          <CheckIcon className="size-3.5 text-success" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
      </button>
    </div>
  );
}

function RoundBadge() {
  const currentRound = useLobbyStore((s) => s.currentRound);

  if (!currentRound) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Round {currentRound.round_number}
      </span>
      {currentRound.team_side && (
        <span
          className={cn(
            "text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded",
            currentRound.team_side === "attacker"
              ? "bg-attacker/15 text-attacker"
              : "bg-defender/15 text-defender",
          )}
        >
          {currentRound.team_side}
        </span>
      )}
    </div>
  );
}

function PhaseBadge() {
  const phase = useLobbyStore((s) => s.phase);
  const currentRound = useLobbyStore((s) => s.currentRound);
  const mapId = useLobbyStore((s) => s.mapId);

  const derived = (() => {
    if (phase === "closed") return { label: "Closed", color: "text-destructive border-destructive/20" };
    if (phase === "playing" && mapId) return { label: "In Game", color: "text-success border-success/20" };
    if (phase === "playing" && !mapId) return { label: "Map Selection", color: "text-primary border-primary/20" };
    if (phase === "waiting") return { label: "Waiting Room", color: "text-muted-foreground border-border" };
    if (currentRound) return { label: "In Game", color: "text-success border-success/20" };
    return { label: "Waiting Room", color: "text-muted-foreground border-border" };
  })();

  return (
    <span
      className={cn(
        "text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-lg border",
        derived.color,
      )}
    >
      {derived.label}
    </span>
  );
}

function UserAvatarButton() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user) {
    return <div className="size-9 rounded-full bg-muted animate-pulse" />;
  }

  const name = user.user_metadata?.name || user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url;
  const initial = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    localStorage.removeItem("r6hub_room_code");
    router.push("/login");
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="size-9 rounded-full border border-border overflow-hidden hover:border-primary/50 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            fill
            sizes="36px"
            className="object-cover"
            unoptimized={avatarUrl.startsWith("blob:") || avatarUrl.startsWith("data:")}
          />
        ) : (
          <span className="flex size-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-50 animate-in fade-in duration-150">
          <div className="px-4 py-3 text-sm text-foreground border-b border-border truncate">
            {name}
          </div>
          <Link
            href="/settings/account"
            className="block w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 rounded-b-lg"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const connectionStatus = useLobbyStore((s) => s.connectionStatus);

  return (
    <header className="h-16 shrink-0 border-b border-border bg-card flex items-center px-5 gap-4">
      <div className="flex items-center gap-4 shrink-0">
        <span className="font-mono font-bold text-lg tracking-tight text-foreground">
          r6hub
        </span>
        <div className="w-px h-6 bg-border" />
        <LobbyCodeBadge />
      </div>

      <div className="flex-1 flex items-center justify-center gap-3">
        <RoundBadge />
        <PhaseBadge />
        {connectionStatus === "connecting" && (
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-warning uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-warning animate-pulse" />
            Connecting
          </span>
        )}
        {connectionStatus === "error" && (
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-destructive uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-destructive" />
            Disconnected
          </span>
        )}
      </div>

      <div className="flex items-center shrink-0">
        <UserAvatarButton />
      </div>
    </header>
  );
}
