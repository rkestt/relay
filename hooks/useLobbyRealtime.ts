"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useLobbyStore } from "@/stores/lobbyStore";
import type { LobbyBan, LobbyMember, LobbySelection, Round } from "@/types";

const INITIAL_RECONNECT_DELAY = 1_000; // 1 second
const MAX_RECONNECT_DELAY = 30_000; // 30 seconds

/**
 * Subscribe to real-time changes for a lobby.
 *
 * Listens on:
 * - `lobby_members`  (INSERT / DELETE)
 * - `lobby_selections` (INSERT / UPDATE)
 * - `lobby_bans`     (INSERT / DELETE)
 * - `rounds`         (INSERT / UPDATE)
 *
 * On every change the matching Zustand store action is called.
 * Handles reconnect with exponential backoff.
 */
export function useLobbyRealtime(lobbyId: string | null) {
  const supabase = useRef(createBrowserClient()).current;

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lobbyIdRef = useRef(lobbyId);
  lobbyIdRef.current = lobbyId;

  // ── Stable store action references ──
  const setConnectionStatus = useLobbyStore((s) => s.setConnectionStatus);
  const upsertMember = useLobbyStore((s) => s.upsertMember);
  const removeMember = useLobbyStore((s) => s.removeMember);
  const upsertSelection = useLobbyStore((s) => s.upsertSelection);
  const addBan = useLobbyStore((s) => s.addBan);
  const removeBan = useLobbyStore((s) => s.removeBan);
  const upsertRound = useLobbyStore((s) => s.upsertRound);

  useEffect(() => {
    const id = lobbyIdRef.current;
    if (!id) {
      setConnectionStatus("disconnected");
      return;
    }

    // ── helpers ──────────────────────────────────────────────

    const cleanupPrevious = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      const delay = Math.min(
        INITIAL_RECONNECT_DELAY * 2 ** retryCountRef.current,
        MAX_RECONNECT_DELAY,
      );
      retryCountRef.current += 1;

      retryTimerRef.current = setTimeout(() => {
        subscribe();
      }, delay);
    };

    // ── subscribe ────────────────────────────────────────────

    const subscribe = () => {
      // clean any previous channel / timer before re-subscribing
      cleanupPrevious();

      setConnectionStatus("connecting");

      const channel = supabase.channel(`lobby:${id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: "" },
        },
      });

      // lobby_members ────────────────────────────────────────
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lobby_members",
          filter: `lobby_id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            upsertMember(payload.new as LobbyMember);
          }
        },
      );

      channel.on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "lobby_members",
          filter: `lobby_id=eq.${id}`,
        },
        (payload) => {
          if (payload.old) {
            removeMember((payload.old as LobbyMember).user_id);
          }
        },
      );

      // lobby_selections ──────────────────────────────────────
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lobby_selections",
          filter: `lobby_id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            upsertSelection(payload.new as LobbySelection);
          }
        },
      );

      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lobby_selections",
          filter: `lobby_id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            upsertSelection(payload.new as LobbySelection);
          }
        },
      );

      // lobby_bans ────────────────────────────────────────────
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lobby_bans",
          filter: `lobby_id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            addBan(payload.new as LobbyBan);
          }
        },
      );

      channel.on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "lobby_bans",
          filter: `lobby_id=eq.${id}`,
        },
        (payload) => {
          if (payload.old) {
            removeBan((payload.old as LobbyBan).id);
          }
        },
      );

      // rounds ────────────────────────────────────────────────
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rounds",
          filter: `lobby_id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            upsertRound(payload.new as Round);
          }
        },
      );

      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rounds",
          filter: `lobby_id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            upsertRound(payload.new as Round);
          }
        },
      );

      // ── subscribe & track status ────────────────────────────
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          retryCountRef.current = 0;
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("error");
          scheduleReconnect();
        } else if (status === "CLOSED") {
          setConnectionStatus("disconnected");
        }
      });

      channelRef.current = channel;
    };

    // ── kick off ────────────────────────────────────────────
    subscribe();

    return () => {
      cleanupPrevious();
      setConnectionStatus("disconnected");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId]);

  const connectionStatus = useLobbyStore((s) => s.connectionStatus);

  return { connectionStatus };
}
