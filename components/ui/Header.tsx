"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import UserMenu from "@/components/auth/UserMenu";
import { Home, Plus, ListTodo, Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/submit", label: "Submit", icon: Plus },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-40",
        "bg-surface-container shadow-2",
        "border-b border-outline/20",
        "transition-shadow duration-fast ease-default",
        scrolled && "shadow-3"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-lg font-bold text-on-surface"
          aria-label="Relay home"
        >
          <span className="text-primary">Re</span>
          <span>lay</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-fast",
                  active
                    ? "bg-surface-container-high text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          <div className="hidden md:block">
            <UserMenu />
          </div>

          <button
            ref={buttonRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center size-10 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="md:hidden border-t border-outline/20 bg-surface-container"
        >
          <nav className="flex flex-col p-2 gap-1" aria-label="Mobile navigation">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-fast",
                    active
                      ? "bg-surface-container-high text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              );
            })}
            <div className="border-t border-outline/20 pt-2 mt-1 flex justify-end px-2">
              <UserMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
