import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// POST /api/strategies/[id]/approve — internal approval
// ──────────────────────────────────────────────
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // -- Authenticate ---------------------------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // -- Update strategy status to approved -----------------------------
    const { error: updateError } = await supabase
      .from("strategy_templates")
      .update({ status: "approved" })
      .eq("id", id);

    if (updateError) {
      logger.error("API", "Failed to approve strategy:", updateError);
      return NextResponse.json(
        { error: "Failed to approve strategy" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("API", "Strategy approve unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
