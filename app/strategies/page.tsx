"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { LibraryStrategyCard } from "@/components/tasks/LibraryStrategyCard";
import { logger } from "@/lib/logger";
import type { StrategyTemplateWithRelations, StrategyTag, StrategyImage } from "@/types";

interface MapRow { id: string; name: string }
interface OperatorRow { id: string; name: string }

interface StrategyListItem extends StrategyTemplateWithRelations {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  operator_id: string | null;
  strategy_tags?: StrategyTag[];
  images?: StrategyImage[];
}

interface Pagination { page: number; pageSize: number; total: number; totalPages: number }

function StrategiesBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const map_id = searchParams.get("map_id") ?? "";
  const operator_id = searchParams.get("operator_id") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [strategies, setStrategies] = useState<StrategyListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [maps, setMaps] = useState<MapRow[]>([]);
  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Carica liste filtro (mappe, operatori, tags distinti)
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.from("maps").select("id, name").then(({ data }) => {
      setMaps((data ?? []) as MapRow[]);
    });
    supabase.from("operators").select("id, name").then(({ data }) => {
      setOperators((data ?? []) as OperatorRow[]);
    });
    supabase
      .from("strategy_tags")
      .select("tag")
      .then(({ data }) => {
        const seen = new Set<string>();
        const all = (data ?? []).map((r) => (r as { tag: string }).tag);
        setTags(all.filter((t) => !seen.has(t) && seen.add(t)).sort());
      });
  }, []);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.push(`/strategies?${next.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page), page_size: "12" });
    if (q) params.set("q", q);
    if (map_id) params.set("map_id", map_id);
    if (operator_id) params.set("operator_id", operator_id);
    if (tag) params.set("tag", tag);

    fetch(`/api/strategies?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          // Mappa strategy_images → images (la card usa il nome `images`)
          const items: StrategyListItem[] = (data.strategies ?? []).map(
            (s: Record<string, unknown>) => {
              const { strategy_images, ...rest } = s as {
                strategy_images?: StrategyImage[];
                [k: string]: unknown;
              };
              return {
                ...(rest as unknown as StrategyTemplateWithRelations),
                images: strategy_images ?? [],
                strategy_tags: (rest.strategy_tags ?? []) as StrategyTag[],
              };
            },
          );
          setStrategies(items);
          setPagination(data.pagination ?? null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          logger.error("Strategies", "load failed", e);
          setError("Impossibile caricare le strategie");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, map_id, operator_id, tag, page]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Biblioteca Strategie</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cerca strategie per mappa, operatore e tag.
        </p>
      </header>

      {/* Search + filtri */}
      <div className="mb-6 flex flex-col gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateParams({ q: String(fd.get("q") ?? ""), page: null });
          }}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Cerca per titolo o descrizione…"
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Cerca
          </button>
        </form>

        <div className="flex flex-wrap gap-2 text-sm">
          <select
            value={map_id}
            onChange={(e) => updateParams({ map_id: e.target.value || null, page: null })}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Tutte le mappe</option>
            {maps.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={operator_id}
            onChange={(e) => updateParams({ operator_id: e.target.value || null, page: null })}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Tutti gli operatori</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          <select
            value={tag}
            onChange={(e) => updateParams({ tag: e.target.value || null, page: null })}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Tutti i tag</option>
            {tags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          Nessuna strategia trovata con questi filtri.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((s) => (
            <LibraryStrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      )}

      {/* Paginazione */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="px-3 text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

export default function StrategiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Caricamento…</div>}>
      <StrategiesBrowser />
    </Suspense>
  );
}
