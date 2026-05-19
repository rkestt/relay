"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

const ROOM_CODE_KEY = "r6hub_room_code";

export default function HomePage() {
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [rejoinCode, setRejoinCode] = useState<string | null>(null);
  const [startingSide, setStartingSide] = useState<"attacker" | "defender">("attacker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage on mount for existing room_code
  useEffect(() => {
    logger.info("Landing", "Landing mount");
    const stored = localStorage.getItem(ROOM_CODE_KEY);
    if (stored) {
      logger.info("Landing", "Rejoin code found in storage", { code: stored });
      setRejoinCode(stored);
    }
  }, []);

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
    <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">

      {/* ── Hero ──────────────────────────────────────── */}
      <main className="flex flex-col flex-1 items-center justify-center px-6 py-20 gap-16">

        {/* Logomark + Title */}
        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in slide-in-from-bottom-1 duration-500">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl border border-neutral-800 bg-neutral-900 shadow-[0_0_32px_-8px_rgba(240,240,240,0.08)]"
          >
            <svg
              className="size-8 text-neutral-50"
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

          <div className="flex flex-col gap-1">
            <h1 className="text-5xl font-bold tracking-tight text-neutral-50">
              r6hub
            </h1>
            <p className="text-neutral-400 text-base font-medium tracking-wide">
              Tactical sync for Rainbow Six Siege
            </p>
          </div>
        </div>

        {/* ── CTA Buttons ──────────────────────────────── */}
        <div className="flex flex-col gap-3 w-full max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">

          {/* Starting side selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase text-center">
              Your team starts as
            </span>
            <div className="flex rounded-xl bg-neutral-900 border border-neutral-800 p-1">
              <button
                type="button"
                onClick={() => setStartingSide("attacker")}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  startingSide === "attacker"
                    ? "bg-amber-500 text-neutral-950 shadow-lg"
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                Attacker
              </button>
              <button
                type="button"
                onClick={() => setStartingSide("defender")}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  startingSide === "defender"
                    ? "bg-sky-500 text-neutral-950 shadow-lg"
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                Defender
              </button>
            </div>
          </div>

          {/* Create lobby — primary amber action */}
          <Button
            size="lg"
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
              "bg-amber-500 text-neutral-950",
              "hover:bg-amber-400 active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              "shadow-[0_0_24px_-4px_rgba(245,158,11,0.3)]"
            )}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="size-4 border-2 border-neutral-700 border-t-neutral-950 rounded-full animate-spin" />
                Creating…
              </span>
            ) : (
              <>
                <svg
                  className="size-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Lobby
              </>
            )}
          </Button>

          {/* Join lobby */}
          <Button
            variant="outline"
            size="lg"
            className={cn(
              "w-full h-14 rounded-2xl text-base font-semibold tracking-wide",
              "border-neutral-700 text-neutral-200",
              "hover:bg-neutral-800 hover:border-neutral-600 hover:text-neutral-50",
              "active:scale-[0.98] transition-all duration-200"
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

          {/* Rejoin — ghost, only shown when there's a stored session */}
          {rejoinCode && (
            <Button
              variant="ghost"
              size="lg"
              className={cn(
                "w-full h-12 rounded-xl text-sm font-medium text-neutral-500",
                "hover:bg-neutral-800 hover:text-neutral-300",
                "active:scale-[0.98] transition-all duration-200",
                "animate-in fade-in duration-300"
              )}
              onClick={handleRejoin}
              disabled={loading}
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
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              Rejoin Lobby ({rejoinCode})
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <svg
              className="size-4 text-red-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-400 text-center">{error}</p>
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
              "w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl",
              "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            )}
          >
            <h2 className="text-lg font-bold text-neutral-50 mb-1">
              Join Lobby
            </h2>
            <p className="text-sm text-neutral-400 mb-5">
              Enter the 6-character room code shared by your squad leader.
            </p>

            {/* Code input */}
            <input
              type="text"
              value={roomCode}
              onChange={(e) =>
                setRoomCode(e.target.value.toUpperCase().slice(0, 6))
              }
              placeholder="XXXXXX"
              maxLength={6}
              className={cn(
                "w-full h-14 text-center text-2xl font-mono font-bold tracking-[0.3em] uppercase rounded-xl",
                "bg-neutral-950 border-2 transition-all duration-200 mb-5",
                "placeholder:text-neutral-700 placeholder:tracking-normal",
                "focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20",
                error
                  ? "border-red-400/60 focus:border-red-400 focus:ring-red-400/20"
                  : "border-neutral-700 focus:border-amber-500/60 focus:ring-amber-500/20",
                "hover:border-neutral-600"
              )}
              autoFocus
            />

            {/* Inline error inside modal */}
            {error && (
              <p className="text-sm text-red-400 mb-4 text-center animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </p>
            )}

            {/* Modal actions */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "flex-1 h-12 rounded-xl text-sm font-medium text-neutral-400",
                  "hover:bg-neutral-800 hover:text-neutral-200",
                  "active:scale-[0.98] transition-all duration-200"
                )}
                onClick={() => setShowJoinModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                className={cn(
                  "flex-1 h-12 rounded-xl text-sm font-bold",
                  "bg-amber-500 text-neutral-950",
                  "hover:bg-amber-400 active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-200"
                )}
                onClick={handleJoin}
                disabled={roomCode.length !== 6 || loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="size-4 border-2 border-neutral-700 border-t-neutral-950 rounded-full animate-spin" />
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