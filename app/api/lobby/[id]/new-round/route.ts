import { createClient } from "@/lib/supabase/server";
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
        { error: "Only the lobby leader can start a new round" },
        { status: 403 },
      );
    }

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
        { error: "No active round found" },
        { status: 400 },
      );
    }

    // -- Mark current round as completed ----------------------------------
    const { error: updateError } = await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("id", currentRound.id);

    if (updateError) {
      console.error("Failed to complete current round:", updateError);
      return NextResponse.json(
        { error: "Failed to complete current round" },
        { status: 500 },
      );
    }

    // -- Create new round -------------------------------------------------
    const newRoundNumber = currentRound.round_number + 1;

    const { data: newRound, error: insertError } = await supabase
      .from("rounds")
      .insert({
        lobby_id: id,
        round_number: newRoundNumber,
        status: "active",
      })
      .select("id, round_number")
      .single();

    if (insertError || !newRound) {
      // Rollback: restore previous round to active
      await supabase
        .from("rounds")
        .update({ status: "active" })
        .eq("id", currentRound.id);

      console.error("Failed to create new round:", insertError);
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
        console.error("Failed to copy bans to new round:", copyError);
      }
    }

    return NextResponse.json({
      round: { id: newRound.id, round_number: newRound.round_number },
    });
  } catch (error) {
    console.error("New-round POST unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
