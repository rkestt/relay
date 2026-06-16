"use client";

import { useEffect } from "react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import posthog from "@/lib/analytics/posthog";

export function useAnalytics() {
  const { consent } = useCookieConsent();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (consent?.analytics) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
  }, [consent]);

  const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && consent?.analytics) {
      posthog.capture(eventName, properties);
    }
  };

  const trackPageview = () => {
    if (typeof window !== "undefined" && consent?.analytics) {
      posthog.capture("$pageview");
    }
  };

  return { trackEvent, trackPageview };
}
