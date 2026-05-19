import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// GET  /api/lobby/[id]/bans
// Fetch all lobby_bans for the lobby with operator details.
// ──────────────────────────────────────────────
export async function GET(
  _request: Request,
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
    logger.info("API", "GET /api/lobby/[id]/bans start", { lobbyId: id });

    const { data: bans, error } = await supabase
      .from("lobby_bans")
      .select("*, operators (id, name, side, icon_url)")
      .eq("lobby_id", id);

    if (error) {
      logger.error("API", "Failed to fetch bans", error);
      return NextResponse.json(
        { error: "Failed to fetch bans" },
        { status: 500 },
      );
    }

    logger.debug("API", "GET /api/lobby/[id]/bans response", { lobbyId: id, banCount: bans?.length ?? 0 });
    return NextResponse.json({ bans: bans ?? [] });
  } catch (error) {
    logger.error("API", "Bans GET unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ──────────────────────────────────────────────
// POST  /api/lobby/[id]/bans
// Leader-only: ban an operator for the current round.
// Body: { operator_id, side }
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
    logger.info("API", "POST /api/lobby/[id]/bans start", { lobbyId: id });

    // -- Parse & validate body -------------------------------------------
    let body: { operator_id?: unknown; side?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { operator_id, side } = body;
    logger.info("API", "POST /api/lobby/[id]/bans body", { lobbyId: id, operator_id, side });

    if (
      !operator_id ||
      typeof operator_id !== "string" ||
      !side ||
      typeof side !== "string" ||
      !["attacker", "defender"].includes(side)
    ) {
      return NextResponse.json(
        { error: "operator_id (string) and side ('attacker'|'defender') are required" },
        { status: 400 },
      );
    }

    // -- Verify leader ---------------------------------------------------
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("leader_id")
      .eq("id", id)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.leader_id !== user.id) {
      return NextResponse.json(
        { error: "Only the lobby leader can ban operators" },
        { status: 403 },
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
        { error: "No active round found. Start a new round first." },
        { status: 400 },
      );
    }

    // -- Insert ban ------------------------------------------------------
    const { data: ban, error: insertError } = await supabase
      .from("lobby_bans")
      .insert({
        lobby_id: id,
        operator_id,
        side,
        round_id: currentRound.id,
      })
      .select("*, operators (id, name, side, icon_url)")
      .single();

    if (insertError) {
      // Handle unique constraint violation (duplicate ban)
      if (
        "code" in insertError &&
        (insertError as { code: string }).code === "23505"
      ) {
        return NextResponse.json(
          { error: "This operator is already banned for this side and round" },
          { status: 409 },
        );
      }

      logger.error("API", "Failed to insert ban", insertError);
      return NextResponse.json(
        { error: "Failed to create ban" },
        { status: 500 },
      );
    }

    logger.debug("API", "POST /api/lobby/[id]/bans success", { lobbyId: id, operator_id, side, banId: ban.id });
    return NextResponse.json({ ban }, { status: 201 });
  } catch (error) {
    logger.error("API", "Bans POST unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
