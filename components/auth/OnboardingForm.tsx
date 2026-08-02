"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/fetch";
import { AlertIcon } from "@/components/icons";

export function OnboardingForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8">
        <div className="flex flex-col gap-1.5 text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Completa il tuo profilo
          </h1>
          <p className="text-sm text-muted-foreground">
            Scegli un nome per comparire in lobby e nella community
          </p>
        </div>

        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 mb-6 animate-in fade-in duration-200"
            role="alert"
            aria-live="polite"
          >
            <AlertIcon className="size-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              autoComplete="nickname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Il tuo nome"
              maxLength={40}
              required
              autoFocus
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading || !username.trim()}
            className="w-full h-11"
          >
            {loading ? "Salvataggio..." : "Continua"}
          </Button>
        </form>
      </div>
    </div>
  );
}
