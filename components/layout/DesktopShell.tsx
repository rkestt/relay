"use client";

import { useUIStore } from "@/stores/uiStore";
import { TopBar } from "./TopBar";
import { LeftSidebar } from "./LeftSidebar";
import { RightPanel } from "./RightPanel";

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "size-4"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function DesktopShell({ children }: { children: React.ReactNode }) {
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto relative">
          {children}
          {!rightPanelOpen && (
            <button
              onClick={toggleRightPanel}
              className="sticky top-3 float-right mr-3 size-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
              aria-label="Open context panel"
            >
              <ChevronLeftIcon />
            </button>
          )}
        </main>
        <RightPanel />
      </div>
    </div>
  );
}
