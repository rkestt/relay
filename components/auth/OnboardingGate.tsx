"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

const SKIP_PATHS = ["/onboarding", "/login", "/signup"];

/**
 * Redirige l'utente autenticato verso /onboarding se il profilo è
 * incompleto (username mancante o ancora 'guest-xxxxxxxx').
 * Non blocca mai le pagine di lobby: un gioco in corso non va interrotto.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;

    const isLobby = pathname.startsWith("/lobby");
    if (SKIP_PATHS.includes(pathname) || isLobby) return;

    const supabase = createBrowserClient();
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .maybeSingle();

      if (cancelled) return;
      checked.current = true;

      const username = profile?.username;
      if (!username || username.startsWith("guest-")) {
        router.replace("/onboarding");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <>{children}</>;
}
