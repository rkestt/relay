"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/fetch";

export function ProfileForm() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return;

      // Prefill da profiles (canonical), fallback a metadata
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .maybeSingle();

      if (cancelled) return;

      const metaName = data.user.user_metadata?.name as string | undefined;
      const current =
        profile?.username && !profile.username.startsWith("guest-")
          ? profile.username
          : metaName || "";

      setUsername(current);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const response = await apiFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save profile");
      }

      setSaved(true);
      // Notifica UserMenu per rinfrescare il nome in navbar
      window.dispatchEvent(new Event("relay:profile-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profilo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Nome
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Il tuo nome"
              maxLength={40}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-sm text-success" role="status">
              Profilo salvato
            </p>
          )}

          <Button type="submit" disabled={loading || !username.trim()}>
            {loading ? "Salvataggio..." : "Salva profilo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
