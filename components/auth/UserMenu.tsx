"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
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

  if (!user) return null;

  const name = user.user_metadata?.name || user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url;
  const initial = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    localStorage.removeItem("r6hub_room_code");
    router.push("/login");
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          "border border-outline bg-surface-container-low text-on-surface",
          "hover:bg-surface-container-high transition-colors duration-fast",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium">{initial}</span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-48 rounded-lg",
            "border border-outline bg-surface-container-high shadow-3",
            "animate-in fade-in slide-in-from-top-2 duration-fast"
          )}
          role="menu"
        >
          <div className="px-4 py-3 text-sm text-on-surface-variant border-b border-outline truncate">
            {name}
          </div>
          <Link
            href="/settings/account"
            className="block w-full px-4 py-2.5 text-left text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors duration-fast"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Impostazioni account
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full rounded-b-lg px-4 py-2.5 text-left text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors duration-fast"
            role="menuitem"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
