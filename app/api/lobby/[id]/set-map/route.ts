import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

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
    logger.info("API", "POST /api/lobby/[id]/set-map start", { lobbyId: id });

    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("id, leader_id, phase")
      .eq("id", id)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.leader_id !== user.id) {
      return NextResponse.json({ error: "Only the lobby leader can set the map" }, { status: 403 });
    }

    if (lobby.phase !== "playing") {
      return NextResponse.json({ error: "Lobby must be in playing phase" }, { status: 400 });
    }

    const body = await request.json();
    const { map_id } = body;

    if (!map_id || typeof map_id !== "string") {
      return NextResponse.json({ error: "map_id is required" }, { status: 400 });
    }

    // Verify the map exists
    const { data: map, error: mapError } = await supabase
      .from("maps")
      .select("id")
      .eq("id", map_id)
      .single();

    if (mapError || !map) {
      return NextResponse.json({ error: "Map not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("lobbies")
      .update({ map_id, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      logger.error("API", "Failed to set map for lobby", updateError);
      return NextResponse.json({ error: "Failed to set map" }, { status: 500 });
    }

    logger.debug("API", "POST /api/lobby/[id]/set-map success", { lobbyId: id, map_id });
    return NextResponse.json({ success: true, map_id });
  } catch (error) {
    logger.error("API", "Lobby set-map unexpected error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
