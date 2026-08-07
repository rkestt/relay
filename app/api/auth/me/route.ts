import { createClient } from "@/lib/supabase/server";
import { isAllowed } from "@/lib/auth/roles";
import { NextResponse } from "next/server";

// GET /api/auth/me — minimal identity info for the client (UserMenu gating).
// Returns isModerator so the UI can show/hide the "Moderate" entry without
// shipping the MODERATOR_EMAILS allowlist to the client.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ user: null, isModerator: false }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    isModerator: isAllowed(user),
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}