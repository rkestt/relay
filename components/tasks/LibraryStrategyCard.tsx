"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { StrategyTemplateWithRelations } from "@/types";

// Host non configurati in next.config remotePatterns → render senza optimization
function isTrustedImageHost(url: string): boolean {
  return /^https:\/\/([\w-]+\.)*supabase\.co/.test(url) || url.startsWith("http://localhost");
}

interface LibraryCardProps {
  strategy: StrategyTemplateWithRelations;
  gated?: boolean;
}

export function LibraryStrategyCard({ strategy, gated = false }: LibraryCardProps) {
  const firstImage =
    strategy.images && strategy.images.length > 0
      ? [...strategy.images].sort((a, b) => a.sort_order - b.sort_order)[0].image_url
      : strategy.image_url;

  const tags = strategy.strategy_tags ?? [];

  return (
    <Link
      href={`/strategies/${strategy.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
        {firstImage ? (
          <Image
            src={firstImage}
            alt={strategy.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={!isTrustedImageHost(firstImage)}
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-105",
              gated && "blur-md",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-neutral-600">
            No image
          </div>
        )}
        {gated && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-amber-500/40 bg-black/70 px-3 py-1 text-xs font-medium text-amber-400">
              Pro
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
          {strategy.title}
        </h3>
        {strategy.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {strategy.description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {tags.slice(0, 4).map((t) => (
              <span
                key={t.id}
                className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {t.tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
