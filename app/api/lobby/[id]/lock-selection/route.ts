import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { lockSelectionSchema, validateRequest } from "@/lib/validations";

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
    logger.info("API", "POST /api/lobby/[id]/lock-selection start", { lobbyId: id });

    // -- Parse & validate body -------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const validation = validateRequest(lockSelectionSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    let { map_id, site_id, operator_id } = validation.data;

    // If map_id not provided, fall back to the lobby's map_id
    let effectiveMapId = map_id;
    if (!effectiveMapId) {
      const { data: lobby } = await supabase
        .from("lobbies")
        .select("map_id")
        .eq("id", id)
        .maybeSingle();
      if (lobby?.map_id) {
        effectiveMapId = lobby.map_id;
      }
    }

    logger.info("API", "POST /api/lobby/[id]/lock-selection body", { lobbyId: id, map_id, effectiveMapId, site_id, operator_id });

    // At least one field must be provided
    if (!effectiveMapId && !site_id && !operator_id) {
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

    if (effectiveMapId) payload.map_id = effectiveMapId;
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
      logger.error("API", "Failed to upsert selection", upsertError);
      return NextResponse.json(
        { error: "Failed to save selection" },
        { status: 500 },
      );
    }

    logger.debug("API", "POST /api/lobby/[id]/lock-selection success", { lobbyId: id, selection });
    return NextResponse.json({ selection });
  } catch (error) {
    logger.error("API", "Lock-selection POST unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
