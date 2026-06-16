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

    // -- Fetch banned operators for this round ----------------------------
    const { data: bans } = await supabase
      .from("lobby_bans")
      .select("operator_id")
      .eq("lobby_id", id)
      .eq("round_id", currentRound.id);

    const bannedOperatorIds = new Set((bans ?? []).map((b) => b.operator_id));

    // -- Find the team's map/site selection for this round ----------------
    const { data: roundSelections } = await supabase
      .from("lobby_selections")
      .select("map_id, site_id, operator_id")
      .eq("lobby_id", id)
      .eq("round_id", currentRound.id);

    let mapId: string | null = null;
    let siteId: string | null = null;
    const teammateOperatorIds = new Set<string>();

    for (const sel of roundSelections ?? []) {
      if (sel.map_id && !mapId) mapId = sel.map_id;
      if (sel.site_id && !siteId) siteId = sel.site_id;
      if (sel.operator_id) teammateOperatorIds.add(sel.operator_id);
    }

    // -- Fetch approved strategies with progressive fallback -------------
    const baseQuery = () =>
      supabase
        .from("strategy_templates")
        .select("id, title, description, image_url, created_at, operator_id")
        .eq("status", "approved");

    let strategies: Array<{
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      created_at: string;
      operator_id: string;
    }> | null = null;
    let fallbackLevel = 0;

    // Level 1: operator_id + map_id + site_id (perfect match)
    const q1 = baseQuery().eq("operator_id", operator_id);
    if (mapId) q1.eq("map_id", mapId);
    if (siteId) q1.eq("site_id", siteId);
    const { data: d1 } = await q1;
    if (d1 && d1.length > 0) {
      strategies = d1;
      fallbackLevel = 1;
    }

    // Level 2: map_id + site_id only (right map/site, any operator)
    if (!strategies && (mapId || siteId)) {
      const q2 = baseQuery();
      if (mapId) q2.eq("map_id", mapId);
      if (siteId) q2.eq("site_id", siteId);
      const { data: d2 } = await q2;
      if (d2 && d2.length > 0) {
        // Prioritize strategies for operators teammates have chosen
        strategies = d2.sort((a, b) => {
          const aIsTeammate = teammateOperatorIds.has(a.operator_id) ? 0 : 1;
          const bIsTeammate = teammateOperatorIds.has(b.operator_id) ? 0 : 1;
          return aIsTeammate - bIsTeammate;
        });
        fallbackLevel = 2;
      }
    }

    // Level 3: operator_id only (right operator, any map/site)
    if (!strategies && (mapId || siteId)) {
      const { data: d3 } = await baseQuery().eq("operator_id", operator_id);
      if (d3 && d3.length > 0) {
        strategies = d3;
        fallbackLevel = 3;
      }
    }

    if (!strategies || strategies.length === 0) {
      return NextResponse.json(
        { error: "No strategies available" },
        { status: 404 },
      );
    }

    logger.debug("API", "Progressive fallback level", { lobbyId: id, fallbackLevel });

    const matchingStrategies = strategies.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    // Filter out strategies for banned operators
    const filteredStrategies = matchingStrategies.filter(
      (s) => !bannedOperatorIds.has(s.operator_id),
    );

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
    const availableStrategy = filteredStrategies.find(
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
