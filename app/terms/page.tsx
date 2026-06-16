"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackArrowIcon } from "@/components/icons";

const sections = [
  {
    id: "1",
    title: "Accettazione dei termini",
    content: (
      <div className="space-y-2">
        <p>
          L&apos;utilizzo della piattaforma r6hub implica l&apos;accettazione
          integrale dei presenti Termini di Servizio. Se non accetti uno o più
          termini, ti invitiamo a non utilizzare la piattaforma.
        </p>
        <p className="text-muted-foreground text-sm">
          I presenti termini costituiscono un accordo vincolante tra te
          (&ldquo;utente&rdquo;) e r6hub (&ldquo;piattaforma&rdquo;). La
          registrazione o l&apos;accesso alla piattaforma costituisce
          accettazione automatica.
        </p>
      </div>
    ),
  },
  {
    id: "2",
    title: "Registrazione account",
    content: (
      <div className="space-y-3">
        <p>
          Per utilizzare la piattaforma è necessario registrare un account.
          Durante la registrazione, l&apos;utente si impegna a:
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>Fornire dati veritieri e aggiornati (email, username)</li>
          <li>Non utilizzare identità false o account di terzi</li>
          <li>
            Mantenere la riservatezza delle proprie credenziali di accesso
          </li>
          <li>
            Comunicare tempestivamente eventuali usi non autorizzati del proprio
            account
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          L&apos;utente è responsabile per tutte le attività svolte tramite il
          proprio account. r6hub non sarà responsabile per danni derivanti
          dall&apos;uso non autorizzato dell&apos;account.
        </p>
      </div>
    ),
  },
  {
    id: "3",
    title: "Requisiti di età",
    content: (
      <div className="space-y-2">
        <p>
          La piattaforma è destinata a utenti di età pari o superiore a 16
          anni. Se hai meno di 16 anni, non puoi registrarti né utilizzare la
          piattaforma. Rainbow Six Siege è classificato PEGI 16; l&apos;accesso al
          gioco è soggetto ai termini di Ubisoft.
        </p>
        <p className="text-sm text-muted-foreground">
          Ci riserviamo il diritto di verificare l&apos;età degli utenti e di
          sospendere account in caso di violazione.
        </p>
      </div>
    ),
  },
  {
    id: "4",
    title: "Regole di comportamento",
    content: (
      <div className="space-y-3">
        <p>Utilizzando la piattaforma, l&apos;utente accetta di:</p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>
            Non utilizzare la piattaforma per attività illegali o fraudolente
          </li>
          <li>
            Non tentare di danneggiare, sovraccaricare o compromettere i server
            della piattaforma
          </li>
          <li>
            Non diffondere contenuti offensivi, minatori, discriminatori o
            molestanti
          </li>
          <li>
            Non utilizzare bot, script o strumenti automatizzati per
            interagire con la piattaforma
          </li>
          <li>
            Non sfruttare bug o vulnerabilità per ottenere vantaggi indebiti
          </li>
          <li>
            Non violare i termini di servizio di Rainbow Six Siege o di Ubisoft
            tramite l&apos;uso della piattaforma
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          La violazione di queste regole può comportare la sospensione o
          l&apos;eliminazione dell&apos;account senza preavviso.
        </p>
      </div>
    ),
  },
  {
    id: "5",
    title: "Proprietà intellettuale",
    content: (
      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm">
            Contenuti della piattaforma
          </h3>
          <p className="text-muted-foreground">
            L&apos;interfaccia, il design, il codice e i marchi di r6hub sono di
            proprietà esclusiva della piattaforma e sono protetti dalle leggi
            sulla proprietà intellettuale.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm">
            Contenuti generati dagli utenti
          </h3>
          <p className="text-muted-foreground">
            Le strategie, le lobby, i task e qualsiasi altro contenuto creato
            dall&apos;utente sulla piattaforma rimangono di proprietà
            dell&apos;utente stesso. Con la pubblicazione, l&apos;utente concede a r6hub
            una licenza non esclusiva, gratuita e limitata alla piattaforma per
            visualizzare, distribuire e gestire tali contenuti ai soli fini del
            funzionamento del servizio.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm">
            Rainbow Six Siege
          </h3>
          <p className="text-muted-foreground">
            Rainbow Six Siege è un marchio registrato di Ubisoft. r6hub è una
            piattaforma indipendente non affiliata, sponsorizzata o approvata da
            Ubisoft. Tutti i marchi di terzi rimangono di proprietà dei
            rispettivi titolari.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "6",
    title: "Limitazione di responsabilità",
    content: (
      <div className="space-y-3">
        <p>
          La piattaforma viene fornita &ldquo;così com&rsquo;è&rdquo; (as is) e
          &ldquo;come disponibile&rdquo; (as available), senza garanzie di
          alcun tipo, espresse o implicite.
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>
            r6hub non garantisce che la piattaforma sia priva di errori,
            interruzioni o vulnerabilità
          </li>
          <li>
            r6hub non è responsabile per danni diretti o indiretti derivanti
            dall&apos;uso o dall&apos;impossibilità di utilizzo della piattaforma
          </li>
          <li>
            r6hub non è responsabile per perdita di dati, mancato guadagno o
            interruzione dell&apos;attività
          </li>
          <li>
            La piattaforma è uno strumento di supporto; le decisioni di gioco
            rimangono sotto la responsabilità dell&apos;utente
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Alcune giurisdizioni non consentono l&apos;esclusione di alcune garanzie
          implicite; pertanto, le esclusioni di cui sopra potrebbero non
          applicarsi integralmente.
        </p>
      </div>
    ),
  },
  {
    id: "7",
    title: "Sospensione e cancellazione account",
    content: (
      <div className="space-y-3">
        <p>
          r6hub si riserva il diritto di sospendere o cancellare un account
          nei seguenti casi:
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>Violazione dei presenti Termini di Servizio</li>
          <li>Attività fraudolente o illegali</li>
          <li>Inattività prolungata (oltre 12 mesi)</li>
          <li>Richiesta diretta dell&apos;utente</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          In caso di cancellazione, i dati associati all&apos;account verranno
          eliminati entro 30 giorni, salvo obblighi di legge.
        </p>
      </div>
    ),
  },
  {
    id: "8",
    title: "Modifica dei termini",
    content: (
      <div className="space-y-2">
        <p>
          r6hub si riserva il diritto di modificare i presenti Termini di
          Servizio in qualsiasi momento. Le modifiche verranno comunicate
          tramite:
        </p>
        <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
          <li>Notifica via email all&apos;indirizzo registrato</li>
          <li>Avviso sulla piattaforma al prossimo accesso</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          L&apos;uso continuato della piattaforma dopo la comunicazione delle
          modifiche costituisce accettazione dei nuovi termini. Se non accetti
          le modifiche, devi cessare l&apos;utilizzo della piattaforma e richiedere
          la cancellazione dell&apos;account.
        </p>
      </div>
    ),
  },
  {
    id: "9",
    title: "Legge applicabile e foro competente",
    content: (
      <div className="space-y-2">
        <p>
          I presenti Termini di Servizio sono regolati dalla legge italiana. Per
          qualsiasi controversia relativa all&apos;interpretazione o
          all&apos;esecuzione dei presenti termini, il foro competente è quello di
          Milano, salvo che la legge applicabile non preveda un foro diverso e
          inderogabile per il consumatore.
        </p>
        <p className="text-sm text-muted-foreground">
          Per gli utenti residenti al di fuori dell&apos;Italia, potrebbero
          applicarsi disposizioni imperative della legge del paese di
          residenza.
        </p>
      </div>
    ),
  },
  {
    id: "10",
    title: "Contatti",
    content: (
      <div className="space-y-2">
        <p>
          Per qualsiasi domanda relativa ai presenti Termini di Servizio, puoi
          contattarci tramite:
        </p>
        <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
          <li>
            Email:{" "}
            <a
              href="mailto:legal@r6hub.app"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              legal@r6hub.app
            </a>
          </li>
        </ul>
      </div>
    ),
  },
];

export default function TermsPage() {
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider">
              Termini di Servizio
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Termini di Servizio
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
            I presenti Termini di Servizio regolano l&apos;utilizzo della
            piattaforma r6hub. Leggi attentamente prima di utilizzare il
            servizio.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.id} id={`section-${section.id}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                    {section.id}
                  </span>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {section.content}
              </CardContent>
            </Card>
          ))}
        </div>

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
              href="/cookies"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Leggi la Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
