import { vi, describe, it, expect, beforeEach } from "vitest";

const mockSupabaseClient = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { POST } from "@/app/api/lobby/[id]/assign-tasks/route";

describe("POST /api/lobby/[id]/assign-tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const params = { params: Promise.resolve({ id: "lobby-1" }) };

  it("returns 401 when not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/assign-tasks", {
        method: "POST",
        body: JSON.stringify({ user_id: "target-1", operator_id: "op-1" }),
      }),
      params,
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid JSON body", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/assign-tasks", {
        method: "POST",
        body: "not-json",
      }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 when user_id or operator_id missing", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/assign-tasks", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Dati non validi");
  });

  it("returns 404 when lobby not found", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
    };

    mockSupabaseClient.from.mockReturnValue(lobbyQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/assign-tasks", {
        method: "POST",
        body: JSON.stringify({ user_id: "target-1", operator_id: "op-1" }),
      }),
      params,
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Lobby not found");
  });

  it("returns 403 when user is neither leader nor the target user", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({ data: { leader_id: "leader-1" }, error: null }),
      ),
    };

    mockSupabaseClient.from.mockReturnValue(lobbyQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/assign-tasks", {
        method: "POST",
        body: JSON.stringify({ user_id: "target-1", operator_id: "op-1" }),
      }),
      params,
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("Only the target user or the lobby leader can assign tasks");
  });

  it("returns 404 when no approved strategies found", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({ data: { leader_id: "user-1" }, error: null }),
      ),
    };

    const roundQuery = {
      select: vi.fn(() => roundQuery),
      eq: vi.fn(() => roundQuery),
      order: vi.fn(() => roundQuery),
      limit: vi.fn(() => roundQuery),
      maybeSingle: vi.fn(() =>
        Promise.resolve({ data: { id: "round-1" }, error: null }),
      ),
    };

    const bansQuery = {
      select: vi.fn(() => bansQuery),
      eq: vi.fn(() => bansQuery),
    };

    const selectionsQuery = {
      select: vi.fn(() => selectionsQuery),
      eq: vi.fn(() => selectionsQuery),
    };

    const strategiesQuery = {
      select: vi.fn(() => strategiesQuery),
      eq: vi.fn(() => strategiesQuery),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "rounds") return roundQuery;
      if (table === "lobby_bans") return bansQuery;
      if (table === "lobby_selections") return selectionsQuery;
      if (table === "strategy_templates") return strategiesQuery;
      return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() };
    });

    bansQuery.select.mockReturnValue(bansQuery);
    bansQuery.eq.mockReturnValue(bansQuery);
    const bansPromise = Promise.resolve({ data: [], error: null });
    Object.assign(bansQuery, {
      then: bansPromise.then.bind(bansPromise),
      catch: bansPromise.catch.bind(bansPromise),
    });

    selectionsQuery.select.mockReturnValue(selectionsQuery);
    selectionsQuery.eq.mockReturnValue(selectionsQuery);

    // strategiesQuery needs eq to chain for .eq("status",...).eq("operator_id",...)
    const strategiesPromise = Promise.resolve({ data: [], error: null });
    strategiesQuery.select.mockReturnValue(strategiesQuery);
    strategiesQuery.eq.mockReturnValue(strategiesQuery);
    Object.assign(strategiesQuery, {
      then: strategiesPromise.then.bind(strategiesPromise),
      catch: strategiesPromise.catch.bind(strategiesPromise),
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/assign-tasks", {
        method: "POST",
        body: JSON.stringify({ user_id: "target-1", operator_id: "op-1" }),
      }),
      params,
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain("No strategies available");
  });

  it("returns 200 and assigns a strategy successfully (self-assign)", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({ data: { leader_id: "leader-1" }, error: null }),
      ),
    };

    const roundQuery = {
      select: vi.fn(() => roundQuery),
      eq: vi.fn(() => roundQuery),
      order: vi.fn(() => roundQuery),
      limit: vi.fn(() => roundQuery),
      maybeSingle: vi.fn(() =>
        Promise.resolve({ data: { id: "round-1" }, error: null }),
      ),
    };

    const bansQuery = {
      select: vi.fn(() => bansQuery),
      eq: vi.fn(() => bansQuery),
    };

    const selectionsQuery = {
      select: vi.fn(() => selectionsQuery),
      eq: vi.fn(() => selectionsQuery),
    };

    const strategiesQuery = {
      select: vi.fn(() => strategiesQuery),
      eq: vi.fn(() => strategiesQuery),
    };

    const existingQuery = {
      select: vi.fn(() => existingQuery),
      eq: vi.fn(() => existingQuery),
    };

    const assignInsert = {
      insert: vi.fn(() => assignInsert),
      select: vi.fn(() => assignInsert),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "assign-1", lobby_id: "lobby-1", user_id: "user-1", round_id: "round-1", strategy_id: "strat-1" },
          error: null,
        }),
      ),
    };

    let taskAssignCallCount = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "rounds") return roundQuery;
      if (table === "lobby_bans") return bansQuery;
      if (table === "lobby_selections") return selectionsQuery;
      if (table === "strategy_templates") return strategiesQuery;
      if (table === "task_assignments") {
        taskAssignCallCount++;
        if (taskAssignCallCount >= 2) return assignInsert;
        return existingQuery;
      }
      return { select: vi.fn(), insert: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() };
    });

    bansQuery.select.mockReturnValue(bansQuery);
    bansQuery.eq.mockReturnValue(bansQuery);
    const bansResult = Promise.resolve({ data: [], error: null });
    Object.assign(bansQuery, {
      then: bansResult.then.bind(bansResult),
      catch: bansResult.catch.bind(bansResult),
    });

    selectionsQuery.select.mockReturnValue(selectionsQuery);
    selectionsQuery.eq.mockReturnValue(selectionsQuery);

    // strategiesQuery needs eq to chain for .eq("status",...).eq("operator_id",...)
    const strategiesResult = Promise.resolve({
      data: [{ id: "strat-1", title: "Test Strategy", description: "A test", image_url: "", created_at: "2025-01-01" }],
      error: null,
    });
    strategiesQuery.select.mockReturnValue(strategiesQuery);
    strategiesQuery.eq.mockReturnValue(strategiesQuery);
    Object.assign(strategiesQuery, {
      then: strategiesResult.then.bind(strategiesResult),
      catch: strategiesResult.catch.bind(strategiesResult),
    });

    // existingQuery also needs eq to chain for .eq("lobby_id",...).eq("round_id",...)
    const existingResult = Promise.resolve({ data: [], error: null });
    existingQuery.select.mockReturnValue(existingQuery);
    existingQuery.eq.mockReturnValue(existingQuery);
    Object.assign(existingQuery, {
      then: existingResult.then.bind(existingResult),
      catch: existingResult.catch.bind(existingResult),
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/assign-tasks", {
        method: "POST",
        body: JSON.stringify({ user_id: "user-1", operator_id: "op-1" }),
      }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.assignment).toBeDefined();
    expect(body.assignment.strategy.title).toBe("Test Strategy");
  });
});
