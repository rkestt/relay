"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Plus, ListTodo, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/submit", label: "Submit", icon: Plus },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/settings/account", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around bg-surface-container shadow-2 border-t border-outline/20 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[4rem] rounded-2xl px-3 py-2 transition-colors duration-fast",
                active ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-6 transition-transform duration-fast",
                  active && "scale-110"
                )}
                fill={active ? "currentColor" : "none"}
                strokeWidth={active ? 1.5 : 2}
              />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
