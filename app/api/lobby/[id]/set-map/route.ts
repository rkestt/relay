import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { setMapSchema, validateRequest } from "@/lib/validations";

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

    const { data: lobby, error: lobbyError } = await withTimeout(
      supabase
        .from("lobbies")
        .select("id, leader_id, phase")
        .eq("id", id)
        .single(),
      10000,
      "verify lobby leader"
    );

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
    const validation = validateRequest(setMapSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { map_id } = validation.data;

    // Verify the map exists
    const { data: map, error: mapError } = await withTimeout(
      supabase
        .from("maps")
        .select("id")
        .eq("id", map_id)
        .single(),
      10000,
      "verify map exists"
    );

    if (mapError || !map) {
      return NextResponse.json({ error: "Map not found" }, { status: 404 });
    }

    const { error: updateError } = await withTimeout(
      supabase
        .from("lobbies")
        .update({ map_id, updated_at: new Date().toISOString() })
        .eq("id", id),
      15000,
      "set lobby map"
    );

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
