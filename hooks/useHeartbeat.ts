"use client";

import { useEffect, useRef, useState } from "react";
import { useLobbyStore } from "@/stores/lobbyStore";
import type { LobbyBan, LobbyMember, LobbySelection, Round } from "@/types";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

interface LobbyStateResponse {
  lobby: { id: string; room_code: string; leader_id: string; status: string };
  members: (LobbyMember & { profiles: { username: string; avatar_url: string | null } | null })[];
  currentRound: Round | null;
  selections: LobbySelection[];
  bans: LobbyBan[];
}

/**
 * Periodically fetches the full lobby state from the server
 * and replaces the Zustand store with the authoritative data.
 *
 * Pauses when the browser tab is hidden (visibilitychange API)
 * and resumes when it becomes visible again.
 */
export function useHeartbeat(lobbyId: string | null) {
  const [lastSync, setLastSync] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lobbyIdRef = useRef(lobbyId);
  lobbyIdRef.current = lobbyId;
  const pausedRef = useRef(false);

  // ── Stable store action references ──
  const setLobbyId = useLobbyStore((s) => s.setLobbyId);
  const setLobbyCode = useLobbyStore((s) => s.setLobbyCode);
  const setMembers = useLobbyStore((s) => s.setMembers);
  const setMemberProfile = useLobbyStore((s) => s.setMemberProfile);
  const setCurrentRound = useLobbyStore((s) => s.setCurrentRound);
  const setSelections = useLobbyStore((s) => s.setSelections);
  const setBans = useLobbyStore((s) => s.setBans);
  const setConnectionStatus = useLobbyStore((s) => s.setConnectionStatus);

  // ── fetch & store replace ──────────────────────────────────

  const sync = async () => {
    const id = lobbyIdRef.current;
    if (!id || pausedRef.current) return;

    try {
      const res = await fetch(`/api/lobby/${id}/state`);
      if (!res.ok) {
        console.warn("[useHeartbeat] state fetch failed", res.status);
        return;
      }

      const data: LobbyStateResponse = await res.json();

      // Server is authoritative – replace store state
      setLobbyId(data.lobby.id);
      setLobbyCode(data.lobby.room_code);

      // Flatten members + profiles
      setMembers(
        data.members.map((m) => ({
          id: m.id,
          lobby_id: m.lobby_id,
          user_id: m.user_id,
          joined_at: m.joined_at,
        })),
      );

      for (const m of data.members) {
        if (m.profiles) {
          setMemberProfile(m.user_id, {
            username: m.profiles.username,
            avatar_url: m.profiles.avatar_url,
          });
        }
      }

      setCurrentRound(data.currentRound);
      setSelections(data.selections);
      setBans(data.bans);
      setConnectionStatus("connected");

      setLastSync(Date.now());
    } catch (err) {
      console.error("[useHeartbeat] sync error", err);
    }
  };

  // ── interval management ────────────────────────────────────

  const startInterval = () => {
    stopInterval();
    if (!lobbyIdRef.current) return;

    intervalRef.current = setInterval(() => {
      sync();
    }, HEARTBEAT_INTERVAL);
  };

  const stopInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // ── visibility change handler ──────────────────────────────

  useEffect(() => {
    if (!lobbyId) return;

    const handleVisibility = () => {
      if (document.hidden) {
        pausedRef.current = true;
        stopInterval();
      } else {
        pausedRef.current = false;
        // Immediate sync when coming back, then resume interval
        sync().then(() => startInterval());
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Initial sync & start interval
    sync().then(() => startInterval());

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId]);

  return { lastSync };
}
