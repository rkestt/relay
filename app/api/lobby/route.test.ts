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

import { POST } from "@/app/api/lobby/route";

describe("POST /api/lobby", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const response = await POST(
      new Request("http://localhost/api/lobby", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 500 when profile creation fails", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    // Profile lookup returns nothing
    const profileQuery = {
      select: vi.fn(() => profileQuery),
      eq: vi.fn(() => profileQuery),
      single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
    };

    // Profile insert fails
    const profileInsertQuery = {
      insert: vi.fn(() => profileInsertQuery),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "profiles" && profileQuery.select.mock.calls.length > 0) return profileQuery;
      if (table === "profiles") return profileInsertQuery;
      if (table === "lobbies") return lobbyQuery;
      if (table === "lobby_members") return membersQuery;
      if (table === "rounds") return roundsQuery;
      return profileQuery;
    });

    // Fail the second call to profiles (insert)
    const insertProfileQuery = {
      insert: vi.fn(() => ({
        ...profileInsertQuery,
      })),
    };
    // Override: profile select returns null, profile insert fails
    mockSupabaseClient.from.mockReset();
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        // First call = select, second call = insert
        if (!profileInsertQuery.insert.mock.calls.length) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
              })),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({ single: vi.fn() })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
            })),
          })),
          insert: vi.fn(() =>
            Promise.resolve({ error: { message: "Insert failed" } })
          ),
        };
      }
      if (table === "lobbies") return lobbyQuery;
      if (table === "lobby_members") return membersQuery;
      if (table === "rounds") return roundsQuery;
      return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(), maybeSingle: vi.fn() })) })),
        insert: vi.fn(),
      };
    });

    const lobbyQuery = {
      insert: vi.fn(() => lobbyQuery),
      select: vi.fn(() => lobbyQuery),
      single: vi.fn(),
    };
    const membersQuery = { insert: vi.fn(() => Promise.resolve({ error: null })) };
    const roundsQuery = { insert: vi.fn(() => Promise.resolve({ error: null })) };

    // Actually reset and set up cleanly
    vi.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    // Single profile mock that handles both select (for lookup) and insert (for creation)
    const profileMock = {
      select: vi.fn(() => profileMock),
      eq: vi.fn(() => profileMock),
      single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
      insert: vi.fn(() => Promise.resolve({ error: { message: "Insert failed" } })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileMock;
      return { select: vi.fn(), insert: vi.fn(), eq: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby", { method: "POST" }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to initialize user profile");
  });

  it("returns 500 when all retries exhausted", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    // Profile select succeeds
    const profileSelect = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "user-1" }, error: null })),
        })),
      })),
    };

    // Lobby insert always returns 23505 (unique violation)
    const lobbyInsert = {
      insert: vi.fn(() => lobbyInsert),
      select: vi.fn(() => lobbyInsert),
      single: vi.fn(() => Promise.resolve({ data: null, error: { code: "23505", message: "duplicate" } })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileSelect;
      return lobbyInsert;
    });

    const response = await POST(
      new Request("http://localhost/api/lobby", { method: "POST" }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to create lobby. Please try again.");
  });

  it("returns 201 and creates lobby successfully", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const profileQuery = {
      select: vi.fn(() => profileQuery),
      eq: vi.fn(() => profileQuery),
      single: vi.fn(() => Promise.resolve({ data: { id: "user-1" }, error: null })),
    };

    const lobbyInsert = {
      insert: vi.fn(() => lobbyInsert),
      select: vi.fn(() => lobbyInsert),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "lobby-1", room_code: "ABC123", leader_id: "user-1", starting_side: "attacker", phase: "waiting" },
          error: null,
        }),
      ),
    };

    const membersInsert = {
      insert: vi.fn(() => Promise.resolve({ error: null })),
    };

    const roundsInsert = {
      insert: vi.fn(() => Promise.resolve({ error: null })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileQuery;
      if (table === "lobbies") return lobbyInsert;
      if (table === "lobby_members") return membersInsert;
      if (table === "rounds") return roundsInsert;
      return { select: vi.fn(), insert: vi.fn(), eq: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby", {
        method: "POST",
        body: JSON.stringify({ starting_side: "attacker" }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.lobby).toBeDefined();
    expect(body.lobby.room_code).toBe("ABC123");
  });

  it("accepts starting_side: defender", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const profileQuery = {
      select: vi.fn(() => profileQuery),
      eq: vi.fn(() => profileQuery),
      single: vi.fn(() => Promise.resolve({ data: { id: "user-1" }, error: null })),
    };

    let insertedSide = "";
    const lobbyInsert = {
      insert: vi.fn((data: Record<string, unknown>) => {
        insertedSide = data.starting_side as string;
        return lobbyInsert;
      }),
      select: vi.fn(() => lobbyInsert),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: "lobby-1", room_code: "ABC123", leader_id: "user-1", starting_side: "defender", phase: "waiting" },
          error: null,
        }),
      ),
    };

    const membersInsert = { insert: vi.fn(() => Promise.resolve({ error: null })) };
    const roundsInsert = { insert: vi.fn(() => Promise.resolve({ error: null })) };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileQuery;
      if (table === "lobbies") return lobbyInsert;
      if (table === "lobby_members") return membersInsert;
      if (table === "rounds") return roundsInsert;
      return { select: vi.fn(), insert: vi.fn(), eq: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby", {
        method: "POST",
        body: JSON.stringify({ starting_side: "defender" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(insertedSide).toBe("defender");
  });
});
