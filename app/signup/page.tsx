"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logger } from "@/lib/logger";
import { AlertIcon, DiscordIcon } from "@/components/icons";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  useEffect(() => {
    setMounted(true);
    logger.info("SignupPage", "SignupPage mount");
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info("SignupPage", "Email/password signup", { email });

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!acceptTerms) {
      setError("Devi accettare i termini per continuare");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      logger.info("SignupPage", "Signup successful", {
        email,
        userId: data.user?.id,
      });
      setSuccess(true);
    } catch (err) {
      logger.error("SignupPage", "Signup failed", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordSignup = async () => {
    logger.info("SignupPage", "Discord OAuth signup");
    setDiscordLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      logger.error("SignupPage", "Discord OAuth failed", err);
      setError(
        err instanceof Error ? err.message : "Failed to sign up with Discord",
      );
      setDiscordLoading(false);
    }
  };

  // Success screen after email signup
  if (success) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div
          className={cn(
            "w-full max-w-sm bg-card border border-border rounded-xl p-8",
            "transition-all duration-300 ease-out",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center justify-center size-14 rounded-full bg-success/10 border border-success/20 animate-in zoom-in duration-300">
              <svg
                className="size-7 text-success"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Check your email
              </h1>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to{" "}
                <span className="text-foreground font-medium">{email}</span>.
                Click the link to activate your account.
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div
        className={cn(
          "w-full max-w-sm bg-card border border-border rounded-xl p-8",
          "transition-all duration-300 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        {/* Header */}
        <div className="flex flex-col gap-1.5 text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create account
          </h1>
          <p className="text-sm text-muted-foreground">Join r6Hub today</p>
        </div>

        {/* Error */}
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

        {/* Email/Password Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className={cn("h-11", error && "border-destructive/50 focus:ring-destructive/20 focus:border-destructive")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className={cn(
                  "pr-10 h-11",
                  error && "border-destructive/50 focus:ring-destructive/20 focus:border-destructive",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              className={cn("h-11", error && "border-destructive/50 focus:ring-destructive/20 focus:border-destructive")}
            />
          </div>

          {/* Privacy/Terms Checkbox */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="acceptTerms"
              className="flex items-start gap-2 cursor-pointer"
            >
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
                aria-describedby={!acceptTerms && error === "Devi accettare i termini per continuare" ? "terms-error" : undefined}
              />
              <span className="text-sm text-muted-foreground leading-5 select-none">
                Accetto la{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </Link>{" "}
                e i{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline underline-offset-2 transition-colors"
                >
                  Termini di Servizio
                </Link>
              </span>
            </label>
            {!acceptTerms && error === "Devi accettare i termini per continuare" && (
              <p id="terms-error" className="text-xs text-destructive ml-6" role="alert">
                Devi accettare i termini per continuare
              </p>
            )}
          </div>

          {/* Marketing Checkbox */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="acceptMarketing"
              className="flex items-start gap-2 cursor-pointer"
            >
              <input
                id="acceptMarketing"
                type="checkbox"
                checked={acceptMarketing}
                onChange={(e) => setAcceptMarketing(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
              />
              <span className="text-sm text-muted-foreground leading-5 select-none">
                Voglio ricevere aggiornamenti e novità via email
              </span>
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={
              loading || !email.trim() || !password.trim() || !confirmPassword.trim()
            }
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">
            or
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Discord OAuth */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleDiscordSignup}
          disabled={discordLoading}
          className="w-full h-11"
          aria-label="Continue with Discord"
        >
          {discordLoading ? (
            <span className="flex items-center gap-2">
              <div className="size-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <DiscordIcon />
              Continue with Discord
            </span>
          )}
        </Button>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

