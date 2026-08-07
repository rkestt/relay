import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// GET /api/favorites — lista favoriti dell'utente (playbook)
// RLS owner-only su strategy_favorites; join su strategy_templates.
// ──────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await withTimeout(
      supabase
        .from("strategy_favorites")
        .select(
          "id, created_at, strategy:strategy_templates(id, title, description, image_url, created_at, strategy_images(*))",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      10000,
      "fetch favorites",
    );

    if (error) {
      logger.error("API", "Favorites list error", error);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 },
      );
    }

    return NextResponse.json({ favorites: data ?? [] });
  } catch (error) {
    logger.error("API", "Favorites list unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
