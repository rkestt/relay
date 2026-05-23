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

vi.mock("@/lib/lobby-utils", () => ({
  getTeamSide: vi.fn(() => "attacker"),
}));

import { POST } from "@/app/api/lobby/[id]/new-round/route";

describe("POST /api/lobby/[id]/new-round", () => {
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
      new Request("http://localhost/api/lobby/lobby-1/new-round", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
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
      new Request("http://localhost/api/lobby/lobby-1/new-round", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Lobby not found");
  });

  it("returns 403 when user is not the leader", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-2" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({ data: { leader_id: "user-1", starting_side: "attacker" }, error: null }),
      ),
    };

    mockSupabaseClient.from.mockReturnValue(lobbyQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/new-round", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Only the lobby leader can start a new round");
  });

  it("returns 200 and creates new round successfully (with previous round)", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({ data: { leader_id: "user-1", starting_side: "attacker" }, error: null }),
      ),
    };

    const roundQuery = {
      select: vi.fn(() => roundQuery),
      eq: vi.fn(() => roundQuery),
      order: vi.fn(() => roundQuery),
      limit: vi.fn(() => roundQuery),
      maybeSingle: vi.fn(() =>
        Promise.resolve({ data: { id: "round-1", round_number: 1 }, error: null }),
      ),
    };

    const roundUpdate = {
      update: vi.fn(() => roundUpdate),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    };

    const roundInsert = {
      insert: vi.fn(() => roundInsert),
      select: vi.fn(() => roundInsert),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "round-2", round_number: 2, team_side: "defender" },
          error: null,
        }),
      ),
    };

    const bansQuery = {
      select: vi.fn(() => bansQuery),
      eq: vi.fn(() => bansQuery),
    };

    let roundsCallCount = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "rounds") {
        roundsCallCount++;
        if (roundsCallCount === 1) return roundQuery;
        if (roundsCallCount === 2) return roundUpdate;
        return roundInsert;
      }
      if (table === "lobby_bans") return bansQuery;
      return { select: vi.fn(), insert: vi.fn(), eq: vi.fn(), update: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() };
    });

    bansQuery.select.mockReturnValue(bansQuery);
    bansQuery.eq.mockImplementation(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    }));

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/new-round", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.round).toBeDefined();
    expect(body.round.round_number).toBe(2);
  });

  it("returns 200 and creates round 1 when no active round exists", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({ data: { leader_id: "user-1", starting_side: "attacker" }, error: null }),
      ),
    };

    const roundQuery = {
      select: vi.fn(() => roundQuery),
      eq: vi.fn(() => roundQuery),
      order: vi.fn(() => roundQuery),
      limit: vi.fn(() => roundQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    const roundInsert = {
      insert: vi.fn(() => roundInsert),
      select: vi.fn(() => roundInsert),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "round-1", round_number: 1, team_side: "attacker" },
          error: null,
        }),
      ),
    };

    const bansQuery = {
      select: vi.fn(() => bansQuery),
      eq: vi.fn(() => bansQuery),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "rounds") {
        // First call is select (maybeSingle), second is insert
        if (roundQuery.maybeSingle.mock.calls.length === 0) return roundQuery;
        return roundInsert;
      }
      if (table === "lobby_bans") return bansQuery;
      return { select: vi.fn(), insert: vi.fn(), eq: vi.fn() };
    });

    bansQuery.select.mockReturnValue(bansQuery);
    bansQuery.eq.mockReturnValue(Promise.resolve({ data: null, error: null }));

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/new-round", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.round.round_number).toBe(1);
  });
});
