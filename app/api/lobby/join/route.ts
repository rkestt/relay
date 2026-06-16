import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { joinLobbySchema, validateRequest } from "@/lib/validations";

export async function POST(request: Request) {
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

    // -- Parse & validate body ------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const validation = validateRequest(joinLobbySchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { room_code: normalizedCode } = validation.data;
    logger.info("API", "POST /api/lobby/join start", { room_code: normalizedCode });

    // -- Look up lobby by room_code -------------------------------------
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("id, room_code, status")
      .eq("room_code", normalizedCode)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.status !== "active") {
      return NextResponse.json(
        { error: "Lobby is not active" },
        { status: 400 },
      );
    }

    // -- Insert into lobby_members (handle already-member gracefully) ----
    const { error: memberError } = await supabase
      .from("lobby_members")
      .insert({ lobby_id: lobby.id, user_id: user.id });

    if (memberError) {
      // Unique violation (code 23505) means the user is already a member — that's fine
      if (
        !("code" in memberError) ||
        (memberError as { code: string }).code !== "23505"
      ) {
        logger.error("API", "Failed to join lobby", memberError);
        return NextResponse.json(
          { error: "Failed to join lobby" },
          { status: 500 },
        );
      }
    }

    logger.debug("API", "POST /api/lobby/join success", { lobbyId: lobby.id, roomCode: lobby.room_code });
    return NextResponse.json({
      lobby: { id: lobby.id, room_code: lobby.room_code },
    });
  } catch (error) {
    logger.error("API", "Lobby join unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
