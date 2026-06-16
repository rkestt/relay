"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { XIcon } from "@/components/icons";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export function CookieBanner() {
  const { consent, showBanner, acceptAll, rejectAll, setPreferences } =
    useCookieConsent();
  const [showModal, setShowModal] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-initialize checkboxes from existing consent when modal opens
  useEffect(() => {
    if (showModal && consent) {
      setAnalyticsChecked(consent.analytics);
      setMarketingChecked(consent.marketing);
    } else if (showModal) {
      setAnalyticsChecked(false);
      setMarketingChecked(false);
    }
  }, [showModal, consent]);

  // ── Focus trap for modal ──────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowModal(false);
      return;
    }
    if (e.key !== "Tab" || !modalRef.current) return;

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const prev = document.activeElement as HTMLElement | null;
    lastFocusedRef.current = prev;

    document.addEventListener("keydown", handleKeyDown);

    // Focus first focusable element
    requestAnimationFrame(() => {
      const first = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    });

    // Prevent body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      lastFocusedRef.current?.focus();
    };
  }, [showModal, handleKeyDown]);

  const handleSavePreferences = () => {
    setPreferences(analyticsChecked, marketingChecked);
    setShowModal(false);
  };

  if (!mounted) return null;
  if (consent && !showBanner && !showModal) return null;

  return (
    <>
      {/* ── Banner ─────────────────────────────────────────── */}
      <div
        ref={bannerRef}
        role="alert"
        aria-live="polite"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 ease-out",
          showBanner
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="mx-auto max-w-3xl px-4 pb-4 sm:pb-6">
          <Card className="border-border/80 bg-card/95 backdrop-blur-md shadow-3">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed text-foreground/90">
                  Utilizziamo cookie per migliorare la tua esperienza. Leggi la
                  nostra{" "}
                  <Link
                    href="/cookies"
                    className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    Cookie Policy
                  </Link>
                  .
                </p>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={rejectAll}
                    aria-label="Rifiuta tutti i cookie"
                  >
                    Rifiuta tutti
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModal(true)}
                    aria-label="Personalizza preferenze cookie"
                  >
                    Personalizza
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={acceptAll}
                    aria-label="Accetta tutti i cookie"
                  >
                    Accetta tutti
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Preferences Modal ──────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Preferenze cookie"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowModal(false)}
          />

          {/* Content */}
          <div
            ref={modalRef}
            className={cn(
              "relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-xl",
              "border border-border bg-popover p-6 shadow-3 mx-0 sm:mx-auto",
              "animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:scale-in duration-300",
              "max-h-[85vh] overflow-y-auto",
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-popover-foreground">
                Preferenze cookie
              </h2>
              <button
                type="button"
                aria-label="Chiudi"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                onClick={() => setShowModal(false)}
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Scegli quali cookie autorizzare. I cookie tecnici sono sempre
              attivi perché necessari al funzionamento della piattaforma.
            </p>

            {/* Necessary - always on */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 px-4 py-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Cookie tecnici (necessari)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sempre attivi — autenticazione e funzionalità di base
                </p>
              </div>
              <span className="ml-3 shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Sempre
              </span>
            </div>

            {/* Analytics toggle */}
            <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 mb-3 cursor-pointer hover:bg-accent/20 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Cookie analytics
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dati anonimizzati per capire come usi la piattaforma
                </p>
              </div>
              <input
                type="checkbox"
                checked={analyticsChecked}
                onChange={(e) => setAnalyticsChecked(e.target.checked)}
                className="ml-3 size-4 shrink-0 rounded border-border text-primary focus:ring-primary/50"
                aria-label="Attiva cookie analytics"
              />
            </label>

            {/* Marketing toggle */}
            <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 mb-6 cursor-pointer hover:bg-accent/20 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Cookie marketing
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cookie per personalizzare contenuti e offerte
                </p>
              </div>
              <input
                type="checkbox"
                checked={marketingChecked}
                onChange={(e) => setMarketingChecked(e.target.checked)}
                className="ml-3 size-4 shrink-0 rounded border-border text-primary focus:ring-primary/50"
                aria-label="Attiva cookie marketing"
              />
            </label>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between sm:items-center border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Annulla
              </button>
              <Button onClick={handleSavePreferences}>
                Salva preferenze
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
