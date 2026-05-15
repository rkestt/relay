import { createClient } from "@/lib/supabase/server";
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

    // -- Fetch lobby (RLS verifies user is a member or leader) ----------
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("*")
      .eq("id", id)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    // -- Fetch members with profile info ---------------------------------
    const { data: members } = await supabase
      .from("lobby_members")
      .select("id, user_id, joined_at, profiles (id, username, avatar_url)")
      .eq("lobby_id", id);

    // -- Fetch current round (highest round_number where status = 'active')
    const { data: currentRound } = await supabase
      .from("rounds")
      .select("*")
      .eq("lobby_id", id)
      .eq("status", "active")
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    // -- Fetch selections & bans for the current round -------------------
    let selections: unknown[] = [];
    let bans: unknown[] = [];

    if (currentRound) {
      const { data: selectionsData } = await supabase
        .from("lobby_selections")
        .select("*")
        .eq("lobby_id", id)
        .eq("round_id", currentRound.id);

      selections = selectionsData ?? [];

      const { data: bansData } = await supabase
        .from("lobby_bans")
        .select("*, operators (id, name, side, icon_url)")
        .eq("lobby_id", id)
        .eq("round_id", currentRound.id);

      bans = bansData ?? [];
    }

    return NextResponse.json({
      lobby,
      members: members ?? [],
      currentRound: currentRound ?? null,
      selections,
      bans,
    });
  } catch (error) {
    console.error("Lobby state error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
