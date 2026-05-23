"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
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
 * - `lobbies`        (UPDATE)
 *
 * On every change the matching Zustand store action is called.
 * Handles reconnect with exponential backoff.
 */
export function useLobbyRealtime(lobbyId: string | null) {
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createBrowserClient();
  }
  const supabase = supabaseRef.current;

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lobbyIdRef = useRef(lobbyId);
  lobbyIdRef.current = lobbyId;

  const lastEventAtRef = useRef<number | null>(null);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);

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

      logger.info("useLobbyRealtime", "scheduleReconnect", { delay, attempt: retryCountRef.current });

      retryTimerRef.current = setTimeout(() => {
        subscribe();
      }, delay);
    };

    // ── subscribe ────────────────────────────────────────────

    const subscribe = () => {
      logger.info("useLobbyRealtime", "subscribe", { lobbyId: id });
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
          logger.debug("useLobbyRealtime", "lobby_members INSERT", { new: payload.new });
          if (payload.new) {
            upsertMember(payload.new as LobbyMember);
          }
          setLastEventAt(Date.now());
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
          logger.debug("useLobbyRealtime", "lobby_members DELETE", { old: payload.old });
          if (payload.old) {
            removeMember((payload.old as LobbyMember).user_id);
          }
          setLastEventAt(Date.now());
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
          logger.debug("useLobbyRealtime", "lobby_selections INSERT", { new: payload.new });
          if (payload.new) {
            upsertSelection(payload.new as LobbySelection);
          }
          setLastEventAt(Date.now());
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
          logger.debug("useLobbyRealtime", "lobby_selections UPDATE", { new: payload.new, old: payload.old });
          if (payload.new) {
            upsertSelection(payload.new as LobbySelection);
          }
          setLastEventAt(Date.now());
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
          logger.debug("useLobbyRealtime", "lobby_bans INSERT", { new: payload.new });
          if (payload.new) {
            addBan(payload.new as LobbyBan);
          }
          setLastEventAt(Date.now());
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
          logger.debug("useLobbyRealtime", "lobby_bans DELETE", { old: payload.old });
          if (payload.old) {
            removeBan((payload.old as LobbyBan).id);
          }
          setLastEventAt(Date.now());
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
          logger.debug("useLobbyRealtime", "rounds INSERT", { new: payload.new });
          if (payload.new) {
            upsertRound(payload.new as Round);
          }
          setLastEventAt(Date.now());
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
          logger.debug("useLobbyRealtime", "rounds UPDATE", { new: payload.new, old: payload.old });
          if (payload.new) {
            upsertRound(payload.new as Round);
          }
          setLastEventAt(Date.now());
        },
      );

      // lobbies ───────────────────────────────────────────────
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lobbies",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          logger.debug("useLobbyRealtime", "lobbies UPDATE", { new: payload.new });
          setLastEventAt(Date.now());
        },
      );

      // ── subscribe & track status ────────────────────────────
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          logger.info("useLobbyRealtime", "SUBSCRIBED", { lobbyId: id });
          retryCountRef.current = 0;
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          logger.warn("useLobbyRealtime", `Channel ${status}`, { lobbyId: id });
          setConnectionStatus("error");
          scheduleReconnect();
        } else if (status === "CLOSED") {
          logger.info("useLobbyRealtime", "CLOSED", { lobbyId: id });
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

  return { connectionStatus, lastEventAt };
}
