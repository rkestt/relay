"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

interface ProStatus {
  is_pro: boolean;
  pro_expires_at: string | null;
}

export default function UpgradePage() {
  const [status, setStatus] = useState<ProStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [justUpgraded, setJustUpgraded] = useState(false);

  // Ritorno dal checkout Lemon Squeezy: success=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      setJustUpgraded(true);
      // Rimuovi il parametro dalla URL senza ricaricare
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const supabase = createBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setStatus(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("is_pro, pro_expires_at")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (error) throw error;
      setStatus(data as ProStatus);
    } catch (e) {
      logger.error("Upgrade", "failed to load status", e);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const isPro = Boolean(status?.is_pro) &&
    (!status?.pro_expires_at || new Date(status.pro_expires_at).getTime() > Date.now());

  const checkoutUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL
    ? (process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL as string)
    : process.env.LEMON_SQUEEZY_CHECKOUT_URL || "";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-center">r6hub Pro</h1>
      <p className="mt-2 text-center text-muted-foreground">
        La biblioteca completa di strategie per ogni mappa, operatore e situazione.
      </p>

      {loading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl border border-border bg-card" />
      ) : justUpgraded ? (
        <div className="mt-8 rounded-2xl border border-success/30 bg-success/10 p-6 text-center">
          <h2 className="text-lg font-semibold text-success">Benvenuto in Pro! 🎉</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pro è attivo e resterà tuo per sempre. La biblioteca completa è sbloccata.
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href="/strategies"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Vai alla biblioteca
            </Link>
          </div>
        </div>
      ) : isPro ? (
        <div className="mt-8 rounded-2xl border border-success/30 bg-success/10 p-6 text-center">
          <h2 className="text-lg font-semibold text-success">Pro attivo 🎉</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {status?.pro_expires_at
              ? `Scade il ${new Date(status.pro_expires_at).toLocaleDateString("it-IT")}.`
              : "Attivato per sempre — nessun rinnovo, nessuna scadenza."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/strategies"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Vai alla biblioteca
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-6 text-center">
            <div className="text-4xl font-bold">
              €19.99
              <span className="text-base font-normal text-muted-foreground">una tantum · per sempre</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Paghi una volta. Pro è tuo. Niente abbonamento.</p>
          </div>
          <ul className="space-y-2 p-6 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Biblioteca strategie completa con search e filtri
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Hotspot interattivi su ogni strategia
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Task breakdown dettagliati
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Playbook e favoriti personali
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Badge Pro in lobby
            </li>
          </ul>
          <div className="p-6 pt-0">
            {checkoutUrl ? (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-primary py-3 text-center font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Attiva Pro
              </a>
            ) : (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-center text-sm text-warning">
                Il checkout non è ancora configurato. Riprova più tardi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
