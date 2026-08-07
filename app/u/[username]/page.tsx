"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { logger } from "@/lib/logger";

interface PublicProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  is_verified_contributor: boolean;
  contributed_count: number;
  created_at: string | null;
}

interface ProfileStrategy {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  strategy_images?: { image_url: string; sort_order: number }[];
}

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [strategies, setStrategies] = useState<ProfileStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        setNotFound(true);
        return;
      }
      setProfile(json.profile);
      setStrategies(json.strategies ?? []);
    } catch (e) {
      logger.error("PublicProfile", "load failed", e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) load();
  }, [username, load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Profilo non trovato.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary">
          ← Torna alla home
        </Link>
      </div>
    );
  }

  const firstImage = (s: ProfileStrategy): string | null => {
    if (s.strategy_images && s.strategy_images.length > 0) {
      return [...s.strategy_images].sort((a, b) => a.sort_order - b.sort_order)[0].image_url;
    }
    return s.image_url ?? null;
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* Header profilo */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-neutral-800 text-2xl font-semibold">
              {(profile.username ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-xl font-bold">
              {profile.username ?? "Utente"}
              {profile.is_verified_contributor && (
                <span
                  title="Verified Contributor"
                  className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400"
                >
                  ✓ Verified Contributor
                </span>
              )}
            </h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {profile.is_pro && (
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-primary">
                  Pro
                </span>
              )}
              <span>{profile.contributed_count} strategie contribuite</span>
              {profile.created_at && (
                <span>
                  Da {new Date(profile.created_at).toLocaleDateString("it-IT")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strategie pubblicate */}
      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Strategie pubblicate ({strategies.length})
      </h2>
      {strategies.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nessuna strategia pubblicata.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {strategies.map((s) => {
            const img = firstImage(s);
            return (
              <Link
                key={s.id}
                href={`/s/${s.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                  {img ? (
                    <Image
                      src={img}
                      alt={s.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized={!/^https:\/\/([\w-]+\.)*supabase\.co/.test(img)}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-neutral-600">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold">{s.title}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
