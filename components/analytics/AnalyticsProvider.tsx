"use client";

import { useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { trackPageview } = useAnalytics();

  useEffect(() => {
    trackPageview();
  }, [trackPageview]);

  return <>{children}</>;
}
