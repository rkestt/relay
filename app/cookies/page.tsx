"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackArrowIcon } from "@/components/icons";

const cookieCategories = [
  {
    id: "tecnici",
    title: "Cookie tecnici (necessari)",
    description:
      "Questi cookie sono essenziali per il funzionamento della piattaforma. Non possono essere disabilitati.",
    cookies: [
      {
        name: "sb-{project-ref}-auth-token",
        purpose: "Autenticazione e gestione sessione utente (Supabase)",
        duration: "Sessione",
      },
      {
        name: "sb-{project-ref}-auth-token-code-verifier",
        purpose: "Verifica del flusso di autenticazione OAuth",
        duration: "Sessione",
      },
      {
        name: "__clerk_session",
        purpose: "Identificatore di sessione utente",
        duration: "Sessione",
      },
    ],
  },
  {
    id: "funzionali",
    title: "Cookie funzionali",
    description:
      "Questi cookie permettono di ricordare le preferenze dell'utente per migliorare l'esperienza.",
    cookies: [
      {
        name: "r6hub_theme",
        purpose: "Preferenza tema (chiaro/scuro)",
        duration: "1 anno",
      },
      {
        name: "r6hub_lang",
        purpose: "Preferenza lingua interfaccia",
        duration: "1 anno",
      },
    ],
  },
  {
    id: "analytics",
    title: "Cookie analytics",
    description:
      "Questi cookie raccolgono dati anonimizzati sull'utilizzo della piattaforma. Sono attivati solo previo consenso.",
    cookies: [
      {
        name: "ph_*",
        purpose: "Analytics di navigazione (PostHog) — pagine visitate, durata sessione",
        duration: "1 anno",
      },
      {
        name: "ga_*",
        purpose: "Analytics di navigazione (Google Analytics) — solo se configurato",
        duration: "Fino a 2 anni",
      },
    ],
  },
];

export default function CookiesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lastUpdated = mounted
    ? new Date().toLocaleDateString("it-IT", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <main className="min-h-dvh bg-background">
      {/* Back navigation */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">
          <Link
            href="/"
            className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackArrowIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Torna alla home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-primary mb-4">
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="21.17" y1="8" x2="12" y2="8" />
              <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
              <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider">
              Cookie Policy
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Cookie Policy
          </h1>
          <p className="text-muted-foreground">
            Ultimo aggiornamento:{" "}
            <span
              className={cn(
                "inline-block transition-opacity duration-300",
                mounted ? "opacity-100" : "opacity-0",
              )}
            >
              {lastUpdated}
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            Questa Cookie Policy spiega cosa sono i cookie, come li utilizziamo
            e come puoi gestire le tue preferenze.
          </p>
        </div>

        {/* Intro section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Cosa sono i cookie</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              I cookie sono piccoli file di testo che i siti web salvano sul
              dispositivo dell&apos;utente durante la navigazione. Permettono al sito
              di ricordare azioni e preferenze (come login, lingua, tema) nel
              tempo.
            </p>
            <p>
              Utilizziamo cookie di prima parte (impostati direttamente da r6hub)
              e, solo con il tuo consenso, cookie di terze parti per analisi
              statistiche.
            </p>
          </CardContent>
        </Card>

        {/* Cookie categories */}
        <div className="space-y-8">
          {cookieCategories.map((category) => (
            <Card key={category.id} id={category.id}>
              <CardHeader>
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {category.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Nome cookie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Finalità
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Durata
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {category.cookies.map((cookie) => (
                        <tr
                          key={cookie.name}
                          className="hover:bg-accent/30 transition-colors"
                        >
                          <td className="px-6 py-3 font-mono text-xs text-foreground whitespace-nowrap">
                            {cookie.name}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {cookie.purpose}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">
                            {cookie.duration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gestione preferenze */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Gestione delle preferenze
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>Puoi gestire le tue preferenze sui cookie in qualsiasi momento:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <span className="text-foreground font-medium">
                  Dalla piattaforma:
                </span>{" "}
                visita{" "}
                <Link
                  href="/settings/cookies"
                  className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                >
                  Impostazioni cookie
                </Link>{" "}
                per attivare o disattivare i cookie analytics
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Dal browser:
                </span>{" "}
                puoi configurare il tuo browser per bloccare o eliminare i
                cookie. Consulta la guida del tuo browser per le istruzioni
                specifiche
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              La disabilitazione dei cookie tecnici potrebbe compromettere il
              corretto funzionamento della piattaforma.
            </p>
          </CardContent>
        </Card>

        {/* Cross-links */}
        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Leggi la Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Leggi i Termini di Servizio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
