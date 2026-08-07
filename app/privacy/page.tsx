"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackArrowIcon, LockIcon } from "@/components/icons";
import { RelayLogo } from "@/components/ui/RelayLogo";

const sections = [
  {
    id: "1",
    title: "Data Controller",
    content: (
      <div className="space-y-2">
        <p>
          The data controller is Relay (hereinafter, &ldquo;platform&rdquo;).
          For any request regarding your personal data, you can contact us at
          the email address:{" "}
          <a
            href="mailto:andrea.fiori.ff@gmail.com"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            andrea.fiori.ff@gmail.com
          </a>
        </p>
        <p className="text-muted-foreground text-sm">
          Relay is a second-screen platform for Rainbow Six Siege, dedicated
          to managing lobbies, strategies, and team coordination.
        </p>
      </div>
    ),
  },
  {
    id: "2",
    title: "Data Collected",
    content: (
      <div className="space-y-3">
        <p>
          While using the platform, we collect the following personal data:
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">Registration data:</span>{" "}
            email, username, avatar (if provided via Discord OAuth)
          </li>
          <li>
            <span className="text-foreground font-medium">Usage data:</span>{" "}
            created lobbies, saved strategies, assigned tasks, language and
            theme preferences
          </li>
          <li>
            <span className="text-foreground font-medium">Technical data:</span>{" "}
            IP address, user agent, device type, visited pages
          </li>
          <li>
            <span className="text-foreground font-medium">Authentication data:</span>{" "}
            session tokens, OAuth provider used (email/password or Discord)
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          We do not collect sensitive data (racial origin, political opinions,
          religion, health, etc.) or genetic data.
        </p>
      </div>
    ),
  },
  {
    id: "3",
    title: "Purpose of Processing",
    content: (
      <div className="space-y-3">
        <p>Collected data is used for the following purposes:</p>
        <ol className="space-y-2 list-decimal pl-5 text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">
              Provision of the service:
            </span>{" "}
            creating and managing lobbies, saving strategies, coordinating team
            tasks
          </li>
          <li>
            <span className="text-foreground font-medium">Authentication:</span>{" "}
            login via email/password or Discord OAuth, user session management
          </li>
          <li>
            <span className="text-foreground font-medium">
              Service communications:
            </span>{" "}
            notifications regarding changes to the Terms of Service or
            Privacy Policy
          </li>
          <li>
            <span className="text-foreground font-medium">Support:</span>{" "}
            responding to assistance requests or the exercise of privacy rights
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: "4",
    title: "Legal Basis",
    content: (
      <div className="space-y-3">
        <p>
          Data processing is based on the following legal bases, under Art. 6
          of the GDPR:
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">Consent (Art. 6.1.a):</span>{" "}
            at registration, the user consents to the processing of their data
            for the described purposes
          </li>
          <li>
            <span className="text-foreground font-medium">
              Performance of a contract (Art. 6.1.b):
            </span>{" "}
            processing is necessary to provide the requested service (lobby
            management, strategies, coordination)
          </li>
          <li>
            <span className="text-foreground font-medium">
              Legal obligation (Art. 6.1.c):
            </span>{" "}
            compliance with obligations under applicable law
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "5",
    title: "Third-Party Services",
    content: (
      <div className="space-y-3">
        <p>
          The platform relies on the following third-party services to
          operate:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                Supabase
              </h3>
              <p className="text-xs text-muted-foreground">
                Database, authentication, and storage. Data is hosted on
                servers in the EU.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                Hetzner
              </h3>
              <p className="text-xs text-muted-foreground">
                Platform hosting (dedicated EU server). Access logs kept for 30
                days.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                Discord (Webhook)
              </h3>
              <p className="text-xs text-muted-foreground">
                Optional notifications for lobby activity. Only strictly
                necessary data.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                PostHog
              </h3>
              <p className="text-xs text-muted-foreground">
                Navigation analytics — visited pages, session duration. Data
                not sold to third parties.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                Sentry
              </h3>
              <p className="text-xs text-muted-foreground">
                Error and crash monitoring for the operation of the service.
                No personal data, only technical logs.
              </p>
            </CardContent>
          </Card>
        </div>
        <p className="text-sm text-muted-foreground">
          Each third-party service acts as a data processor under Art. 28
          GDPR. For more information, consult their respective privacy
          policies.
        </p>
      </div>
    ),
  },
  {
    id: "6",
    title: "User Rights",
    content: (
      <div className="space-y-3">
        <p>
          Under the GDPR (EU Regulation 2016/679), you have the right to:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            {
              right: "Access",
              desc: "Obtain confirmation of whether your data is held by us and to access it",
            },
            {
              right: "Rectification",
              desc: "Correct inaccurate or incomplete data",
            },
            {
              right: "Erasure",
              desc: "Request the deletion of your data (right to be forgotten)",
            },
            {
              right: "Portability",
              desc: "Receive your data in a structured, machine-readable format",
            },
            {
              right: "Restriction",
              desc: "Restrict processing in certain circumstances",
            },
            {
              right: "Objection",
              desc: "Object to processing for legitimate reasons",
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
          To exercise your rights, write to us at{" "}
          <a
            href="mailto:andrea.fiori.ff@gmail.com"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            andrea.fiori.ff@gmail.com
          </a>
          . We will respond within 30 days.
        </p>
      </div>
    ),
  },
  {
    id: "7",
    title: "Data Retention",
    content: (
      <div className="space-y-2">
        <p>
          Personal data is retained for the entire duration of the account.
          Upon a deletion request or after 12 months of inactivity, data is
          removed within 30 days, except where legal obligations require
          longer retention.
        </p>
        <p className="text-sm text-muted-foreground">
          Technical access logs (Hetzner) are kept for 30 days.
        </p>
      </div>
    ),
  },
  {
    id: "8",
    title: "International Data Transfer",
    content: (
      <div className="space-y-2">
        <p>
          Data is primarily hosted on servers located in the European Union.
          Should it become necessary to transfer data outside the EEA, we will
          adopt adequate safeguards such as the Standard Contractual Clauses
          (SCC) approved by the European Commission.
        </p>
      </div>
    ),
  },
  {
    id: "9",
    title: "Complaints to a Supervisory Authority",
    content: (
      <div className="space-y-2">
        <p>
          If you believe that the processing of your data violates the GDPR,
          you have the right to lodge a complaint with the competent
          supervisory authority (in Italy, the Garante per la Protezione dei
          Dati Personali - www.garanteprivacy.it).
        </p>
      </div>
    ),
  },
];

const LAST_UPDATED = "August 5, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-background">
      {/* Back navigation */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2">
          <RelayLogo
            variant="mark"
            className="size-5 text-primary shrink-0"
            ariaLabel="Relay"
          />
          <Link href="/" className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <BackArrowIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-primary mb-4">
            <LockIcon className="size-5" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Privacy Policy
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            This Privacy Policy describes how Relay collects, uses, and
            protects the personal data of users. Use of the platform implies
            acceptance of this policy.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.id} id={`section-${section.id}`} className="border-border/50">
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
              Read the Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Read the Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}