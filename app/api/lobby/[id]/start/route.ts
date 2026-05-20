import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

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
    logger.info("API", "POST /api/lobby/[id]/start start", { lobbyId: id });

    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("id, leader_id, phase")
      .eq("id", id)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.leader_id !== user.id) {
      return NextResponse.json({ error: "Only the leader can start the game" }, { status: 403 });
    }

    if (lobby.phase !== 'waiting') {
      return NextResponse.json({ error: "Lobby is not in waiting phase" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("lobbies")
      .update({ phase: 'playing', updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      logger.error("API", "Failed to start lobby", updateError);
      return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
    }

    logger.debug("API", "POST /api/lobby/[id]/start success", { lobbyId: id });
    return NextResponse.json({ success: true, phase: 'playing' });
  } catch (error) {
    logger.error("API", "Lobby start unexpected error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
