"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { BackArrowIcon, CheckIcon, CopyIcon, CrownIcon } from "@/components/icons";
import { Home, Map, Target, Shield, ListTodo } from "lucide-react";
import type { Lobby } from "@/types";

interface LobbyLayoutState {
  lobby: Lobby | null;
  loading: boolean;
  error: string | null;
}

const tabs = [
  { href: "/lobby/[code]", label: "Lobby", icon: Home },
  { href: "/lobby/[code]/map", label: "Map", icon: Map },
  { href: "/lobby/[code]/select", label: "Select", icon: Target },
  { href: "/lobby/[code]/bans", label: "Bans", icon: Shield },
  { href: "/lobby/[code]/tasks", label: "Tasks", icon: ListTodo },
];

function phaseLabel(phase: string) {
  switch (phase) {
    case "waiting":
      return "Waiting";
    case "playing":
      return "Playing";
    case "closed":
      return "Closed";
    default:
      return phase;
  }
}

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const code = (params.code as string) ?? "";
  const [state, setState] = useState<LobbyLayoutState>({
    lobby: null,
    loading: true,
    error: null,
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const [{ data: userData }, { data: lobbyData, error: lobbyError }] =
          await Promise.all([
            supabase.auth.getUser(),
            supabase.from("lobbies").select("*").eq("room_code", code).single(),
          ]);

        if (cancelled) return;
        if (lobbyError || !lobbyData) {
          setState({ lobby: null, loading: false, error: "Lobby not found" });
          return;
        }
        setCurrentUserId(userData.user?.id ?? null);
        setState({ lobby: lobbyData as Lobby, loading: false, error: null });
      } catch {
        if (cancelled) return;
        setState({ lobby: null, loading: false, error: "Failed to load lobby" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (state.loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <SkeletonCard />
      </div>
    );
  }

  if (state.error || !state.lobby) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="rounded-lg border border-outline bg-surface-container p-6 text-center">
          <h1 className="text-lg font-semibold text-on-surface">Lobby not found</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{state.error}</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </div>
    );
  }

  const isLeader = currentUserId === state.lobby.leader_id;

  return (
    <div className="flex flex-col">
      <header className="sticky top-16 z-30 bg-surface-container shadow-2 border-b border-outline/20">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => router.push("/")}
                aria-label="Go home"
              >
                <BackArrowIcon className="size-5" />
              </Button>

              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-lg font-semibold text-on-surface truncate">
                  Room {code}
                </h1>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                    "bg-surface-container-high text-on-surface-variant",
                    "hover:text-on-surface transition-colors duration-fast"
                  )}
                  aria-label="Copy room code"
                >
                  {copied ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <CopyIcon className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  state.lobby.phase === "playing" && "bg-success/15 text-success",
                  state.lobby.phase === "waiting" && "bg-tertiary/15 text-tertiary",
                  state.lobby.phase === "closed" && "bg-surface-variant text-on-surface-variant"
                )}
              >
                {phaseLabel(state.lobby.phase)}
              </span>

              {isLeader && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                  <CrownIcon className="size-3.5" />
                  Leader
                </span>
              )}
            </div>
          </div>

          <nav
            className="mt-3 flex items-center gap-1 overflow-x-auto pb-1"
            aria-label="Lobby tabs"
          >
            {tabs.map(({ href, label, icon: Icon }) => {
              const path = href.replace("[code]", code);
              const active = pathname === path || pathname.startsWith(`${path}/`);
              return (
                <Link
                  key={path}
                  href={path}
                  className={cn(
                    "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-fast",
                    active
                      ? "bg-surface-container-high text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</div>
    </div>
  );
}
