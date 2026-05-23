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

import { GET } from "@/app/api/lobby/[id]/state/route";

describe("GET /api/lobby/[id]/state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const params = { params: Promise.resolve({ id: "lobby-1" }) };

  it("returns 401 when not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const response = await GET(
      new Request("http://localhost/api/lobby/lobby-1/state"),
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

    const response = await GET(
      new Request("http://localhost/api/lobby/lobby-1/state"),
      params,
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Lobby not found");
  });

  it("returns lobby state successfully", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "lobby-1", room_code: "ABC123", phase: "playing", leader_id: "user-1" },
          error: null,
        }),
      ),
    };

    const membersQuery = {
      select: vi.fn(() => membersQuery),
      eq: vi.fn(() => membersQuery),
    };

    const roundQuery = {
      select: vi.fn(() => roundQuery),
      eq: vi.fn(() => roundQuery),
      order: vi.fn(() => roundQuery),
      limit: vi.fn(() => roundQuery),
      maybeSingle: vi.fn(() =>
        Promise.resolve({ data: { id: "round-1", round_number: 1, status: "active" }, error: null }),
      ),
    };

    const selectionsQuery = {
      select: vi.fn(() => selectionsQuery),
      eq: vi.fn(() => selectionsQuery),
    };

    const bansQuery = {
      select: vi.fn(() => bansQuery),
      eq: vi.fn(() => bansQuery),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "lobby_members") return membersQuery;
      if (table === "rounds") return roundQuery;
      if (table === "lobby_selections") return selectionsQuery;
      if (table === "lobby_bans") return bansQuery;
      return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(), order: vi.fn(), limit: vi.fn() };
    });

    membersQuery.select.mockReturnValue(membersQuery);
    membersQuery.eq.mockReturnValue(Promise.resolve({ data: [{ id: "m1", user_id: "user-1", joined_at: "2025-01-01", profiles: { id: "user-1", username: "Player1", avatar_url: null } }], error: null }));

    selectionsQuery.select.mockReturnValue(selectionsQuery);
    selectionsQuery.eq.mockImplementation(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [{ id: "sel-1", map_id: "map-1", operator_id: "op-1" }], error: null })),
    }));

    bansQuery.select.mockReturnValue(bansQuery);
    bansQuery.eq.mockImplementation(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [{ id: "ban-1", operator_id: "op-2", operators: { id: "op-2", name: "Twitch", side: "attacker", icon_url: "" } }], error: null })),
    }));

    const response = await GET(
      new Request("http://localhost/api/lobby/lobby-1/state"),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.lobby).toBeDefined();
    expect(body.members).toHaveLength(1);
    expect(body.currentRound).toBeDefined();
    expect(body.selections).toHaveLength(1);
    expect(body.bans).toHaveLength(1);
  });

  it("returns empty arrays when no round exists", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({ data: { id: "lobby-1", room_code: "ABC123", phase: "waiting", leader_id: "user-1" }, error: null }),
      ),
    };

    const membersQuery = {
      select: vi.fn(() => membersQuery),
      eq: vi.fn(() => membersQuery),
    };

    const roundQuery = {
      select: vi.fn(() => roundQuery),
      eq: vi.fn(() => roundQuery),
      order: vi.fn(() => roundQuery),
      limit: vi.fn(() => roundQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "lobby_members") return membersQuery;
      if (table === "rounds") return roundQuery;
      return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(), order: vi.fn(), limit: vi.fn() };
    });

    membersQuery.select.mockReturnValue(membersQuery);
    membersQuery.eq.mockReturnValue(Promise.resolve({ data: [], error: null }));

    const response = await GET(
      new Request("http://localhost/api/lobby/lobby-1/state"),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.currentRound).toBeNull();
    expect(body.selections).toEqual([]);
    expect(body.bans).toEqual([]);
  });
});
