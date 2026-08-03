import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Senza key configurata PostHog non fa nulla: init saltato per evitare
// il console.error "initialized without a token" in produzione.
if (typeof window !== "undefined" && process.env.NODE_ENV === "production" && posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
    // Disabilita capturing automatico fino a consenso
    capture_pageview: false,
    capture_pageleave: false,
  });
}

export default posthog;
