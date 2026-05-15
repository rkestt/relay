"use client";

import { useEffect, useState } from "react";
import { useLobbyStore } from "@/stores/lobbyStore";

/**
 * Monitors browser online/offline status and keeps the Zustand
 * connection status in sync.
 *
 * Returns `isOnline` for components that need to react to connectivity.
 */
export function usePresence(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const setConnectionStatus = useLobbyStore((s) => s.setConnectionStatus);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatus("connecting");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus("disconnected");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setConnectionStatus]);

  return { isOnline };
}
