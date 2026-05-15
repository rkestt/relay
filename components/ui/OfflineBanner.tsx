"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  status?: "connected" | "disconnected" | "error";
  message?: string;
  onDismiss?: () => void;
}

export function OfflineBanner({
  status = "connected",
  message,
  onDismiss,
}: OfflineBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Auto-reappear when status changes to non-connected
  useEffect(() => {
    if (status !== "connected") setDismissed(false);
  }, [status]);

  if (dismissed || status === "connected") return null;

  const label =
    status === "disconnected"
      ? message ?? "Live updates paused — reconnecting…"
      : status === "error"
      ? message ?? "Server unavailable"
      : null;

  if (!label) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium",
        "bg-amber-400/10 border-b border-amber-400/20 text-amber-400",
        status === "error" && "bg-red-400/10 border-red-400/20 text-red-400"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Pulse dot */}
        <span
          className={cn(
            "inline-block w-1.5 h-1.5 rounded-full",
            status === "disconnected" ? "bg-amber-400 animate-pulse" : "bg-red-400"
          )}
        />
        {label}
      </div>
      {onDismiss && (
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          className="ml-auto flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <svg
            className="size-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}