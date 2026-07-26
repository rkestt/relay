"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { logger } from "@/lib/logger";
import { apiFetch } from "@/lib/fetch";
import { handleApiError } from "@/lib/api-error";
import { PlusIcon, RefreshIcon, AlertIcon } from "@/components/icons";

const ROOM_CODE_KEY = "r6hub_room_code";

export default function HomePage() {
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [rejoinCode, setRejoinCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ROOM_CODE_KEY);
  });
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
      const res = await apiFetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starting_side: startingSide }),
      });
      await handleApiError(res);
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
      const res = await apiFetch("/api/lobby/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_code: roomCode.trim().toUpperCase() }),
      });
      await handleApiError(res);
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
      const res = await apiFetch("/api/lobby/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_code: rejoinCode }),
      });
      if (res.status === 404) {
        localStorage.removeItem(ROOM_CODE_KEY);
        setRejoinCode(null);
        setError("Lobby no longer exists");
        return;
      }
      await handleApiError(res);
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
    <div className="flex flex-col flex-1 min-h-dvh bg-surface text-on-surface">

      {/* ── Hero ──────────────────────────────────────── */}
      <main className="flex flex-col flex-1 items-center justify-center px-6 py-16 sm:py-32 gap-12 sm:gap-20">

        {/* Logomark + Title */}
        <div className="flex flex-col items-center gap-5 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-outline bg-surface-container">
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
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface">
              r6hub
            </h1>
            <p className="text-base text-on-surface-variant font-medium">
              Tactical sync for Rainbow Six Siege
            </p>
          </div>
        </div>

        {/* ── CTA Buttons ──────────────────────────────── */}
        <div className="flex flex-col gap-3 w-full max-w-sm">

          {/* Starting side selector */}
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase text-center">
              Your team starts as
            </span>
            <div className="flex rounded-xl bg-surface-container border border-outline p-1">
              <Button
                type="button"
                variant={startingSide === "attacker" ? "filled" : "text"}
                size="default"
                onClick={() => setStartingSide("attacker")}
                className={cn(
                  "flex-1 h-10",
                  startingSide === "attacker" && "bg-attacker hover:bg-attacker/90"
                )}
              >
                Attacker
              </Button>
              <Button
                type="button"
                variant={startingSide === "defender" ? "filled" : "text"}
                size="default"
                onClick={() => setStartingSide("defender")}
                className={cn(
                  "flex-1 h-10",
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
              variant="filled"
              size="xl"
              className="w-full h-14 text-base font-bold tracking-wide shadow-2"
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
              variant="outlined"
              size="xl"
              className="w-full h-14 text-base font-semibold tracking-wide"
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
                variant="text"
                size="lg"
                className="w-full h-12 text-sm font-medium text-on-surface-variant"
                onClick={handleRejoin}
                disabled={loading}
              >
                <RefreshIcon className="size-4 mr-2" />
                Rejoin Lobby ({rejoinCode})
              </Button>
            </div>
          )}
        </div>

        {/* ── Submit Strategy (standalone) ─────────────── */}
        <div className="flex flex-col items-center w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          <div className="w-full border-t border-outline-variant mb-5" />
          <Button
            variant="text"
            size="lg"
            className="w-full h-14 text-base font-semibold tracking-wide"
            onClick={() => router.push("/submit")}
          >
            <svg
              aria-hidden="true"
              className="size-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Submit Strategy
          </Button>
          <p className="text-xs text-on-surface-variant/40 mt-2">
            Share your tactics with the community
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error/10 text-on-error border border-error/20 animate-in fade-in slide-in-from-bottom-1 duration-200"
            role="alert"
            aria-live="polite"
          >
             <AlertIcon className="size-4 text-error flex-shrink-0" />
            <p className="text-sm text-error text-center">{error}</p>
          </div>
        )}
      </main>

      {/* ── Join Modal ──────────────────────────────────── */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogTitle>Join Lobby</DialogTitle>
          <DialogDescription className="mt-1 mb-5">
            Enter the 6-character room code shared by your squad leader.
          </DialogDescription>

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
              "bg-surface-container-high border-2 transition-all duration-fast mb-5",
              "placeholder:text-on-surface-variant/30 placeholder:tracking-normal",
              error
                ? "border-error focus:border-error focus:ring-error/20"
                : "border-outline focus:border-primary focus:ring-primary/20",
              "hover:border-on-surface/20"
            )}
            autoFocus
            aria-label="Room code"
          />

          {/* Inline error inside modal */}
          {error && (
            <p className="text-sm text-error mb-4 text-center animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </p>
          )}

          {/* Modal actions */}
          <div className="flex gap-3 mt-2">
            <Button
              variant="text"
              size="lg"
              className="flex-1 h-12 text-sm font-medium text-on-surface-variant"
              onClick={() => setShowJoinModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              size="lg"
              className="flex-1 h-12 text-sm font-bold"
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
