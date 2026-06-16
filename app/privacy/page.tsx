"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackArrowIcon, LockIcon } from "@/components/icons";

const sections = [
  {
    id: "1",
    title: "Titolare del trattamento",
    content: (
      <div className="space-y-2">
        <p>
          Il titolare del trattamento dei dati è r6hub (di seguito, "piattaforma").
          Per qualsiasi richiesta relativa ai tuoi dati personali, puoi contattarci
          all'indirizzo email:{" "}
          <a
            href="mailto:privacy@r6hub.app"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            privacy@r6hub.app
          </a>
        </p>
        <p className="text-muted-foreground text-sm">
          r6hub è una piattaforma second-screen per Rainbow Six Siege, dedicata
          alla gestione di lobby, strategie e coordinamento di squadra.
        </p>
      </div>
    ),
  },
  {
    id: "2",
    title: "Dati raccolti",
    content: (
      <div className="space-y-3">
        <p>
          Durante l'utilizzo della piattaforma, raccogliamo i seguenti dati
          personali:
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">Dati di registrazione:</span>{" "}
            email, username, avatar (se fornito tramite OAuth Discord)
          </li>
          <li>
            <span className="text-foreground font-medium">Dati di utilizzo:</span>{" "}
            lobby create, strategie salvate, task assegnati, preferenze di lingua e tema
          </li>
          <li>
            <span className="text-foreground font-medium">Dati tecnici:</span>{" "}
            indirizzo IP, user agent, tipo di dispositivo, pagine visitate
          </li>
          <li>
            <span className="text-foreground font-medium">Dati di autenticazione:</span>{" "}
            token di sessione, provider OAuth utilizzato (email/password o Discord)
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Non raccogliamo dati sensibili (origine razziale, opinioni politiche,
          religione, salute, ecc.) né dati di genealogia genetica.
        </p>
      </div>
    ),
  },
  {
    id: "3",
    title: "Finalità del trattamento",
    content: (
      <div className="space-y-3">
        <p>I dati raccolti vengono utilizzati per le seguenti finalità:</p>
        <ol className="space-y-2 list-decimal pl-5 text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">
              Fornitura del servizio:
            </span>{" "}
            creazione e gestione di lobby, salvataggio strategie, coordinamento
            task di squadra
          </li>
          <li>
            <span className="text-foreground font-medium">Autenticazione:</span>{" "}
            login via email/password o OAuth Discord, gestione sessione utente
          </li>
          <li>
            <span className="text-foreground font-medium">
              Comunicazioni di servizio:
            </span>{" "}
            notifiche relative a modifiche dei Termini di Servizio o della
            Privacy Policy
          </li>
          <li>
            <span className="text-foreground font-medium">Supporto:</span>{" "}
            risposta a richieste di assistenza o esercizio dei diritti privacy
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: "4",
    title: "Base giuridica",
    content: (
      <div className="space-y-3">
        <p>
          Il trattamento dei dati si basa sulle seguenti basi giuridiche, ai
          sensi dell&apos;Art. 6 del GDPR:
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">Consenso (Art. 6.1.a):</span>{" "}
            al momento della registrazione, l&apos;utente acconsente al trattamento
            dei propri dati per le finalità descritte
          </li>
          <li>
            <span className="text-foreground font-medium">
              Esecuzione del contratto (Art. 6.1.b):
            </span>{" "}
            il trattamento è necessario per fornire il servizio richiesto
            (gestione lobby, strategie, coordinamento)
          </li>
          <li>
            <span className="text-foreground font-medium">
              Obbligo legale (Art. 6.1.c):
            </span>{" "}
            adempimento di obblighi previsti dalla legge applicabile
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "5",
    title: "Servizi terzi",
    content: (
      <div className="space-y-3">
        <p>
          La piattaforma si affida ai seguenti servizi terzi per il
          funzionamento:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                Supabase
              </h3>
              <p className="text-xs text-muted-foreground">
                Database, autenticazione e storage. I dati sono ospitati su
                server in UE.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                Vercel
              </h3>
              <p className="text-xs text-muted-foreground">
                Hosting della piattaforma. Log di accesso anonimizzati per 30
                giorni.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                Discord (Webhook)
              </h3>
              <p className="text-xs text-muted-foreground">
                Notifiche opzionali delle attività di lobby. Solo dati
                strettamente necessari.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                PostHog
              </h3>
              <p className="text-xs text-muted-foreground">
                Analytics anonimizzati (se abilitato). Dati non venduti a terzi.
              </p>
            </CardContent>
          </Card>
        </div>
        <p className="text-sm text-muted-foreground">
          Ciascun servizio terzo opera come responsabile del trattamento ai
          sensi dell&apos;Art. 28 GDPR. Per maggiori informazioni, consulta le
          rispettive privacy policy.
        </p>
      </div>
    ),
  },
  {
    id: "6",
    title: "Diritti dell'utente",
    content: (
      <div className="space-y-3">
        <p>
          Ai sensi del GDPR (Regolamento UE 2016/679), hai diritto a:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            {
              right: "Accesso",
              desc: "Ottenere conferma se i tuoi dati sono in nostro possesso e accedervi",
            },
            {
              right: "Rettifica",
              desc: "Correggere dati inesatti o incompleti",
            },
            {
              right: "Cancellazione",
              desc: "Richiedere la cancellazione dei tuoi dati (diritto all'oblio)",
            },
            {
              right: "Portabilità",
              desc: "Ricevere i tuoi dati in formato strutturato e leggibile",
            },
            {
              right: "Limitazione",
              desc: "Limitare il trattamento in determinate circostanze",
            },
            {
              right: "Opposizione",
              desc: "Opporti al trattamento per motivi legittimi",
            },
          ].map((item) => (
            <Card key={item.right} className="border-border/50">
              <CardContent className="p-3">
                <h3 className="font-semibold text-foreground text-sm">
                  {item.right}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Per esercitare i tuoi diritti, scrivici a{" "}
          <a
            href="mailto:privacy@r6hub.app"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            privacy@r6hub.app
          </a>
          . Risponderemo entro 30 giorni.
        </p>
      </div>
    ),
  },
  {
    id: "7",
    title: "Conservazione dei dati",
    content: (
      <div className="space-y-2">
        <p>
          I dati personali vengono conservati per tutta la durata
          dell&apos;account. Alla richiesta di cancellazione dell&apos;account o dopo 12
          mesi di inattività, i dati vengono eliminati entro 30 giorni, salvo
          obblighi di legge che richiedano una conservazione più lunga.
        </p>
        <p className="text-sm text-muted-foreground">
          I log di accesso tecnici (Vercel) vengono conservati per 30 giorni in
          forma anonimizzata.
        </p>
      </div>
    ),
  },
  {
    id: "8",
    title: "Trasferimento dati internazionale",
    content: (
      <div className="space-y-2">
        <p>
          I dati sono principalmente ospitati su server situati nell&apos;Unione
          Europea. Qualora fosse necessario trasferire dati al di fuori del SEE,
          adotteremo garanzie adeguate come le Clausole Contrattuali Standard
          (SCC) approvate dalla Commissione Europea.
        </p>
      </div>
    ),
  },
  {
    id: "9",
    title: "Reclamo all'autorità di controllo",
    content: (
      <div className="space-y-2">
        <p>
          Se ritieni che il trattamento dei tuoi dati violi il GDPR, hai il
          diritto di proporre un reclamo all&apos;autorità di controllo competente
          (in Italia, il Garante per la Protezione dei Dati Personali -
          www.garanteprivacy.it).
        </p>
      </div>
    ),
  },
];

export default function PrivacyPage() {
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
          <Link href="/" className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <BackArrowIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Torna alla home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-primary mb-4">
            <LockIcon className="size-5" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Informativa Privacy
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Privacy Policy
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
            Questa Privacy Policy descrive come r6hub raccoglie, utilizza e
            protegge i dati personali degli utenti. L&apos;utilizzo della
            piattaforma implica l&apos;accettazione di questa policy.
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
              href="/terms"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Leggi i Termini di Servizio
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
