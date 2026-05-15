import { createClient } from "@/lib/supabase/server";
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

export async function POST() {
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

    // -- Generate room code with retries on unique collision -------------
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const roomCode = generateRoomCode();

      const { data: lobby, error: insertError } = await supabase
        .from("lobbies")
        .insert({ room_code: roomCode, leader_id: user.id })
        .select("id, room_code, leader_id")
        .single();

      if (!insertError && lobby) {
        // -- Insert creator into lobby_members ---------------------------
        const { error: memberError } = await supabase
          .from("lobby_members")
          .insert({ lobby_id: lobby.id, user_id: user.id });

        if (memberError) {
          // Rollback: delete the lobby if adding the member fails
          await supabase.from("lobbies").delete().eq("id", lobby.id);
          console.error("Failed to add creator to lobby_members:", memberError);
          return NextResponse.json(
            { error: "Failed to join lobby" },
            { status: 500 },
          );
        }

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

    console.error("Lobby creation error after retries:", lastError);
    return NextResponse.json(
      { error: "Failed to create lobby. Please try again." },
      { status: 500 },
    );
  } catch (error) {
    console.error("Lobby creation unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
