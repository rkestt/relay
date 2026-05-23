import { vi, describe, it, expect, beforeEach } from "vitest";

const mockAdminClient = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { GET } from "@/app/api/validate/route";

describe("GET /api/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VALIDATION_HMAC_SECRET = "test-secret";
  });

  it("returns 400 when required params are missing", async () => {
    const response = await GET(
      new Request("http://localhost/api/validate"),
    );

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toContain("Missing required parameters");
  });

  it("returns 400 for invalid action", async () => {
    const response = await GET(
      new Request("http://localhost/api/validate?token=tok&strategyId=s1&action=invalid"),
    );

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toContain("Invalid Action");
  });

  it("returns 500 when HMAC secret is not set", async () => {
    delete process.env.VALIDATION_HMAC_SECRET;

    const response = await GET(
      new Request("http://localhost/api/validate?token=tok&strategyId=s1&action=approve"),
    );

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain("Server Error");
  });

  it("returns 404 when token not found in queue", async () => {
    const queueQuery = {
      select: vi.fn(() => queueQuery),
      eq: vi.fn(() => queueQuery),
      single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
    };

    mockAdminClient.from.mockReturnValue(queueQuery);

    const response = await GET(
      new Request("http://localhost/api/validate?token=tok&strategyId=s1&action=approve"),
    );

    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toContain("Invalid Token");
  });

  it("returns 400 when link already used", async () => {
    const queueQuery = {
      select: vi.fn(() => queueQuery),
      eq: vi.fn(() => queueQuery),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: 1, token_hash: "tok", strategy_id: "s1", action: "approve", used_at: "2025-01-01", expires_at: "2099-01-01" },
          error: null,
        }),
      ),
    };

    mockAdminClient.from.mockReturnValue(queueQuery);

    const response = await GET(
      new Request("http://localhost/api/validate?token=tok&strategyId=s1&action=approve"),
    );

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toContain("Link Used");
  });

  it("returns 400 when link expired", async () => {
    const queueQuery = {
      select: vi.fn(() => queueQuery),
      eq: vi.fn(() => queueQuery),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: 1, token_hash: "tok", strategy_id: "s1", action: "approve", used_at: null, expires_at: "2020-01-01" },
          error: null,
        }),
      ),
    };

    mockAdminClient.from.mockReturnValue(queueQuery);

    const response = await GET(
      new Request("http://localhost/api/validate?token=tok&strategyId=s1&action=approve"),
    );

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toContain("Link Expired");
  });

  it("returns 200 and approves successfully", async () => {
    const queueQuery = {
      select: vi.fn(() => queueQuery),
      eq: vi.fn(() => queueQuery),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: 1, token_hash: "tok", strategy_id: "s1", action: "approve", used_at: null, expires_at: "2099-01-01" },
          error: null,
        }),
      ),
    };

    const strategyUpdate = {
      update: vi.fn(() => strategyUpdate),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    };

    const markUsed = {
      update: vi.fn(() => markUsed),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    };

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === "validation_queue" && queueQuery.single.mock.calls.length > 0) return markUsed;
      if (table === "validation_queue") return queueQuery;
      if (table === "strategy_templates") return strategyUpdate;
      return { select: vi.fn(), update: vi.fn(), eq: vi.fn(), single: vi.fn() };
    });

    const response = await GET(
      new Request("http://localhost/api/validate?token=tok&strategyId=s1&action=approve"),
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("Approved");
  });

  it("returns 200 and rejects successfully", async () => {
    const queueQuery = {
      select: vi.fn(() => queueQuery),
      eq: vi.fn(() => queueQuery),
      single: vi.fn(() =>
        Promise.resolve({
          data: { id: 2, token_hash: "tok2", strategy_id: "s2", action: "reject", used_at: null, expires_at: "2099-01-01" },
          error: null,
        }),
      ),
    };

    const strategyUpdate = {
      update: vi.fn(() => strategyUpdate),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    };

    const markUsed = {
      update: vi.fn(() => markUsed),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    };

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === "validation_queue" && queueQuery.single.mock.calls.length > 0) return markUsed;
      if (table === "validation_queue") return queueQuery;
      if (table === "strategy_templates") return strategyUpdate;
      return { select: vi.fn(), update: vi.fn(), eq: vi.fn(), single: vi.fn() };
    });

    const response = await GET(
      new Request("http://localhost/api/validate?token=tok2&strategyId=s2&action=reject"),
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("Rejected");
  });
});
