import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function POST(
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

    // -- Delete current user from lobby_members --------------------------
    const { error: deleteError, count } = await supabase
      .from("lobby_members")
      .delete()
      .eq("lobby_id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("API", "Failed to leave lobby:", deleteError);
      return NextResponse.json(
        { error: "Failed to leave lobby" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("API", "Lobby leave unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
