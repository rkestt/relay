"use client";

import { useEffect } from "react";
import { initializeTheme } from "@/stores/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeTheme();
  }, []);

  return <>{children}</>;
}
