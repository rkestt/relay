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

import { GET, POST } from "@/app/api/lobby/[id]/bans/route";

describe("GET /api/lobby/[id]/bans", () => {
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
      new Request("http://localhost/api/lobby/lobby-1/bans"),
      params,
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns bans successfully", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const bansQuery = {
      select: vi.fn(() => bansQuery),
      eq: vi.fn(() => bansQuery),
    };

    mockSupabaseClient.from.mockReturnValue(bansQuery);
    bansQuery.select.mockReturnValue(bansQuery);
    bansQuery.eq.mockReturnValue(
      Promise.resolve({
        data: [
          { id: "b1", operator_id: "op-1", side: "attacker", operators: { id: "op-1", name: "Ash", side: "attacker", icon_url: "" } },
        ],
        error: null,
      }),
    );

    const response = await GET(
      new Request("http://localhost/api/lobby/lobby-1/bans"),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.bans).toHaveLength(1);
    expect(body.bans[0].operators.name).toBe("Ash");
  });

  it("returns empty array when no bans exist", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const bansQuery = {
      select: vi.fn(() => bansQuery),
      eq: vi.fn(() => bansQuery),
    };

    mockSupabaseClient.from.mockReturnValue(bansQuery);
    bansQuery.select.mockReturnValue(bansQuery);
    bansQuery.eq.mockReturnValue(Promise.resolve({ data: null, error: null }));

    const response = await GET(
      new Request("http://localhost/api/lobby/lobby-1/bans"),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.bans).toEqual([]);
  });
});

describe("POST /api/lobby/[id]/bans", () => {
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
      new Request("http://localhost/api/lobby/lobby-1/bans", {
        method: "POST",
        body: JSON.stringify({ operator_id: "op-1", side: "attacker" }),
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
      new Request("http://localhost/api/lobby/lobby-1/bans", {
        method: "POST",
        body: "not-json",
      }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 when operator_id or side missing", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/bans", {
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
      new Request("http://localhost/api/lobby/lobby-1/bans", {
        method: "POST",
        body: JSON.stringify({ operator_id: "op-1", side: "attacker" }),
      }),
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
        Promise.resolve({ data: { leader_id: "user-1" }, error: null }),
      ),
    };

    mockSupabaseClient.from.mockReturnValue(lobbyQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/bans", {
        method: "POST",
        body: JSON.stringify({ operator_id: "op-1", side: "attacker" }),
      }),
      params,
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Only the lobby leader can ban operators");
  });

  it("returns 201 and creates ban successfully", async () => {
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

    const banInsert = {
      insert: vi.fn(() => banInsert),
      select: vi.fn(() => banInsert),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "ban-1", operator_id: "op-1", side: "attacker", round_id: "round-1", operators: { id: "op-1", name: "Ash", side: "attacker", icon_url: "" } },
          error: null,
        }),
      ),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "rounds") return roundQuery;
      if (table === "lobby_bans") return banInsert;
      return { select: vi.fn(), insert: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/bans", {
        method: "POST",
        body: JSON.stringify({ operator_id: "op-1", side: "attacker" }),
      }),
      params,
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.ban).toBeDefined();
    expect(body.ban.operator_id).toBe("op-1");
  });

  it("returns 409 when ban already exists (23505)", async () => {
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

    const banInsert = {
      insert: vi.fn(() => banInsert),
      select: vi.fn(() => banInsert),
      single: vi.fn(() =>
        Promise.resolve({ data: null, error: { code: "23505", message: "duplicate" } }),
      ),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "rounds") return roundQuery;
      if (table === "lobby_bans") return banInsert;
      return { select: vi.fn(), insert: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/bans", {
        method: "POST",
        body: JSON.stringify({ operator_id: "op-1", side: "attacker" }),
      }),
      params,
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("This operator is already banned for this side and round");
  });
});
