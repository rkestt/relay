"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const WIP_STORAGE_KEY = "r6hub_wip_dismissed";

export function WipBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(WIP_STORAGE_KEY);
    if (stored !== "true") setDismissed(false);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(WIP_STORAGE_KEY, "true");
  };

  const handleReset = () => {
    localStorage.removeItem(WIP_STORAGE_KEY);
    setDismissed(false);
  };

  if (!mounted || dismissed) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-1.5 text-xs font-medium",
        "bg-warning/10 border-b border-warning/20 text-warning"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-block size-1.5 rounded-full bg-warning animate-pulse shrink-0" />
        <span className="font-bold tracking-wider uppercase shrink-0">WIP</span>
        <span className="text-warning/60 hidden sm:inline truncate">
          — features incomplete, data may reset
        </span>
        <span className="text-warning/60 sm:hidden truncate">
          — work in progress
        </span>
      </div>

      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded hover:bg-warning/15 transition-colors"
        aria-label="Dismiss WIP banner"
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
    </div>
  );
}
