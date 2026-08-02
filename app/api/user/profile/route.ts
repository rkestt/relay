import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";

const USERNAME_MAX = 40;

function sanitizeUsername(raw: string): string | null {
  const cleaned = raw
    // strip control chars, keep spaces
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
  if (!cleaned || cleaned.length > USERNAME_MAX) return null;
  return cleaned;
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { username?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.username !== "string") {
    return Response.json({ error: "username is required" }, { status: 400 });
  }

  const username = sanitizeUsername(body.username);
  if (!username) {
    return Response.json(
      { error: `username must be 1-${USERNAME_MAX} characters` },
      { status: 400 },
    );
  }

  // Upsert profile (admin client bypasses RLS; no INSERT policy on profiles).
  // avatar_url NON viene toccato: LWTS-10 vieta profile pictures utente,
  // l'avatar è assegnato dall'app (5 avatar fissi in lobby).
  const admin = createAdminClient();
  const { error: profileError } = await withTimeout(
    admin.from("profiles").upsert(
      {
        id: user.id,
        username,
      },
      { onConflict: "id" },
    ),
    15000,
    "upsert profile",
  );

  if (profileError) {
    logger.error("API", "Failed to upsert profile", profileError, { userId: user.id });
    return Response.json({ error: "Failed to save profile" }, { status: 500 });
  }

  // Sync auth metadata so the navbar (UserMenu reads user_metadata.name)
  // shows the same name as the lobby (profiles.username). avatar_url in
  // metadata resta intatto (usato solo per l'avatar Discord in navbar).
  const { error: updateError } = await supabase.auth.updateUser({
    data: { name: username },
  });

  if (updateError) {
    logger.error("API", "Failed to sync auth metadata", updateError, { userId: user.id });
    return Response.json({ error: "Failed to save profile" }, { status: 500 });
  }

  return Response.json({ success: true, username });
}
