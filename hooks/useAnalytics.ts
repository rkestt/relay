"use client";

import { useCookieConsent } from "@/hooks/useCookieConsent";

export function useAnalytics() {
  const { consent } = useCookieConsent();

  const trackEvent = (eventName: string, data?: Record<string, unknown>) => {
    if (consent?.analytics) {
      // Placeholder: replace with PostHog / Google Analytics call
      console.log("[Analytics]", eventName, data);
    }
  };

  return { trackEvent };
}
