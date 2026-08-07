"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackArrowIcon } from "@/components/icons";
import { RelayLogo } from "@/components/ui/RelayLogo";

const cookieCategories = [
  {
    id: "tecnici",
    title: "Technical cookies (required)",
    description:
      "These cookies are essential for the platform to function. They cannot be disabled.",
    cookies: [
      {
        name: "sb-{project-ref}-auth-token",
        purpose: "Authentication and user session management (Supabase)",
        duration: "Session",
      },
      {
        name: "sb-{project-ref}-auth-token-code-verifier",
        purpose: "OAuth authentication flow verification",
        duration: "Session",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics cookies",
    description:
      "These cookies collect anonymized data about platform usage. They are only activated with your consent.",
    cookies: [
      {
        name: "ph_*",
        purpose: "Navigation analytics (PostHog) — visited pages, session duration",
        duration: "1 year",
      },
    ],
  },
];

const LAST_UPDATED = "August 5, 2026";

export default function CookiesPage() {
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
            Last updated: {LAST_UPDATED}
          </p>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            This Cookie Policy explains what cookies are, how we use them, and
            how you can manage your preferences.
          </p>
        </div>

        {/* Intro section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">What are cookies</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              Cookies are small text files that websites save on the user&apos;s
              device during browsing. They allow the site to remember actions
              and preferences (such as login, language, theme) over time.
            </p>
            <p>
              We use first-party cookies (set directly by Relay) and, only with
              your consent, third-party cookies for statistical analysis.
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
                          Cookie name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Duration
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

        {/* Managing preferences */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Managing your preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>You can manage your cookie preferences at any time:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <span className="text-foreground font-medium">
                  From the platform:
                </span>{" "}
                visit{" "}
                <Link
                  href="/settings/cookies"
                  className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                >
                  Cookie settings
                </Link>{" "}
                to enable or disable analytics cookies
              </li>
              <li>
                <span className="text-foreground font-medium">
                  From the browser:
                </span>{" "}
                you can configure your browser to block or delete cookies.
                Consult your browser&apos;s guide for specific instructions
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Disabling technical cookies may compromise the correct
              functioning of the platform.
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
              Read the Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Read the Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}