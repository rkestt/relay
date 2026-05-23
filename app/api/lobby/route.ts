import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getTeamSide } from "@/lib/lobby-utils";
import { NextResponse } from "next/server";

// 30-character alphabet excluding 0, O, 1, I, l
const ALPHABET = "ABCDEFGHJKLMNPQRSTVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_RETRIES = 5;

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    code += ALPHABET[idx];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    logger.info("API", "POST /api/lobby start");

    // -- Authenticate ---------------------------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -- Ensure profile exists (FK constraint on lobbies.leader_id) -----
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      logger.warn("API", "Profile missing for authenticated user, auto-creating", { userId: user.id });
      const { error: createProfileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: user.user_metadata?.username ?? `guest-${user.id.slice(0, 8)}`,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        });

      if (createProfileError) {
        logger.error("API", "Failed to auto-create profile", createProfileError, { userId: user.id });
        return NextResponse.json({ error: "Failed to initialize user profile" }, { status: 500 });
      }
    }

    // -- Parse body for starting_side -----------------------------------
    let body: { starting_side?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // body is optional; default will be attacker
    }
    const startingSide = body.starting_side === "defender" ? "defender" : "attacker";

    // -- Generate room code with retries on unique collision -------------
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const roomCode = generateRoomCode();

      const { data: lobby, error: insertError } = await supabase
        .from("lobbies")
        .insert({ room_code: roomCode, leader_id: user.id, starting_side: startingSide, phase: 'waiting' })
        .select("id, room_code, leader_id, starting_side, phase")
        .single();

      if (insertError) {
        logger.warn("API", `Lobby insert attempt ${attempt + 1}/${MAX_RETRIES} failed`, {
          code: (insertError as { code?: string }).code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
      }

      if (!insertError && lobby) {
        // -- Insert creator into lobby_members ---------------------------
        const { error: memberError } = await supabase
          .from("lobby_members")
          .insert({ lobby_id: lobby.id, user_id: user.id });

        if (memberError) {
          // Rollback: delete the lobby if adding the member fails
          await supabase.from("lobbies").delete().eq("id", lobby.id);
          logger.error("API", "Failed to add creator to lobby_members", memberError);
          return NextResponse.json(
            { error: "Failed to join lobby" },
            { status: 500 },
          );
        }

        // -- Create initial round (round 1) ------------------------------
        const { error: roundError } = await supabase
          .from("rounds")
          .insert({
            lobby_id: lobby.id,
            round_number: 1,
            status: "active",
            team_side: getTeamSide(startingSide, 1),
          });

        if (roundError) {
          // Rollback: delete lobby and member if round creation fails
          await supabase.from("lobby_members").delete().eq("lobby_id", lobby.id);
          await supabase.from("lobbies").delete().eq("id", lobby.id);
          logger.error("API", "Failed to create initial round", roundError);
          return NextResponse.json(
            { error: "Failed to initialize lobby" },
            { status: 500 },
          );
        }

        logger.debug("API", "POST /api/lobby success", { lobbyId: lobby.id, roomCode: lobby.room_code, startingSide });
        return NextResponse.json({ lobby }, { status: 201 });
      }

      lastError = insertError;

      // Stop retrying if it's not a unique-constraint violation
      if (
        insertError &&
        "code" in insertError &&
        (insertError as { code: string }).code !== "23505"
      ) {
        break;
      }
    }

    logger.error("API", "Lobby creation error after retries", lastError, {
      code: (lastError as { code?: string })?.code,
      message: (lastError as { message?: string })?.message,
    });
    return NextResponse.json(
      { error: "Failed to create lobby. Please try again." },
      { status: 500 },
    );
  } catch (error) {
    logger.error("API", "Lobby creation unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
