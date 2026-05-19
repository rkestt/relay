"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.info("LoginPage", "LoginPage mount");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info("LoginPage", "Magic link send", { email });
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      logger.info("LoginPage", "Magic link sent successfully", { email });
      setMessage("Check your email for the magic link.");
    } catch (err) {
      logger.error("LoginPage", "Magic link send failed", err);
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50 items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl border border-neutral-800 bg-neutral-900">
            <svg
              className="size-6 text-neutral-50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Sign in to create or join lobbies.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={cn(
                "w-full h-12 px-4 rounded-xl text-sm bg-neutral-900 border-2 transition-all duration-200",
                "placeholder:text-neutral-600",
                "focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20",
                error
                  ? "border-red-400/60 focus:border-red-400 focus:ring-red-400/20"
                  : "border-neutral-700 focus:border-amber-500/60 focus:ring-amber-500/20",
                "hover:border-neutral-600"
              )}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading || !email.trim()}
            className={cn(
              "w-full h-12 rounded-xl text-sm font-bold",
              "bg-amber-500 text-neutral-950",
              "hover:bg-amber-400 active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="size-4 border-2 border-neutral-700 border-t-neutral-950 rounded-full animate-spin" />
                Sending…
              </span>
            ) : (
              "Send Magic Link"
            )}
          </Button>
        </form>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20">
            <svg
              className="size-4 text-red-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {message && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
            <svg
              className="size-4 text-emerald-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-sm text-emerald-400">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
