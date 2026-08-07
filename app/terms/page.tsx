"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackArrowIcon } from "@/components/icons";
import { RelayLogo } from "@/components/ui/RelayLogo";

const sections = [
  {
    id: "1",
    title: "Acceptance of Terms",
    content: (
      <div className="space-y-2">
        <p>
          By using the Relay platform, you agree to be bound by these Terms of
          Service in their entirety. If you do not accept one or more of these
          terms, please do not use the platform.
        </p>
        <p className="text-muted-foreground text-sm">
          These terms constitute a binding agreement between you
          (&ldquo;user&rdquo;) and Relay (&ldquo;platform&rdquo;). Registering
          or logging in to the platform constitutes automatic acceptance.
        </p>
      </div>
    ),
  },
  {
    id: "2",
    title: "Account Registration",
    content: (
      <div className="space-y-3">
        <p>
          You must register an account to use the platform. During
          registration, the user agrees to:
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>Provide truthful and up-to-date information (email, username)</li>
          <li>Not use false identities or third-party accounts</li>
          <li>
            Keep their login credentials confidential
          </li>
          <li>
            Promptly report any unauthorized use of their account
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          The user is responsible for all activities carried out through their
          account. Relay will not be liable for damages arising from
          unauthorized use of the account.
        </p>
      </div>
    ),
  },
  {
    id: "3",
    title: "Age Requirements",
    content: (
      <div className="space-y-2">
        <p>
          The platform is intended for users aged 16 or older. If you are
          under 16, you may not register or use the platform. Rainbow Six
          Siege is rated PEGI 16; access to the game is subject to Ubisoft&apos;s
          terms.
        </p>
        <p className="text-sm text-muted-foreground">
          We reserve the right to verify users&apos; age and to suspend accounts
          in case of violation.
        </p>
      </div>
    ),
  },
  {
    id: "4",
    title: "Rules of Conduct",
    content: (
      <div className="space-y-3">
        <p>By using the platform, the user agrees to:</p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>
            Not use the platform for illegal or fraudulent activities
          </li>
          <li>
            Not attempt to damage, overload, or compromise the platform&apos;s
            servers
          </li>
          <li>
            Not disseminate offensive, hateful, discriminatory, or harassing
            content
          </li>
          <li>
            Not use bots, scripts, or automated tools to interact with the
            platform
          </li>
          <li>
            Not exploit bugs or vulnerabilities to gain undue advantage
          </li>
          <li>
            Not violate the terms of service of Rainbow Six Siege or Ubisoft
            through the use of the platform
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Violation of these rules may result in the suspension or deletion of
          the account without notice.
        </p>
      </div>
    ),
  },
  {
    id: "5",
    title: "Intellectual Property",
    content: (
      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm">
            Platform content
          </h3>
          <p className="text-muted-foreground">
            The interface, design, code, and trademarks of Relay are the
            exclusive property of the platform and are protected by
            intellectual property laws.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm">
            User-generated content
          </h3>
          <p className="text-muted-foreground">
            Strategies, lobbies, tasks, and any other content created by the
            user on the platform remain the property of the user. By
            publishing, the user grants Relay a non-exclusive, free, and
            limited license to view, distribute, and manage such content for
            the sole purpose of operating the service.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm">
            Rainbow Six Siege
          </h3>
          <p className="text-muted-foreground">
            Rainbow Six Siege is a registered trademark of Ubisoft. Relay is an
            independent platform not affiliated with, sponsored by, or approved
            by Ubisoft. All third-party trademarks remain the property of their
            respective owners.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "6",
    title: "Limitation of Liability",
    content: (
      <div className="space-y-3">
        <p>
          The platform is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;, without warranties of any kind, express or implied.
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>
            Relay does not guarantee that the platform is free of errors,
            interruptions, or vulnerabilities
          </li>
          <li>
            Relay is not liable for direct or indirect damages arising from
            the use or inability to use the platform
          </li>
          <li>
            Relay is not liable for data loss, lost profits, or business
            interruption
          </li>
          <li>
            The platform is a support tool; gameplay decisions remain the
            user&apos;s responsibility
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Some jurisdictions do not allow the exclusion of certain implied
          warranties; therefore, the above exclusions may not apply in full.
        </p>
      </div>
    ),
  },
  {
    id: "7",
    title: "Account Suspension and Deletion",
    content: (
      <div className="space-y-3">
        <p>
          Relay reserves the right to suspend or delete an account in the
          following cases:
        </p>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          <li>Violation of these Terms of Service</li>
          <li>Fraudulent or illegal activity</li>
          <li>Prolonged inactivity (over 12 months)</li>
          <li>Direct request by the user</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          In case of deletion, data associated with the account will be
          removed within 30 days, except where required by law.
        </p>
      </div>
    ),
  },
  {
    id: "8",
    title: "Changes to These Terms",
    content: (
      <div className="space-y-2">
        <p>
          Relay reserves the right to modify these Terms of Service at any
          time. Changes will be communicated via:
        </p>
        <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
          <li>Email notification to the registered address</li>
          <li>Notice on the platform at the next login</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          Continued use of the platform after notification of changes
          constitutes acceptance of the new terms. If you do not accept the
          changes, you must stop using the platform and request account
          deletion.
        </p>
      </div>
    ),
  },
  {
    id: "9",
    title: "Governing Law and Jurisdiction",
    content: (
      <div className="space-y-2">
        <p>
          These Terms of Service are governed by Italian law. For any dispute
          relating to the interpretation or execution of these terms, the
          competent court is that of Milan, unless applicable law provides for
          a different and mandatory forum for consumers.
        </p>
        <p className="text-sm text-muted-foreground">
          For users residing outside Italy, mandatory provisions of the law of
          their country of residence may apply.
        </p>
      </div>
    ),
  },
  {
    id: "10",
    title: "Contact",
    content: (
      <div className="space-y-2">
        <p>
          For any questions regarding these Terms of Service, you can reach us
          at:
        </p>
        <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
          <li>
            Email:{" "}
            <a
              href="mailto:andrea.fiori.ff@gmail.com"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              andrea.fiori.ff@gmail.com
            </a>
          </li>
        </ul>
      </div>
    ),
  },
];

const LAST_UPDATED = "August 5, 2026";

export default function TermsPage() {
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
          <Link
            href="/"
            className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackArrowIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
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
              Terms of Service
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            These Terms of Service govern your use of the Relay platform.
            Please read them carefully before using the service.
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
              Read the Privacy Policy
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
