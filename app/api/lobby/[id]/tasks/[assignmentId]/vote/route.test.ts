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

import { POST } from "@/app/api/lobby/[id]/tasks/[assignmentId]/vote/route";

describe("POST /api/lobby/[id]/tasks/[assignmentId]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const params = { params: Promise.resolve({ id: "lobby-1", assignmentId: "assign-1" }) };

  it("returns 401 when not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/tasks/assign-1/vote", {
        method: "POST",
        body: JSON.stringify({ vote_type: "up" }),
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
      new Request("http://localhost/api/lobby/lobby-1/tasks/assign-1/vote", {
        method: "POST",
        body: "not-json",
      }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 when vote_type is invalid", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/tasks/assign-1/vote", {
        method: "POST",
        body: JSON.stringify({ vote_type: "invalid" }),
      }),
      params,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Dati non validi");
  });

  it("returns 403 when user is not a lobby member", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const membershipQuery = {
      select: vi.fn(() => membershipQuery),
      eq: vi.fn(() => membershipQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    mockSupabaseClient.from.mockReturnValue(membershipQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/tasks/assign-1/vote", {
        method: "POST",
        body: JSON.stringify({ vote_type: "up" }),
      }),
      params,
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("You are not a member of this lobby");
  });

  it("returns 404 when task assignment not found", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const membershipQuery = {
      select: vi.fn(() => membershipQuery),
      eq: vi.fn(() => membershipQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "m1" }, error: null })),
    };

    const assignmentQuery = {
      select: vi.fn(() => assignmentQuery),
      eq: vi.fn(() => assignmentQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobby_members") return membershipQuery;
      if (table === "task_assignments") return assignmentQuery;
      return { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/tasks/assign-1/vote", {
        method: "POST",
        body: JSON.stringify({ vote_type: "up" }),
      }),
      params,
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Task assignment not found in this lobby");
  });

  it("returns 200 and votes up successfully", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const membershipQuery = {
      select: vi.fn(() => membershipQuery),
      eq: vi.fn(() => membershipQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "m1" }, error: null })),
    };

    const assignmentQuery = {
      select: vi.fn(() => assignmentQuery),
      eq: vi.fn(() => assignmentQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "assign-1" }, error: null })),
    };

    const voteUpsert = {
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    };

    const upCountQuery = {
      select: vi.fn(() => upCountQuery),
      eq: vi.fn(() => upCountQuery),
    };

    const downCountQuery = {
      select: vi.fn(() => downCountQuery),
      eq: vi.fn(() => downCountQuery),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobby_members") return membershipQuery;
      if (table === "task_assignments") return assignmentQuery;
      if (table === "task_votes") {
        // Third call (upvotes count) and fourth call (downvotes count)
        return voteUpsert;
      }
      return { select: vi.fn(), eq: vi.fn(), upsert: vi.fn(), maybeSingle: vi.fn() };
    });

    // Handle vote upsert + counts
    const voteTableMock = {
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      select: vi.fn(() => voteTableMock),
      eq: vi.fn(() => voteTableMock),
    };
    let upsertCalled = false;

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobby_members") return membershipQuery;
      if (table === "task_assignments") return assignmentQuery;
      if (table === "task_votes") {
        if (!upsertCalled) {
          upsertCalled = true;
          return voteTableMock; // upsert
        }
        // For count queries, differentiate by eq value (need double-eq chain for .eq("task_assignment_id",...).eq("vote_type",...))
        return {
          select: vi.fn((_cols: unknown, _opts?: unknown) => ({
            eq: vi.fn(() => ({
              eq: vi.fn((field: string, value: string) => {
                if (value === "up") return Promise.resolve({ count: 3, error: null, data: null });
                if (value === "down") return Promise.resolve({ count: 1, error: null, data: null });
                return Promise.resolve({ count: 0, error: null, data: null });
              }),
            })),
          })),
          eq: vi.fn(),
          upsert: vi.fn(),
        };
      }
      return { select: vi.fn(), eq: vi.fn(), upsert: vi.fn(), maybeSingle: vi.fn(), delete: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/tasks/assign-1/vote", {
        method: "POST",
        body: JSON.stringify({ vote_type: "up" }),
      }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.upvotes).toBe(3);
    expect(body.downvotes).toBe(1);
    expect(body.user_vote).toBe("up");
  });

  it("returns 200 and removes vote when vote_type is null", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const membershipQuery = {
      select: vi.fn(() => membershipQuery),
      eq: vi.fn(() => membershipQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "m1" }, error: null })),
    };

    const assignmentQuery = {
      select: vi.fn(() => assignmentQuery),
      eq: vi.fn(() => assignmentQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "assign-1" }, error: null })),
    };

    const voteDelete = {
      delete: vi.fn(() => voteDelete),
      eq: vi.fn(() => voteDelete),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "lobby_members") return membershipQuery;
      if (table === "task_assignments") return assignmentQuery;
      if (table === "task_votes") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
          select: vi.fn((_cols: unknown, _opts?: unknown) => ({
            eq: vi.fn(() => ({
              eq: vi.fn((_field: string, value: string) => {
                if (value === "up") return Promise.resolve({ count: 2, error: null, data: null });
                return Promise.resolve({ count: 0, error: null, data: null });
              }),
            })),
          })),
          upsert: vi.fn(),
        };
      }
      return { select: vi.fn(), eq: vi.fn(), upsert: vi.fn(), maybeSingle: vi.fn(), delete: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/tasks/assign-1/vote", {
        method: "POST",
        body: JSON.stringify({ vote_type: null }),
      }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user_vote).toBeNull();
  });
});
