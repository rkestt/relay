"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useIsClient } from "@/hooks/useIsClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackArrowIcon, CheckIcon } from "@/components/icons";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function CookieSettingsPage() {
  const { consent, setPreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saved, setSaved] = useState(false);
  const mounted = useIsClient();

  // Sync local toggles with stored consent
  useEffect(() => {
    if (consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
            Back to home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
            Manage cookie preferences
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can change your cookie preferences at any time. Technical
            cookies are always active because they are required for the
            platform to work.
          </p>
        </div>

        {/* Current status */}
        {consent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Current status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Technical cookies
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-success">
                    <CheckIcon className="size-3.5" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Analytics cookies
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      consent.analytics ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {consent.analytics ? (
                      <>
                        <CheckIcon className="size-3.5" /> Active
                      </>
                    ) : (
                      "Disabled"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Marketing cookies
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      consent.marketing ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {consent.marketing ? (
                      <>
                        <CheckIcon className="size-3.5" /> Active
                      </>
                    ) : (
                      "Disabled"
                    )}
                  </span>
                </div>
                <div className="pt-2 text-xs text-muted-foreground border-t border-border">
                  Updated:{" "}
                  {new Date(consent.timestamp).toLocaleString("en-US", {
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
              Cookie preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Necessary - always on */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Technical cookies (required)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Authentication, session, core features
                  </p>
                </div>
                <span className="ml-3 shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Always active
                </span>
              </div>

              {/* Analytics toggle */}
              <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Analytics cookies
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Anonymized data to understand how you use the platform
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="ml-3 size-4 shrink-0 rounded border-border text-primary focus:ring-primary/50"
                  aria-label="Enable analytics cookies"
                />
              </label>

              {/* Marketing toggle */}
              <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Marketing cookies
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cookies to personalize content and offers
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="ml-3 size-4 shrink-0 rounded border-border text-primary focus:ring-primary/50"
                  aria-label="Enable marketing cookies"
                />
              </label>
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <Link
              href="/cookies"
              className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Read the Cookie Policy
            </Link>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="text-xs text-success animate-in fade-in duration-200">
                  Preferences saved
                </span>
              )}
              <Button onClick={handleSave}>Save preferences</Button>
            </div>
          </div>
        </Card>

        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              How to manage cookies in your browser
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>
              You can configure your browser to block or delete cookies at any
              time. Check your browser&apos;s guide for specific instructions.
            </p>
            <p>
              Disabling technical cookies may affect the platform&apos;s core
              functionality. Analytics and marketing cookies can be turned off
              without impact on core features.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
