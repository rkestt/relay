"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isInLobby = pathname.startsWith("/lobby/");

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

  if (!user || isInLobby) return null;

  const name = user.user_metadata?.name || user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url;
  const initial = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="fixed top-3 right-3 z-50" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="size-10 rounded-full border border-neutral-700 overflow-hidden hover:border-amber-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center bg-neutral-800 text-sm font-medium text-neutral-200">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl animate-in fade-in">
          <div className="px-4 py-3 text-sm text-neutral-300 border-b border-neutral-700 truncate">
            {name}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-left text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors rounded-b-lg"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
