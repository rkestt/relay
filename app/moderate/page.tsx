import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAllowed } from "@/lib/auth/roles";
import { ModerateDashboard } from "@/components/moderate/ModerateDashboard";

export const dynamic = "force-dynamic";

export default async function ModeratePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Guard: only an authenticated moderator reaches the admin queries.
  // (No middleware.ts — this runs BEFORE any moderation data is fetched.)
  if (error || !user) {
    redirect("/login");
  }
  if (!isAllowed(user)) {
    redirect("/login");
  }

  return <ModerateDashboard />;
}