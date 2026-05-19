import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// POST  /api/lobby/[id]/new-round
// Leader-only: complete the current round and start a new one.
// Copies bans from the previous round to the new round.
// ──────────────────────────────────────────────
export async function POST(
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
    logger.info("API", "POST /api/lobby/[id]/new-round start", { lobbyId: id });

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
    const getTeamSide = (roundNumber: number): "attacker" | "defender" => {
      // R6S ranked: sides alternate every round
      return roundNumber % 2 === 1 ? startingSide : (startingSide === "attacker" ? "defender" : "attacker");
    };

    // -- Find current active round ---------------------------------------
    const { data: currentRound } = await supabase
      .from("rounds")
      .select("id, round_number")
      .eq("lobby_id", id)
      .eq("status", "active")
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    let newRoundNumber: number;

    if (currentRound) {
      // -- Mark current round as completed --------------------------------
      const { error: updateError } = await supabase
        .from("rounds")
        .update({ status: "completed" })
        .eq("id", currentRound.id);

      if (updateError) {
        logger.error("API", "Failed to complete current round", updateError);
        return NextResponse.json(
          { error: "Failed to complete current round" },
          { status: 500 },
        );
      }

      newRoundNumber = currentRound.round_number + 1;
    } else {
      // No active round — create the first one
      newRoundNumber = 1;
    }

    // -- Create new round -------------------------------------------------

    const { data: newRound, error: insertError } = await supabase
      .from("rounds")
      .insert({
        lobby_id: id,
        round_number: newRoundNumber,
        status: "active",
        team_side: getTeamSide(newRoundNumber),
      })
      .select("id, round_number, team_side")
      .single();

    if (insertError || !newRound) {
      // Rollback: restore previous round to active (only if there was one)
      if (currentRound) {
        await supabase
          .from("rounds")
          .update({ status: "active" })
          .eq("id", currentRound.id);
      }

      logger.error("API", "Failed to create new round", insertError);
      return NextResponse.json(
        { error: "Failed to create new round" },
        { status: 500 },
      );
    }

    // -- Copy bans from previous round to new round -----------------------
    if (currentRound) {
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
    }

    logger.debug("API", "POST /api/lobby/[id]/new-round success", {
      lobbyId: id,
      roundId: newRound.id,
      roundNumber: newRound.round_number,
    });
    return NextResponse.json({
      round: { id: newRound.id, round_number: newRound.round_number },
    });
  } catch (error) {
    logger.error("API", "New-round POST unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
