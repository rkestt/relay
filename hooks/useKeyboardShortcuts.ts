"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useUIStore } from "@/stores/uiStore";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const lobbyCode = useLobbyStore((s) => s.lobbyCode);
  const isLeader = useLobbyStore((s) => s.isLeader);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);

  useEffect(() => {
    const isInLobby = pathname.startsWith("/lobby/");
    if (!isInLobby || !lobbyCode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
        return;
      }

      if (e.key === "Escape") {
        if (rightPanelOpen) {
          setRightPanelOpen(false);
        }
        return;
      }

      if (e.key === "1" && isLeader) {
        router.push(`/lobby/${lobbyCode}/bans`);
        return;
      }

      if (e.key === "2" && isLeader) {
        router.push(`/lobby/${lobbyCode}/map`);
        return;
      }

      if (e.key === "3") {
        router.push(`/lobby/${lobbyCode}/select`);
        return;
      }

      if (e.key === "4") {
        router.push(`/lobby/${lobbyCode}/tasks`);
        return;
      }

      if (e.key === "0" || e.key === "l") {
        router.push(`/lobby/${lobbyCode}`);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, lobbyCode, isLeader, router, rightPanelOpen, setRightPanelOpen]);
}
