import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// POST  /api/lobby/[id]/assign-tasks
// Assign a strategy to a user for the current round.
// Only the target user or the lobby leader can assign.
// Body: { user_id, operator_id }
// ──────────────────────────────────────────────
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
    logger.info("API", "POST /api/lobby/[id]/assign-tasks start", { lobbyId: id });

    // -- Parse & validate body -------------------------------------------
    let body: { user_id?: unknown; operator_id?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { user_id, operator_id } = body;

    if (
      !user_id ||
      typeof user_id !== "string" ||
      !operator_id ||
      typeof operator_id !== "string"
    ) {
      return NextResponse.json(
        { error: "user_id (string) and operator_id (string) are required" },
        { status: 400 },
      );
    }

    logger.info("API", "POST /api/lobby/[id]/assign-tasks body", { lobbyId: id, targetUserId: user_id, operator_id });

    // -- Verify authorization --------------------------------------------
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("leader_id")
      .eq("id", id)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    const isLeader = lobby.leader_id === user.id;
    const isSelf = user.id === user_id;

    if (!isLeader && !isSelf) {
      return NextResponse.json(
        {
          error:
            "Only the target user or the lobby leader can assign tasks",
        },
        { status: 403 },
      );
    }

    // -- Find current active round ---------------------------------------
    const { data: currentRound } = await supabase
      .from("rounds")
      .select("id")
      .eq("lobby_id", id)
      .eq("status", "active")
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!currentRound) {
      return NextResponse.json(
        { error: "No active round found" },
        { status: 400 },
      );
    }

    // -- Fetch operator tags ---------------------------------------------
    const { data: operatorTags } = await supabase
      .from("operator_tags")
      .select("tag")
      .eq("operator_id", operator_id);

    if (!operatorTags || operatorTags.length === 0) {
      return NextResponse.json(
        { error: "No tags found for the specified operator" },
        { status: 400 },
      );
    }

    const tagValues = operatorTags.map((t) => t.tag);

    // -- Find the team's map/site selection for this round ----------------
    const { data: roundSelections } = await supabase
      .from("lobby_selections")
      .select("map_id, site_id")
      .eq("lobby_id", id)
      .eq("round_id", currentRound.id)
      .not("map_id", "is", null)
      .limit(1);

    let mapId: string | null = null;
    let siteId: string | null = null;

    if (roundSelections && roundSelections.length > 0) {
      mapId = roundSelections[0].map_id;
      siteId = roundSelections[0].site_id;
    }

    // -- Fetch approved strategies matching operator tags ----------------
    let strategiesQuery = supabase
      .from("strategy_templates")
      .select("id, title, description, image_url, created_at")
      .eq("status", "approved");

    if (mapId) {
      strategiesQuery = strategiesQuery.eq("map_id", mapId);
    }
    if (siteId) {
      strategiesQuery = strategiesQuery.eq("site_id", siteId);
    }

    const { data: allStrategies } = await strategiesQuery;

    if (!allStrategies || allStrategies.length === 0) {
      return NextResponse.json(
        {
          error: "No approved strategies found for the current map/site",
        },
        { status: 404 },
      );
    }

    // -- Filter strategies by matching tags ------------------------------
    const strategyIds = allStrategies.map((s) => s.id);

    const { data: strategyTags } = await supabase
      .from("strategy_tags")
      .select("strategy_id, tag")
      .in("strategy_id", strategyIds)
      .in("tag", tagValues);

    if (!strategyTags || strategyTags.length === 0) {
      return NextResponse.json(
        {
          error: "No strategies match the operator's tags",
        },
        { status: 404 },
      );
    }

    const matchingStrategyIds = new Set(strategyTags.map((st) => st.strategy_id));

    const matchingStrategies = allStrategies
      .filter((s) => matchingStrategyIds.has(s.id))
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

    if (matchingStrategies.length === 0) {
      return NextResponse.json(
        { error: "No matching strategies available" },
        { status: 404 },
      );
    }

    // -- Check for already-assigned strategies this round -----------------
    const { data: existingAssignments } = await supabase
      .from("task_assignments")
      .select("strategy_id")
      .eq("lobby_id", id)
      .eq("round_id", currentRound.id);

    const takenStrategyIds = new Set(
      (existingAssignments ?? []).map((a) => a.strategy_id),
    );

    // Find first strategy that isn't already taken
    const availableStrategy = matchingStrategies.find(
      (s) => !takenStrategyIds.has(s.id),
    );

    if (!availableStrategy) {
      return NextResponse.json(
        {
          error: "All matching strategies are already assigned this round",
          fallback: true,
        },
        { status: 409 },
      );
    }

    // -- Assign the strategy ----------------------------------------------
    const { data: assignment, error: assignError } = await supabase
      .from("task_assignments")
      .insert({
        lobby_id: id,
        user_id,
        round_id: currentRound.id,
        strategy_id: availableStrategy.id,
      })
      .select()
      .single();

    if (assignError) {
      // Handle unique constraint violation (race condition)
      if (
        "code" in assignError &&
        (assignError as { code: string }).code === "23505"
      ) {
        return NextResponse.json(
          {
            error: "This strategy was just assigned to someone else",
            fallback: true,
          },
          { status: 409 },
        );
      }

      logger.error("API", "Failed to assign task", assignError);
      return NextResponse.json(
        { error: "Failed to assign task" },
        { status: 500 },
      );
    }

    logger.debug("API", "POST /api/lobby/[id]/assign-tasks success", { lobbyId: id, userId: user_id, strategyId: availableStrategy.id });
    return NextResponse.json({
      assignment: {
        ...assignment,
        strategy: {
          id: availableStrategy.id,
          title: availableStrategy.title,
          description: availableStrategy.description,
          image_url: availableStrategy.image_url,
        },
      },
    });
  } catch (error) {
    logger.error("API", "Assign-tasks POST unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
