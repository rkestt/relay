import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// GET  /api/lobby/[id]/strategies/available
// Return strategies compatible with the current round,
// ranked by relevance (matching team operators DESC,
// then usage_count DESC).
// ──────────────────────────────────────────────
export async function GET(
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

    const { id: lobbyId } = await params;
    logger.info("API", "GET /api/lobby/[id]/strategies/available start", { lobbyId });

    // -- Fetch lobby (RLS verifies user is a member or leader) ----------
    const { data: lobby, error: lobbyError } = await withTimeout(
      supabase
        .from("lobbies")
        .select("id, map_id")
        .eq("id", lobbyId)
        .single(),
      10000,
      "fetch lobby",
    );
    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    // -- Fetch current active round --------------------------------------
    const { data: currentRound } = await withTimeout(
      supabase
        .from("rounds")
        .select("id, team_side")
        .eq("lobby_id", lobbyId)
        .eq("status", "active")
        .order("round_number", { ascending: false })
        .limit(1)
        .maybeSingle(),
      10000,
      "fetch current round",
    );

    if (!currentRound) {
      return NextResponse.json(
        { error: "No active round" },
        { status: 400 },
      );
    }

    const teamSide = currentRound.team_side;
    if (!teamSide) {
      return NextResponse.json(
        { error: "Round has no team side set" },
        { status: 400 },
      );
    }

    // -- Fetch selections & bans for the current round ------------------
    const { data: selections } = await withTimeout(
      supabase
        .from("lobby_selections")
        .select("user_id, map_id, site_id, operator_id")
        .eq("lobby_id", lobbyId)
        .eq("round_id", currentRound.id),
      10000,
      "fetch selections",
    );

    const { data: bans } = await withTimeout(
      supabase
        .from("lobby_bans")
        .select("operator_id")
        .eq("lobby_id", lobbyId)
        .eq("round_id", currentRound.id),
      10000,
      "fetch bans",
    );

    // -- Extract context ------------------------------------------------
    // map_id: lobby.map_id, then fallback to first selection
    const mapId =
      lobby.map_id ??
      (selections ?? []).find((s) => s.map_id)?.map_id ??
      null;

    // site_id: first selection that has one
    const siteId =
      (selections ?? []).find((s) => s.site_id)?.site_id ?? null;

    // Nothing to recommend until map + site are chosen
    if (!mapId || !siteId) {
      logger.debug("API", "No map/site selected yet, returning empty");
      return NextResponse.json(
        { strategies: [] },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=10, stale-while-revalidate=60",
          },
        },
      );
    }

    const teamOperatorIds = new Set(
      (selections ?? [])
        .map((s) => s.operator_id)
        .filter((id): id is string => id !== null),
    );

    const bannedOperatorIds = new Set(
      (bans ?? []).map((b) => b.operator_id),
    );

    // -- Fetch approved strategies matching map + site + side -----------
    const { data: strategies, error: strategiesError } = await withTimeout(
      supabase
        .from("strategy_templates")
        .select(
          "id, title, description, image_url, map_id, site_id, side, usage_count, created_at",
        )
        .eq("status", "approved")
        .eq("map_id", mapId)
        .eq("site_id", siteId)
        .eq("side", teamSide)
        .order("usage_count", { ascending: false }),
      10000,
      "fetch strategies",
    );

    if (strategiesError) {
      logger.error("API", "Failed to fetch strategies", strategiesError);
      return NextResponse.json(
        { error: "Failed to fetch strategies" },
        { status: 500 },
      );
    }

    if (!strategies || strategies.length === 0) {
      return NextResponse.json(
        { strategies: [] },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=30, stale-while-revalidate=120",
          },
        },
      );
    }

    // -- Exclude strategies already assigned this round ------------------
    const { data: existingAssignments } = await withTimeout(
      supabase
        .from("task_assignments")
        .select("strategy_id")
        .eq("lobby_id", lobbyId)
        .eq("round_id", currentRound.id),
      10000,
      "fetch existing assignments",
    );

    const assignedStrategyIds = new Set(
      (existingAssignments ?? []).map((a) => a.strategy_id),
    );

    const candidateStrategies = strategies.filter(
      (s) => !assignedStrategyIds.has(s.id),
    );

    if (candidateStrategies.length === 0) {
      return NextResponse.json(
        { strategies: [] },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=30, stale-while-revalidate=120",
          },
        },
      );
    }

    // -- Batch-fetch strategy_operators for all candidates ---------------
    const candidateIds = candidateStrategies.map((s) => s.id);

    const { data: allOperators } = await withTimeout(
      supabase
        .from("strategy_operators")
        .select("strategy_id, operator_id")
        .in("strategy_id", candidateIds),
      10000,
      "fetch strategy operators",
    );

    // Build map: strategy_id → operator_id[]
    const strategyOpMap = new Map<string, string[]>();
    for (const row of allOperators ?? []) {
      const list = strategyOpMap.get(row.strategy_id) ?? [];
      list.push(row.operator_id);
      strategyOpMap.set(row.strategy_id, list);
    }

    // -- Score & rank ----------------------------------------------------
    // 1. Filter out strategies that involve banned operators
    // 2. Count how many required operators match the team's picks
    // 3. Sort by matching_count DESC, then usage_count DESC
    const scored = candidateStrategies
      .filter((s) => {
        const ops = strategyOpMap.get(s.id) ?? [];
        return !ops.some((opId) => bannedOperatorIds.has(opId));
      })
      .map((s) => {
        const ops = strategyOpMap.get(s.id) ?? [];
        const matchingCount = ops.filter((opId) =>
          teamOperatorIds.has(opId),
        ).length;
        return {
          id: s.id,
          title: s.title,
          description: s.description,
          image_url: s.image_url,
          map_id: s.map_id,
          site_id: s.site_id,
          side: s.side,
          usage_count: s.usage_count,
          created_at: s.created_at,
          matching_count: matchingCount,
          operator_count: ops.length,
        };
      })
      .sort((a, b) => {
        if (b.matching_count !== a.matching_count)
          return b.matching_count - a.matching_count;
        return b.usage_count - a.usage_count;
      });

    logger.debug("API", "GET /api/lobby/[id]/strategies/available response", {
      lobbyId,
      roundId: currentRound.id,
      totalStrategies: strategies.length,
      afterBansAndAssigned: candidateStrategies.length,
      returned: scored.length,
    });

    return NextResponse.json(
      { strategies: scored },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    logger.error("API", "Available strategies error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
