import { vi, describe, it, expect, beforeEach } from "vitest";

const mockSupabaseClient = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

import { POST } from "@/app/api/strategies/[id]/approve/route";

describe("POST /api/strategies/[id]/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const params = { params: Promise.resolve({ id: "strat-1" }) };

  it("returns 401 when not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const response = await POST(
      new Request("http://localhost/api/strategies/strat-1/approve", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 and approves strategy successfully", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const updateQuery = {
      update: vi.fn(() => updateQuery),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    };

    mockSupabaseClient.from.mockReturnValue(updateQuery);

    const response = await POST(
      new Request("http://localhost/api/strategies/strat-1/approve", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 when update fails", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const updateQuery = {
      update: vi.fn(() => updateQuery),
      eq: vi.fn(() => Promise.resolve({ error: { message: "Update failed" } })),
    };

    mockSupabaseClient.from.mockReturnValue(updateQuery);

    const response = await POST(
      new Request("http://localhost/api/strategies/strat-1/approve", { method: "POST" }),
      params,
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to approve strategy");
  });
});
