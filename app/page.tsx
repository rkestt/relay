"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logger } from "@/lib/logger";
import { PlusIcon, RefreshIcon, AlertIcon } from "@/components/icons";

const ROOM_CODE_KEY = "r6hub_room_code";

export default function HomePage() {
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [rejoinCode, setRejoinCode] = useState<string | null>(null);

  // Read rejoin code from localStorage after mount (avoid hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(ROOM_CODE_KEY);
    if (stored) {
      setRejoinCode(stored);
    }
  }, []);
  const [startingSide, setStartingSide] = useState<"attacker" | "defender">("attacker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log mount + rejoin code
  useEffect(() => {
    logger.info("Landing", "Landing mount");
    if (rejoinCode) {
      logger.info("Landing", "Rejoin code found in storage", { code: rejoinCode });
    }
  }, [rejoinCode]);

  const handleCreate = useCallback(async () => {
    logger.info("Landing", "Create lobby click", { startingSide });
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starting_side: startingSide }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create lobby");
      }
      const { lobby } = await res.json();
      logger.info("Landing", "Lobby created", { room_code: lobby.room_code, startingSide: lobby.starting_side });
      localStorage.setItem(ROOM_CODE_KEY, lobby.room_code);
      router.push(`/lobby/${lobby.room_code}`);
    } catch (err) {
      logger.error("Landing", "Create lobby failed", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router, startingSide]);

  const handleJoin = useCallback(async () => {
    if (!roomCode.trim()) return;
    logger.info("Landing", "Join lobby click", { code: roomCode.trim().toUpperCase() });
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lobby/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_code: roomCode.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to join lobby");
      }
      const { lobby } = await res.json();
      logger.info("Landing", "Lobby joined", { room_code: lobby.room_code });
      localStorage.setItem(ROOM_CODE_KEY, lobby.room_code);
      router.push(`/lobby/${lobby.room_code}`);
    } catch (err) {
      logger.error("Landing", "Join lobby failed", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router, roomCode]);

  const handleRejoin = useCallback(async () => {
    if (!rejoinCode) return;
    logger.info("Landing", "Rejoin", { code: rejoinCode });
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lobby/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_code: rejoinCode }),
      });
      if (!res.ok) {
        localStorage.removeItem(ROOM_CODE_KEY);
        setRejoinCode(null);
        const data = await res.json();
        throw new Error(data.error ?? "Failed to rejoin lobby");
      }
      const { lobby } = await res.json();
      logger.info("Landing", "Rejoin successful", { room_code: lobby.room_code });
      router.push(`/lobby/${lobby.room_code}`);
    } catch (err) {
      logger.error("Landing", "Rejoin failed", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router, rejoinCode]);

  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">

      {/* ── Hero ──────────────────────────────────────── */}
      <main className="flex flex-col flex-1 items-center justify-center px-6 py-32 gap-20">

        {/* Logomark + Title */}
        <div className="flex flex-col items-center gap-5 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-border bg-card">
            <svg
              aria-hidden="true"
              className="size-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              r6hub
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              Tactical sync for Rainbow Six Siege
            </p>
          </div>
        </div>

        {/* ── CTA Buttons ──────────────────────────────── */}
        <div className="flex flex-col gap-3 w-full max-w-xs">

          {/* Starting side selector */}
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase text-center">
              Your team starts as
            </span>
            <div className="flex rounded-xl bg-card border border-border p-1">
              <Button
                type="button"
                variant={startingSide === "attacker" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStartingSide("attacker")}
                className={cn(
                  "flex-1",
                  startingSide === "attacker" && "bg-attacker hover:bg-attacker/90"
                )}
              >
                Attacker
              </Button>
              <Button
                type="button"
                variant={startingSide === "defender" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStartingSide("defender")}
                className={cn(
                  "flex-1",
                  startingSide === "defender" && "bg-defender hover:bg-defender/90"
                )}
              >
                Defender
              </Button>
            </div>
          </div>

          {/* Create lobby — primary red-orange action */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            <Button
              size="lg"
              className={cn(
                "w-full h-14 rounded-lg text-base font-bold tracking-wide",
                "bg-primary text-primary-foreground",
                "hover:bg-primary-hover active:bg-primary-active active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-150",
                "shadow-[0_0_24px_-4px_var(--primary)]"
              )}
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating…
                </span>
              ) : (
                <>
                  <PlusIcon className="size-5 mr-2" />
                  Create Lobby
                </>
              )}
            </Button>
          </div>

          {/* Join lobby */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "w-full h-14 rounded-lg text-base font-semibold tracking-wide",
                "border-border text-foreground",
                "hover:bg-muted hover:border-border",
                "active:scale-[0.98] transition-all duration-150"
              )}
              onClick={() => {
                logger.info("Landing", "Join modal opened");
                setShowJoinModal(true);
                setRoomCode("");
                setError(null);
              }}
              disabled={loading}
            >
              <svg
                aria-hidden="true"
                className="size-5 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Join Lobby
            </Button>
          </div>

          {/* Rejoin — ghost, only shown when there's a stored session */}
          {rejoinCode && (
            <div className="animate-in fade-in duration-300">
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "w-full h-12 rounded-lg text-sm font-medium text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  "active:scale-[0.98] transition-all duration-150"
                )}
                onClick={handleRejoin}
                disabled={loading}
              >
                <RefreshIcon className="size-4 mr-2" />
                Rejoin Lobby ({rejoinCode})
              </Button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-bottom-1 duration-200"
            role="alert"
            aria-live="polite"
          >
             <AlertIcon className="size-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}
      </main>

      {/* ── Join Modal ──────────────────────────────────── */}
      {showJoinModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowJoinModal(false);
          }}
        >
          <div
            className={cn(
              "w-full max-w-sm bg-popover border border-border rounded-xl p-6 shadow-lg",
              "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            )}
          >
            <h2 className="text-lg font-bold text-foreground mb-1">
              Join Lobby
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Enter the 6-character room code shared by your squad leader.
            </p>

            {/* Code input */}
            <Input
              type="text"
              value={roomCode}
              onChange={(e) =>
                setRoomCode(e.target.value.toUpperCase().slice(0, 6))
              }
              placeholder="XXXXXX"
              maxLength={6}
              className={cn(
                "h-14 text-center text-2xl font-mono font-bold tracking-[0.3em] uppercase rounded-xl",
                "bg-muted border-2 transition-all duration-150 mb-5",
                "placeholder:text-muted-foreground/30 placeholder:tracking-normal",
                error
                  ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                  : "border-border focus:border-primary focus:ring-primary/20",
                "hover:border-foreground/20"
              )}
              autoFocus
              aria-label="Room code"
            />

            {/* Inline error inside modal */}
            {error && (
              <p className="text-sm text-destructive mb-4 text-center animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </p>
            )}

            {/* Modal actions */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "flex-1 h-12 rounded-lg text-sm font-medium text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  "active:scale-[0.98] transition-all duration-150"
                )}
                onClick={() => setShowJoinModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                className={cn(
                  "flex-1 h-12 rounded-lg text-sm font-bold",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary-hover active:bg-primary-active active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-150"
                )}
                onClick={handleJoin}
                disabled={roomCode.length !== 6 || loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Joining…
                  </span>
                ) : (
                  "Join"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
