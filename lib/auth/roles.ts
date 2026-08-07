import type { User } from "@supabase/supabase-js";

/**
 * Email allowlist of moderators (validators), read from env MODERATOR_EMAILS
 * (comma-separated). Single source of truth for the moderation role
 * (route approve, /api/moderate, /moderate page, UserMenu).
 *
 * The identity is the authenticated user's email (server-side, set by
 * Supabase Auth — not forgeable by the client). Case-insensitive.
 */
const MODERATORS: ReadonlySet<string> = (() => {
  const raw = process.env.MODERATOR_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
})();

export function isAllowed(user: User | null | false): boolean {
  if (!user || !user.email) return false;
  return MODERATORS.has(user.email.toLowerCase());
}