import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// GET /api/strategies/mine — author's own strategies (any status)
// Authenticated. Cache-control: private, no-store — a shared/public cache
// would poison one user's pending data to another (grill G4). This is why
// author-pending must NOT be served via the public ?status=pending path.
// RLS: own rows readable via 00036 select_own policies.
// ──────────────────────────────────────────────
export async function GET(_request: Request) {
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
        .from("strategy_templates")
        .select(
          "id, title, description, image_url, status, map_id, site_id, operator_id, side, created_by, created_at, rejected_reason, moderated_at, strategy_tags(*), strategy_images(*), strategy_operators(operator_id)",
        )
        .eq("created_by", user.id)
        .order("created_at", { ascending: false }),
      10000,
      "fetch my strategies",
    );

    if (error) {
      logger.error("API", "Failed to fetch my strategies", error);
      return NextResponse.json(
        { error: "Failed to fetch strategies" },
        { status: 500 },
      );
    }

    return NextResponse.json({ strategies: data ?? [] }, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    logger.error("API", "My strategies unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}