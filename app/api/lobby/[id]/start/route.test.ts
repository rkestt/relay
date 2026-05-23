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

import { POST } from "@/app/api/lobby/[id]/start/route";

describe("POST /api/lobby/[id]/start", () => {
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
      new Request("http://localhost/api/lobby/lobby-1/start", { method: "POST" }),
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
      new Request("http://localhost/api/lobby/lobby-1/start", { method: "POST" }),
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
        Promise.resolve({ data: { id: "lobby-1", leader_id: "user-1", phase: "waiting" }, error: null }),
      ),
    };

    mockSupabaseClient.from.mockReturnValue(lobbyQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/start", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Only the leader can start the game");
  });

  it("returns 400 when lobby is not in waiting phase", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({ data: { id: "lobby-1", leader_id: "user-1", phase: "playing" }, error: null }),
      ),
    };

    mockSupabaseClient.from.mockReturnValue(lobbyQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/start", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Lobby is not in waiting phase");
  });

  it("returns 200 and starts game successfully", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({ data: { id: "lobby-1", leader_id: "user-1", phase: "waiting" }, error: null }),
      ),
    };

    const updateQuery = {
      update: vi.fn(() => updateQuery),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    };

    let lobbiesCallCount = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") {
        lobbiesCallCount++;
        if (lobbiesCallCount >= 2) return updateQuery;
        return lobbyQuery;
      }
      return { select: vi.fn(), update: vi.fn(), eq: vi.fn(), single: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/start", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.phase).toBe("playing");
  });
});
