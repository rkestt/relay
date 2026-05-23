import { vi, describe, it, expect, beforeEach } from "vitest";

const mockSupabaseClient = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

import { POST } from "@/app/api/lobby/[id]/leave/route";

describe("POST /api/lobby/[id]/leave", () => {
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
      new Request("http://localhost/api/lobby/lobby-1/leave", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 and leaves lobby successfully", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const deleteQuery = {
      delete: vi.fn(() => deleteQuery),
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null, count: 1 })),
      })),
    };

    mockSupabaseClient.from.mockReturnValue(deleteQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/leave", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 when delete fails", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const deleteQuery = {
      delete: vi.fn(() => deleteQuery),
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: { message: "Delete failed" }, count: 0 })),
      })),
    };

    mockSupabaseClient.from.mockReturnValue(deleteQuery);

    const response = await POST(
      new Request("http://localhost/api/lobby/lobby-1/leave", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to leave lobby");
  });
});
