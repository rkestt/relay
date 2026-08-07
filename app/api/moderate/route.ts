import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { isAllowed } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// GET /api/moderate — pending strategies backlog for a moderator.
// Read-only. Decisions are made ONLY on POST /api/strategies/[id]/approve
// (single source of decision logic).
//   - 401 unauthenticated
//   - 403 authenticated but not a moderator
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
    if (!isAllowed(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await withTimeout(
      admin
        .from("strategy_templates")
        .select(
          "id, title, description, image_url, status, map_id, site_id, operator_id, side, created_by, created_at, strategy_tags(*), strategy_images(*), strategy_operators(operator_id), profiles!strategy_templates_created_by_fkey(username)",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      10000,
      "fetch moderation queue",
    );

    if (error) {
      logger.error("API", "Failed to fetch moderation queue", error);
      return NextResponse.json(
        { error: "Failed to fetch moderation queue" },
        { status: 500 },
      );
    }

    return NextResponse.json({ strategies: data ?? [] }, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    logger.error("API", "Moderate unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}