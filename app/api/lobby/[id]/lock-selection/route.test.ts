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

import { POST } from "@/app/api/lobby/[id]/lock-selection/route";

describe("POST /api/lobby/[id]/lock-selection", () => {
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
      new Request("http://localhost/api/lobby/lobby-1/lock-selection", {
        method: "POST",
        body: JSON.stringify({ operator_id: "op-1" }),
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
      new Request("http://localhost/api/lobby/lobby-1/lock-selection", {
        method: "POST",
        body: "not-json",
      }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 when no fields provided and no lobby map_id", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    mockSupabaseClient.from.mockReturnValue(lobbyQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/lock-selection", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("At least one of map_id, site_id, or operator_id must be provided");
  });

  it("returns 400 when map_id is not a string", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/lock-selection", {
        method: "POST",
        body: JSON.stringify({ map_id: 123 }),
      }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("map_id must be a string if provided");
  });

  it("returns 400 when no active round found", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { map_id: "map-1" }, error: null })),
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
      if (table === "rounds") return roundQuery;
      return { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/lock-selection", {
        method: "POST",
        body: JSON.stringify({ operator_id: "op-1" }),
      }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("No active round found");
  });

  it("returns 200 and upserts selection successfully with operator_id", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { map_id: "map-1" }, error: null })),
    };

    const roundQuery = {
      select: vi.fn(() => roundQuery),
      eq: vi.fn(() => roundQuery),
      order: vi.fn(() => roundQuery),
      limit: vi.fn(() => roundQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "round-1" }, error: null })),
    };

    const selectionUpsert = {
      upsert: vi.fn(() => selectionUpsert),
      select: vi.fn(() => selectionUpsert),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "sel-1", lobby_id: "lobby-1", user_id: "user-1", round_id: "round-1", map_id: "map-1", operator_id: "op-1", locked_at: "2025-01-01T00:00:00.000Z" },
          error: null,
        }),
      ),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "rounds") return roundQuery;
      if (table === "lobby_selections") return selectionUpsert;
      return { select: vi.fn(), eq: vi.fn(), upsert: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/lock-selection", {
        method: "POST",
        body: JSON.stringify({ operator_id: "op-1" }),
      }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.selection).toBeDefined();
    expect(body.selection.operator_id).toBe("op-1");
    expect(body.selection.locked_at).toBeDefined();
  });

  it("returns 200 with map_id and site_id only", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    const roundQuery = {
      select: vi.fn(() => roundQuery),
      eq: vi.fn(() => roundQuery),
      order: vi.fn(() => roundQuery),
      limit: vi.fn(() => roundQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "round-1" }, error: null })),
    };

    const selectionUpsert = {
      upsert: vi.fn(() => selectionUpsert),
      select: vi.fn(() => selectionUpsert),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "sel-2", lobby_id: "lobby-1", user_id: "user-1", round_id: "round-1", map_id: "map-1", site_id: "site-1" },
          error: null,
        }),
      ),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "rounds") return roundQuery;
      if (table === "lobby_selections") return selectionUpsert;
      return { select: vi.fn(), eq: vi.fn(), upsert: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/lock-selection", {
        method: "POST",
        body: JSON.stringify({ map_id: "map-1", site_id: "site-1" }),
      }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.selection.map_id).toBe("map-1");
    expect(body.selection.site_id).toBe("site-1");
    expect(body.selection.locked_at).toBeUndefined();
  });
});
