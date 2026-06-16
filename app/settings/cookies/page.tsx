"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackArrowIcon, CheckIcon } from "@/components/icons";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function CookieSettingsPage() {
  const { consent, setPreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync local toggles with stored consent
  useEffect(() => {
    if (consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [consent]);

  const handleSave = () => {
    setPreferences(analytics, marketing);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!mounted) {
    return (
      <main className="min-h-dvh bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-accent" />
            <div className="h-4 w-64 rounded bg-accent" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background">
      {/* Back navigation */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2">
          <Link
            href="/"
            className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackArrowIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Torna alla home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
            Gestisci preferenze cookie
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Puoi modificare in qualsiasi momento le tue preferenze sui cookie. I
            cookie tecnici sono sempre attivi perché necessari al
            funzionamento della piattaforma.
          </p>
        </div>

        {/* Current status */}
        {consent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Stato attuale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Cookie tecnici
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                    <CheckIcon className="size-3.5" />
                    Attivi
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Cookie analytics
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      consent.analytics
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {consent.analytics ? (
                      <>
                        <CheckIcon className="size-3.5" /> Attivi
                      </>
                    ) : (
                      "Disattivati"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Cookie marketing
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      consent.marketing
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {consent.marketing ? (
                      <>
                        <CheckIcon className="size-3.5" /> Attivi
                      </>
                    ) : (
                      "Disattivati"
                    )}
                  </span>
                </div>
                <div className="pt-2 text-xs text-muted-foreground border-t border-border">
                  Aggiornato:{" "}
                  {new Date(consent.timestamp).toLocaleString("it-IT", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferences card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Preferenze cookie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Necessary - always on */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Cookie tecnici (necessari)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Autenticazione, sessione, funzionalità di base
                  </p>
                </div>
                <span className="ml-3 shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Sempre attivi
                </span>
              </div>

              {/* Analytics toggle */}
              <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Cookie analytics
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dati anonimizzati per capire come utilizzi la piattaforma
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="ml-3 size-4 shrink-0 rounded border-border text-primary focus:ring-primary/50"
                  aria-label="Attiva cookie analytics"
                />
              </label>

              {/* Marketing toggle */}
              <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors">
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
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="ml-3 size-4 shrink-0 rounded border-border text-primary focus:ring-primary/50"
                  aria-label="Attiva cookie marketing"
                />
              </label>
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <Link
              href="/cookies"
              className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Leggi la Cookie Policy
            </Link>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="text-xs text-green-600 dark:text-green-400 animate-in fade-in duration-200">
                  Preferenze salvate
                </span>
              )}
              <Button onClick={handleSave}>Salva preferenze</Button>
            </div>
          </div>
        </Card>

        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Come gestire i cookie dal browser
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>
              Puoi configurare il tuo browser per bloccare o eliminare i cookie
              in qualsiasi momento. Consulta la guida del tuo browser per le
              istruzioni specifiche.
            </p>
            <p>
              La disabilitazione dei cookie tecnici potrebbe compromettere il
              corretto funzionamento della piattaforma. I cookie analytics e
              marketing possono essere disattivati senza impatto sulla
              funzionalità base.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
