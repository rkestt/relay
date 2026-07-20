"use client";

import { useState, useCallback } from "react";

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = "cookie-consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored) as CookieConsent; } catch { return null; }
    }
    return null;
  });
  const [showBanner, setShowBanner] = useState(() => consent === null);

  const acceptAll = useCallback(() => {
    const newConsent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setShowBanner(false);
  }, []);

  const rejectAll = useCallback(() => {
    const newConsent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setShowBanner(false);
  }, []);

  const setPreferences = useCallback(
    (analytics: boolean, marketing: boolean) => {
      const newConsent: CookieConsent = {
        necessary: true,
        analytics,
        marketing,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent));
      setConsent(newConsent);
      setShowBanner(false);
    },
    [],
  );

  return {
    consent,
    showBanner,
    acceptAll,
    rejectAll,
    setPreferences,
    setShowBanner,
  };
}
