"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { StrategyHotspot } from "@/types";

function isTrustedImageHost(url: string): boolean {
  return /^https:\/\/([\w-]+\.)*supabase\.co/.test(url) || url.startsWith("http://localhost");
}

interface StrategyDetail {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  map_id: string | null;
  site_id: string | null;
  operator_id: string | null;
  created_by: string | null;
  created_at: string | null;
  map?: { name: string } | null;
  operator?: { name: string } | null;
  tags?: { id: string; tag: string }[];
  gated: boolean;
}

interface DetailResponse {
  strategy: StrategyDetail;
  hotspots: StrategyHotspot[];
  images: { id: string; image_url: string; sort_order: number }[];
}

function HotspotOverlay({
  hotspots,
  gated,
}: {
  hotspots: StrategyHotspot[];
  gated: boolean;
}) {
  const [active, setActive] = useState<StrategyHotspot | null>(null);

  return (
    <div className="relative">
      {hotspots.map((h) => (
        <button
          key={h.id}
          type="button"
          aria-label={h.label ?? "Hotspot"}
          onClick={() => setActive(active?.id === h.id ? null : h)}
          className={cn(
            "absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/40 backdrop-blur-sm transition-colors hover:bg-primary/70",
            active?.id === h.id && "scale-125 bg-primary",
            gated && "pointer-events-none",
          )}
          style={{ left: `${h.x_percent}%`, top: `${h.y_percent}%` }}
        >
          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-amber-400" />
        </button>
      ))}

      {active && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-lg border border-primary/30 bg-black/90 px-3 py-2 text-sm text-foreground shadow-xl">
          {active.label ?? "Punto strategico"}
        </div>
      )}
    </div>
  );
}

export default function StrategyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/strategies/${id}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Strategy not found");
        return;
      }
      setData(json);
    } catch (e) {
      logger.error("StrategyDetail", "load failed", e);
      setError("Impossibile caricare la strategia");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  // Stato favorite
  useEffect(() => {
    if (!id) return;
    fetch(`/api/strategies/${id}/favorite`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setFavorited(Boolean(d.favorited));
      })
      .catch(() => {});
  }, [id]);

  async function handleToggleFavorite() {
    if (favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      const res = await fetch(`/api/strategies/${id}/favorite`, { method: "POST" });
      const json = await res.json();
      if (!json.error) setFavorited(Boolean(json.favorited));
    } catch {
      // ignora — stato non persistito
    } finally {
      setFavoriteBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-8 w-2/3 animate-pulse rounded bg-card" />
        <div className="mt-4 aspect-video animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{error ?? "Non trovata"}</p>
        <Link href="/strategies" className="mt-4 inline-block text-sm text-primary">
          ← Torna alla biblioteca
        </Link>
      </div>
    );
  }

  const { strategy, hotspots, images } = data;
  const orderedImages =
    images.length > 0
      ? [...images].sort((a, b) => a.sort_order - b.sort_order)
      : strategy.image_url
        ? [{ id: "primary", image_url: strategy.image_url, sort_order: 0 }]
        : [];
  const currentImage = orderedImages[Math.min(activeImage, orderedImages.length - 1)];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/strategies"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Torna alla biblioteca
      </Link>

      <h1 className="text-2xl font-bold">{strategy.title}</h1>

      <div className="mt-3">
        <button
          onClick={handleToggleFavorite}
          disabled={favoriteBusy}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            favorited
              ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"
          }`}
        >
          {favorited ? "★ Nel playbook" : "☆ Aggiungi al playbook"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
        {(strategy.tags ?? []).map((t) => (
          <span key={t.id} className="rounded-full border border-border bg-muted px-2 py-0.5">
            {t.tag}
          </span>
        ))}
      </div>

      {/* Immagine + hotspot overlay */}
      <div className="relative mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {currentImage ? (
          <div className="relative aspect-video w-full">
            <Image
              src={currentImage.image_url}
              alt={strategy.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              unoptimized={!isTrustedImageHost(currentImage.image_url)}
              className={cn("object-cover", strategy.gated && hotspots.length > 0 && "blur-md")}
            />
            {!strategy.gated && (
              <div className="absolute inset-0">
                <HotspotOverlay hotspots={hotspots} gated={false} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center text-muted-foreground">
            Nessuna immagine
          </div>
        )}

        {/* Gating blur overlay + CTA */}
        {strategy.gated && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              Questa strategia è disponibile per i membri Pro
            </p>
            <Link
              href="/upgrade"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Sblocca con Pro — €3.99/mese
            </Link>
          </div>
        )}
      </div>

      {/* Galleria immagini */}
      {orderedImages.length > 1 && (
        <div className="mt-3 flex gap-2">
          {orderedImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveImage(i)}
              className={cn(
                "relative size-16 overflow-hidden rounded-lg border-2",
                i === activeImage ? "border-primary" : "border-border opacity-60",
              )}
            >
              <Image src={img.image_url} alt="" fill sizes="64px" unoptimized={!isTrustedImageHost(img.image_url)} className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Descrizione / task breakdown */}
      {strategy.description && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Esecuzione
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {strategy.description}
          </div>
        </div>
      )}

      {/* Hotspot list gated (free: blur) */}
      {hotspots.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Punti chiave
          </h2>
          <ul className={cn("space-y-1 text-sm", strategy.gated && "blur-sm select-none")}>
            {hotspots.map((h, i) => (
              <li key={h.id} className="flex gap-2">
                <span className="text-primary">{i + 1}.</span>
                <span>{h.label ?? "Punto strategico"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
