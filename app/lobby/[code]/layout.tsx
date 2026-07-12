"use client";

import { DesktopShell } from "@/components/layout/DesktopShell";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useKeyboardShortcuts();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return <DesktopShell>{children}</DesktopShell>;
  }

  return <div className="flex flex-col min-h-dvh">{children}</div>;
}
