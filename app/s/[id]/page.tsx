"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { logger } from "@/lib/logger";

function isTrustedImageHost(url: string): boolean {
  return /^https:\/\/([\w-]+\.)*supabase\.co/.test(url) || url.startsWith("http://localhost");
}

interface ShareStrategy {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  map?: { name: string } | null;
  operator?: { name: string } | null;
  tags?: { id: string; tag: string }[];
  gated: boolean;
}

/**
 * Pagina pubblica view-only per strategia condivisa (BUSINESS §8.1):
 * i link condivisi (Discord/Reddit) si vedono GRATIS senza login.
 * Preview: titolo, immagine, descrizione. CTA upgrade gentile, non bloccante.
 * Il gating completo resta sulla pagina /strategies/[id] autenticata.
 */
export default function SharedStrategyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [strategy, setStrategy] = useState<ShareStrategy | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/strategies/${id}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        setStrategy(null);
        return;
      }
      setStrategy(json.strategy);
    } catch (e) {
      logger.error("ShareStrategy", "load failed", e);
      setStrategy(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="aspect-video animate-pulse rounded-2xl bg-card" />
        <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-card" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Strategia non trovata.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary">
          Vai a r6hub
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {strategy.image_url ? (
          <div className="relative aspect-video w-full">
            <Image
              src={strategy.image_url}
              alt={strategy.title}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              unoptimized={!isTrustedImageHost(strategy.image_url)}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center text-muted-foreground">
            Nessuna immagine
          </div>
        )}

        <div className="p-5">
          <h1 className="text-xl font-bold">{strategy.title}</h1>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {strategy.map?.name && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                {strategy.map.name}
              </span>
            )}
            {strategy.operator?.name && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                {strategy.operator.name}
              </span>
            )}
            {(strategy.tags ?? []).slice(0, 5).map((t) => (
              <span key={t.id} className="rounded-full border border-border bg-muted px-2 py-0.5">
                {t.tag}
              </span>
            ))}
          </div>

          {strategy.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {strategy.description}
            </p>
          )}

          {/* CTA upgrade gentile, non bloccante */}
          <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Questa è un&apos;anteprima. Su r6hub trovi hotspot interattivi, task breakdown e
              la biblioteca completa.
            </p>
            <Link
              href="/upgrade"
              className="mt-3 inline-block rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
            >
              Scopri r6hub Pro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
