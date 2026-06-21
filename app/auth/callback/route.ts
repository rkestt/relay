import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// In dev, Next.js can return 0.0.0.0 as host when server binds to 0.0.0.0.
// Reject 0.0.0.0 and IPv6 loopback fallbacks, prefer localhost in dev.
function safeOrigin(requestUrl: string, forwardedHost: string | null): string {
  const { origin } = new URL(requestUrl);
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    // Force localhost in dev (avoid 0.0.0.0 / [::] / IPv6 loopback)
    return "http://localhost:3000";
  }

  if (forwardedHost && !forwardedHost.startsWith("0.0.0.0")) {
    return `https://${forwardedHost}`;
  }

  // Fallback: if origin is 0.0.0.0, use NEXT_PUBLIC_SITE_URL or localhost
  if (origin.includes("0.0.0.0")) {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  }

  return origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const base = safeOrigin(request.url, forwardedHost);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }

    // Exchange failed (maybe duplicate call in StrictMode) — check if session exists
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // Session exists from first attempt, redirect to home
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  // If we get here, something went wrong — redirect to login with error
  return NextResponse.redirect(`${base}/login?error=auth_callback_failed`);
}
