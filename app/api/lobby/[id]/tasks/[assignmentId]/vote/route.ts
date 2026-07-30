import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { voteSchema, validateRequest } from "@/lib/validations";

// ──────────────────────────────────────────────
// POST  /api/lobby/[id]/tasks/[assignmentId]/vote
// Cast, change, or remove a vote on a task assignment.
// Body: { vote_type: "up" | "down" | null }
// ──────────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> },
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

    const { id: lobbyId, assignmentId } = await params;
    logger.info("API", "POST /api/lobby/[id]/tasks/[assignmentId]/vote start", {
      lobbyId,
      assignmentId,
      userId: user.id,
    });

    // -- Parse & validate body -------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const validation = validateRequest(voteSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { vote_type } = validation.data;

    // -- Verify lobby membership -----------------------------------------
    const { data: membership } = await withTimeout(
      supabase
        .from("lobby_members")
        .select("id")
        .eq("lobby_id", lobbyId)
        .eq("user_id", user.id)
        .maybeSingle(),
      10000,
      "verify lobby membership"
    );

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this lobby" },
        { status: 403 },
      );
    }

    // -- Verify task assignment exists and user is not voting on own ------
    const { data: assignment, error: assignmentError } = await withTimeout(
      supabase
        .from("task_assignments")
        .select("id, user_id")
        .eq("id", assignmentId)
        .eq("lobby_id", lobbyId)
        .maybeSingle(),
      10000,
      "verify task assignment"
    );

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Task assignment not found in this lobby" },
        { status: 404 },
      );
    }

    // -- Upsert or delete vote --------------------------------------------
    if (vote_type === "up" || vote_type === "down") {
      const { error: upsertError } = await withTimeout(
        supabase
          .from("task_votes")
          .upsert(
            {
              task_assignment_id: assignmentId,
              user_id: user.id,
              vote_type,
            },
            {
              onConflict: "task_assignment_id, user_id",
              ignoreDuplicates: false,
            },
          ),
        15000,
        "upsert vote"
      );

      if (upsertError) {
        logger.error("API", "Failed to upsert vote", upsertError);
        return NextResponse.json(
          { error: "Failed to save vote" },
          { status: 500 },
        );
      }

      logger.debug("API", "Vote upserted", {
        lobbyId,
        assignmentId,
        userId: user.id,
        vote_type,
      });
    } else {
      // vote_type === null → remove vote
      const { error: deleteError } = await withTimeout(
        supabase
          .from("task_votes")
          .delete()
          .eq("task_assignment_id", assignmentId)
          .eq("user_id", user.id),
        15000,
        "delete vote"
      );

      if (deleteError) {
        logger.error("API", "Failed to delete vote", deleteError);
        return NextResponse.json(
          { error: "Failed to remove vote" },
          { status: 500 },
        );
      }

      logger.debug("API", "Vote removed", {
        lobbyId,
        assignmentId,
        userId: user.id,
      });
    }

    // -- Recalculate vote counts ------------------------------------------
    const { count: upCount, error: upError } = await withTimeout(
      supabase
        .from("task_votes")
        .select("id", { count: "exact", head: true })
        .eq("task_assignment_id", assignmentId)
        .eq("vote_type", "up"),
      10000,
      "count upvotes"
    );

    const { count: downCount, error: downError } = await withTimeout(
      supabase
        .from("task_votes")
        .select("id", { count: "exact", head: true })
        .eq("task_assignment_id", assignmentId)
        .eq("vote_type", "down"),
      10000,
      "count downvotes"
    );

    if (upError || downError) {
      logger.error("API", "Failed to count votes", { upError, downError });
      return NextResponse.json(
        { error: "Failed to tally votes" },
        { status: 500 },
      );
    }

    const upvotes = upCount ?? 0;
    const downvotes = downCount ?? 0;

    logger.info(
      "API",
      "POST /api/lobby/[id]/tasks/[assignmentId]/vote success",
      { lobbyId, assignmentId, upvotes, downvotes, user_vote: vote_type },
    );

    return NextResponse.json({
      success: true,
      upvotes,
      downvotes,
      user_vote: vote_type,
    });
  } catch (error) {
    logger.error(
      "API",
      "Vote POST unexpected error",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
