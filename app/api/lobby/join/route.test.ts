import { vi, describe, it, expect, beforeEach } from "vitest";

// Mutable mock that tests can configure
const mockSupabaseClient = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

import { POST } from "@/app/api/lobby/join/route";

describe("POST /api/lobby/join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/join", {
        method: "POST",
        body: JSON.stringify({ room_code: "ABC123" }),
      }),
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
      new Request("http://localhost/api/lobby/join", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 when room_code is missing", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/join", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("room_code is required");
  });

  it("returns 404 when lobby not found", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const mockQuery = {
      select: vi.fn(() => mockQuery),
      eq: vi.fn(() => mockQuery),
      single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
    };
    mockSupabaseClient.from.mockReturnValue(mockQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/join", {
        method: "POST",
        body: JSON.stringify({ room_code: "ABC123" }),
      }),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Lobby not found");
  });

  it("returns 400 when lobby is not active", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const mockQuery = {
      select: vi.fn(() => mockQuery),
      eq: vi.fn(() => mockQuery),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "lobby-1", room_code: "ABC123", status: "closed" },
          error: null,
        }),
      ),
    };
    mockSupabaseClient.from.mockReturnValue(mockQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/join", {
        method: "POST",
        body: JSON.stringify({ room_code: "ABC123" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Lobby is not active");
  });

  it("joins lobby successfully", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "lobby-1", room_code: "ABC123", status: "active" },
          error: null,
        }),
      ),
    };

    const membersQuery = {
      insert: vi.fn(() => membersQuery),
      select: vi.fn(() => membersQuery),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "lobby_members") return membersQuery;
      return lobbyQuery;
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/join", {
        method: "POST",
        body: JSON.stringify({ room_code: "ABC123" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.lobby).toEqual({ id: "lobby-1", room_code: "ABC123" });
  });

  it("handles already-member gracefully (23505)", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const lobbyQuery = {
      select: vi.fn(() => lobbyQuery),
      eq: vi.fn(() => lobbyQuery),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "lobby-1", room_code: "ABC123", status: "active" },
          error: null,
        }),
      ),
    };

    const membersQuery = {
      insert: vi.fn(() => membersQuery),
      select: vi.fn(() => membersQuery),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobbies") return lobbyQuery;
      if (table === "lobby_members") return membersQuery;
      return lobbyQuery;
    });

    // Simulate unique violation
    const memberError = { code: "23505", message: "duplicate key value violates unique constraint" };
    membersQuery.insert.mockReturnValue({
      ...membersQuery,
      select: vi.fn(() => ({
        ...membersQuery,
        single: vi.fn(() => Promise.resolve({ data: null, error: memberError })),
      })),
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/join", {
        method: "POST",
        body: JSON.stringify({ room_code: "ABC123" }),
      }),
    );

    // Should still succeed because 23505 is handled gracefully
    expect(response.status).toBe(200);
  });
});
