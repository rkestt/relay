import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// POST  /api/lobby/[id]/lock-selection
// Upsert the current user's selection for the current round.
// When operator_id is provided, locks the selection (sets locked_at).
// Body: { map_id?, site_id?, operator_id? }
// ──────────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // -- Parse & validate body -------------------------------------------
    let body: {
      map_id?: unknown;
      site_id?: unknown;
      operator_id?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { map_id, site_id, operator_id } = body;

    // Validate types if provided
    if (map_id !== undefined && typeof map_id !== "string") {
      return NextResponse.json(
        { error: "map_id must be a string if provided" },
        { status: 400 },
      );
    }
    if (site_id !== undefined && typeof site_id !== "string") {
      return NextResponse.json(
        { error: "site_id must be a string if provided" },
        { status: 400 },
      );
    }
    if (operator_id !== undefined && typeof operator_id !== "string") {
      return NextResponse.json(
        { error: "operator_id must be a string if provided" },
        { status: 400 },
      );
    }

    // At least one field must be provided
    if (!map_id && !site_id && !operator_id) {
      return NextResponse.json(
        {
          error:
            "At least one of map_id, site_id, or operator_id must be provided",
        },
        { status: 400 },
      );
    }

    // -- Find current active round ---------------------------------------
    const { data: currentRound } = await supabase
      .from("rounds")
      .select("id")
      .eq("lobby_id", id)
      .eq("status", "active")
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!currentRound) {
      return NextResponse.json(
        { error: "No active round found" },
        { status: 400 },
      );
    }

    // -- Build upsert payload --------------------------------------------
    const payload: Record<string, unknown> = {
      lobby_id: id,
      user_id: user.id,
      round_id: currentRound.id,
    };

    if (map_id !== undefined) payload.map_id = map_id;
    if (site_id !== undefined) payload.site_id = site_id;
    if (operator_id !== undefined) payload.operator_id = operator_id;
    if (operator_id !== undefined) payload.locked_at = new Date().toISOString();

    // -- Upsert selection ------------------------------------------------
    const { data: selection, error: upsertError } = await supabase
      .from("lobby_selections")
      .upsert(payload, {
        onConflict: "lobby_id, user_id, round_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Failed to upsert selection:", upsertError);
      return NextResponse.json(
        { error: "Failed to save selection" },
        { status: 500 },
      );
    }

    return NextResponse.json({ selection });
  } catch (error) {
    console.error("Lock-selection POST unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
