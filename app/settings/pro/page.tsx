"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

interface LicenseRow {
  id: string;
  provider: string;
  key: string;
  status: string;
  expires_at: string | null;
  created_at: string | null;
}

interface ProState {
  is_pro: boolean;
  pro_expires_at: string | null;
  licenses: LicenseRow[];
}

export default function ProSettingsPage() {
  const [state, setState] = useState<ProState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setError("Not authenticated");
        return;
      }
      const [{ data: profile }, { data: licenses }] = await Promise.all([
        supabase
          .from("profiles")
          .select("is_pro, pro_expires_at")
          .eq("id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("license_keys")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false }),
      ]);
      setState({
        is_pro: Boolean(profile?.is_pro),
        pro_expires_at: (profile?.pro_expires_at as string | null) ?? null,
        licenses: (licenses ?? []) as LicenseRow[],
      });
    } catch (e) {
      logger.error("ProSettings", "load failed", e);
      setError("Impossibile caricare lo stato Pro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isActive =
    Boolean(state?.is_pro) &&
    (!state?.pro_expires_at ||
      new Date(state.pro_expires_at).getTime() > Date.now());

  if (loading) {
    return (
      <div className="container max-w-2xl py-8 space-y-4 animate-pulse">
        <div className="h-8 w-56 rounded bg-muted" />
        <div className="h-24 rounded-2xl bg-card" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Abbonamento Pro</h1>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stato abbonamento */}
      <div
        className={`rounded-2xl border p-6 ${
          isActive ? "border-success/30 bg-success/10" : "border-border bg-card"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {isActive ? "Pro attivo" : "Piano gratuito"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isActive
                ? state?.pro_expires_at
                  ? `Scadenza: ${new Date(state.pro_expires_at).toLocaleDateString("it-IT")}`
                  : "Attivato per sempre — nessun rinnovo."
                : "Attiva Pro per la biblioteca completa."}
            </p>
          </div>
          {!isActive && (
            <Link
              href="/upgrade"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Attiva Pro
            </Link>
          )}
        </div>
      </div>

      {/* History licenze */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Licenze
        </h2>
        {state && state.licenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna licenza registrata.</p>
        ) : (
          <div className="space-y-2">
            {state?.licenses.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium">{l.provider}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {l.key.slice(0, 18)}…
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    l.status === "active"
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
