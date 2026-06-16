import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  getTeamSide,
  getMatchScore,
  getMatchStatus,
  canCreateNextRound,
} from "@/lib/lobby-utils";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// POST  /api/lobby/[id]/new-round
// Leader-only: complete the current round and start a new one.
// Copies bans from the previous round to the new round.
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
    logger.info("API", "POST /api/lobby/[id]/new-round start", { lobbyId: id });

    // -- Parse winner_side from body ---------------------------------------
    let body: { winner_side?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const winnerSide = body.winner_side;
    if (winnerSide !== "attacker" && winnerSide !== "defender") {
      return NextResponse.json(
        { error: "winner_side is required and must be 'attacker' or 'defender'" },
        { status: 400 },
      );
    }

    // -- Verify leader & fetch starting_side ----------------------------
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("leader_id, starting_side")
      .eq("id", id)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.leader_id !== user.id) {
      return NextResponse.json(
        { error: "Only the lobby leader can start a new round" },
        { status: 403 },
      );
    }

    const startingSide = (lobby.starting_side as "attacker" | "defender") ?? "attacker";

    // -- Find current active round ---------------------------------------
    const { data: currentRound } = await supabase
      .from("rounds")
      .select("id, round_number")
      .eq("lobby_id", id)
      .eq("status", "active")
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!currentRound) {
      return NextResponse.json(
        { error: "No active round to complete" },
        { status: 400 },
      );
    }

    // -- Mark current round as completed with winner_side ------------------
    const { error: updateError } = await supabase
      .from("rounds")
      .update({ status: "completed", winner_side: winnerSide })
      .eq("id", currentRound.id);

    if (updateError) {
      logger.error("API", "Failed to complete current round", updateError);
      return NextResponse.json(
        { error: "Failed to complete current round" },
        { status: 500 },
      );
    }

    // -- Fetch all completed rounds for score calculation -----------------
    const { data: completedRounds } = await supabase
      .from("rounds")
      .select("winner_side")
      .eq("lobby_id", id)
      .eq("status", "completed");

    const score = getMatchScore(completedRounds ?? []);
    const matchStatus = getMatchStatus(score, currentRound.round_number);

    // -- Check if match is over -------------------------------------------
    if (matchStatus.isOver) {
      await supabase.from("lobbies").update({ phase: "closed" }).eq("id", id);
      logger.info("API", "Match over", {
        lobbyId: id,
        winner: matchStatus.winner,
        score,
      });
      return NextResponse.json({
        matchOver: true,
        score,
        winner: matchStatus.winner,
      });
    }

    // -- Check if next round is allowed -----------------------------------
    if (!canCreateNextRound(score, currentRound.round_number)) {
      return NextResponse.json({ error: "Match is complete" }, { status: 409 });
    }

    // -- Create next round -------------------------------------------------
    const newRoundNumber = currentRound.round_number + 1;

    const { data: newRound, error: insertError } = await supabase
      .from("rounds")
      .insert({
        lobby_id: id,
        round_number: newRoundNumber,
        status: "active",
        team_side: getTeamSide(startingSide, newRoundNumber),
      })
      .select("id, round_number, team_side")
      .single();

    if (insertError || !newRound) {
      // Rollback: restore previous round to active
      await supabase
        .from("rounds")
        .update({ status: "active", winner_side: null })
        .eq("id", currentRound.id);

      logger.error("API", "Failed to create new round", insertError);
      return NextResponse.json(
        { error: "Failed to create new round" },
        { status: 500 },
      );
    }

    // -- Copy bans from previous round to new round -----------------------
    const { data: previousBans } = await supabase
      .from("lobby_bans")
      .select("operator_id, side")
      .eq("lobby_id", id)
      .eq("round_id", currentRound.id);

    if (previousBans && previousBans.length > 0) {
      const newBanRows = previousBans.map((ban) => ({
        lobby_id: id,
        operator_id: ban.operator_id,
        side: ban.side,
        round_id: newRound.id,
      }));

      const { error: copyError } = await supabase
        .from("lobby_bans")
        .insert(newBanRows);

      if (copyError) {
        // Non-fatal: log but don't fail the request
        logger.error("API", "Failed to copy bans to new round", copyError);
      }
    }

    logger.debug("API", "POST /api/lobby/[id]/new-round success", {
      lobbyId: id,
      roundId: newRound.id,
      roundNumber: newRound.round_number,
    });
    return NextResponse.json({
      round: { id: newRound.id, round_number: newRound.round_number },
      score,
    });
  } catch (error) {
    logger.error("API", "New-round POST unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
