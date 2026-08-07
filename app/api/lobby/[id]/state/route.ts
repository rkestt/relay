import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { getMatchScore } from "@/lib/lobby-utils";
import { NextResponse } from "next/server";

export async function GET(
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
    logger.info("API", "GET /api/lobby/[id]/state start", { lobbyId: id });

    // -- Fetch lobby (RLS verifies user is a member or leader) ----------
    const { data: lobby, error: lobbyError } = await withTimeout(
      supabase
        .from("lobbies")
        .select("*")
        .eq("id", id)
        .single(),
      10000,
      "fetch lobby"
    );

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    // -- Fetch members with profile info ---------------------------------
    const { data: members } = await withTimeout(
      supabase
        .from("lobby_members")
        .select("id, user_id, joined_at, profiles (id, username, avatar_url, is_pro, is_verified_contributor)")
        .eq("lobby_id", id),
      10000,
      "fetch lobby members"
    );

    // -- Fetch current round (highest round_number where status = 'active')
    const { data: currentRound } = await withTimeout(
      supabase
        .from("rounds")
        .select("*")
        .eq("lobby_id", id)
        .eq("status", "active")
        .order("round_number", { ascending: false })
        .limit(1)
        .maybeSingle(),
      10000,
      "fetch current round"
    );

    // -- Fetch all completed rounds for score -----------------------------
    const { data: completedRounds } = await withTimeout(
      supabase
        .from("rounds")
        .select("id, round_number, status, team_side, winner_side")
        .eq("lobby_id", id)
        .eq("status", "completed")
        .order("round_number", { ascending: true }),
      10000,
      "fetch completed rounds"
    );

    const score = getMatchScore(completedRounds ?? []);

    // -- Fetch selections & bans for the current round -------------------
    let selections: unknown[] = [];
    let bans: unknown[] = [];

    if (currentRound) {
      const { data: selectionsData } = await withTimeout(
        supabase
          .from("lobby_selections")
          .select("*")
          .eq("lobby_id", id)
          .eq("round_id", currentRound.id),
        10000,
        "fetch selections"
      );

      selections = selectionsData ?? [];

      const { data: bansData } = await withTimeout(
        supabase
          .from("lobby_bans")
          .select("*, operators (id, name, side, icon_url)")
          .eq("lobby_id", id)
          .eq("round_id", currentRound.id),
        10000,
        "fetch bans"
      );

      bans = bansData ?? [];
    }

    logger.debug("API", "GET /api/lobby/[id]/state response", {
      lobbyId: id,
      memberCount: members?.length ?? 0,
      hasCurrentRound: !!currentRound,
      selectionCount: selections.length,
      banCount: bans.length,
    });
    return NextResponse.json({
      lobby,
      members: members ?? [],
      currentRound: currentRound ?? null,
      selections,
      bans,
      score,
      completedRounds,
    });
  } catch (error) {
    logger.error("API", "Lobby state error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
