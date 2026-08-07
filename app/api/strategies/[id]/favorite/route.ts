import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// GET /api/strategies/[id]/favorite — stato favorite dell'utente
// POST /api/strategies/[id]/favorite — toggle favorite
// RLS: strategy_favorites è owner-only (migrazione 00029)
// ──────────────────────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: fav } = await supabase
      .from("strategy_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("strategy_id", id)
      .maybeSingle();

    return NextResponse.json({ favorited: Boolean(fav) });
  } catch (error) {
    logger.error("API", "Favorite GET error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verifica che la strategia esista
    const { data: strategy } = await supabase
      .from("strategy_templates")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    // Toggle: se esiste → delete, altrimenti insert (RLS owner-only)
    const { data: existing } = await supabase
      .from("strategy_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("strategy_id", id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("strategy_favorites")
        .delete()
        .eq("id", existing.id);
      if (error) {
        logger.error("API", "Favorite delete error", error);
        return NextResponse.json(
          { error: "Failed to remove favorite" },
          { status: 500 },
        );
      }
      return NextResponse.json({ favorited: false });
    }

    const { error: insertError } = await supabase
      .from("strategy_favorites")
      .insert({ user_id: user.id, strategy_id: id });
    if (insertError) {
      logger.error("API", "Favorite insert error", insertError);
      return NextResponse.json(
        { error: "Failed to add favorite" },
        { status: 500 },
      );
    }
    return NextResponse.json({ favorited: true });
  } catch (error) {
    logger.error("API", "Favorite POST error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
