"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isInLobby = pathname.startsWith("/lobby/");

  useEffect(() => {
    const supabase = createBrowserClient();

    const loadUser = () => {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user ?? null);
      });
      // Cosmetic gate (not security — /moderate page re-checks server-side)
      fetch("/api/auth/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((me) => setIsModerator(Boolean(me?.isModerator)))
        .catch(() => {});
    };

    loadUser();
    window.addEventListener("relay:profile-updated", loadUser);
    return () => window.removeEventListener("relay:profile-updated", loadUser);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user || isInLobby) return null;

  const name = user.user_metadata?.name || user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url;
  const initial = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    localStorage.removeItem("Relay_room_code");
    router.push("/login");
  }

  return (
    <div className="fixed top-3 right-3 z-50" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="size-10 rounded-full border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center bg-muted text-sm font-medium text-foreground">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-popover shadow-3 animate-in fade-in">
          <div className="px-4 py-3 text-sm text-muted-foreground border-b border-border truncate">
            {name}
          </div>
          <Link
            href="/settings/account"
            className="block w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={() => setOpen(false)}
          >
            Account settings
          </Link>
          {isModerator && (
            <Link
              href="/moderate"
              className="block w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              ⚖ Moderate
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-b-lg"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
