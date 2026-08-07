import { createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// GET /api/users/[username] — profilo pubblico senza auth
// Ritorna dati pubblici del profilo + strategie approvate.
// ──────────────────────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const adminClient = createAdminClient();

    const { data: profile, error: profError } = await withTimeout(
      adminClient
        .from("profiles")
        .select(
          "id, username, avatar_url, is_pro, is_verified_contributor, contributed_count, created_at",
        )
        .eq("username", username)
        .maybeSingle(),
      10000,
      "fetch public profile",
    );

    if (profError) {
      logger.error("API", "Profile fetch error", profError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 },
      );
    }
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Strategie approvate dall'utente
    const { data: strategies, error: stratError } = await withTimeout(
      adminClient
        .from("strategy_templates")
        .select("id, title, description, image_url, created_at, strategy_images(*)")
        .eq("created_by", profile.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50),
      10000,
      "fetch profile strategies",
    );

    if (stratError) {
      logger.error("API", "Profile strategies error", stratError);
      return NextResponse.json(
        { error: "Failed to fetch strategies" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        is_pro: profile.is_pro,
        is_verified_contributor: profile.is_verified_contributor,
        contributed_count: profile.contributed_count ?? 0,
        created_at: profile.created_at,
      },
      strategies: strategies ?? [],
    });
  } catch (error) {
    logger.error("API", "Public profile unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
