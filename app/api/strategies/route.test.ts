import { vi, describe, it, expect, beforeEach } from "vitest";

const mockSupabaseClient = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

const mockAdminClient = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
  createAdminClient: vi.fn(() => mockAdminClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("crypto", () => ({
  default: {
    createHmac: vi.fn(() => ({
      update: vi.fn(() => ({
        digest: vi.fn(() => "mock-token-hash"),
      })),
    })),
  },
  createHmac: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => "mock-token-hash"),
    })),
  })),
}));

import { GET, POST } from "@/app/api/strategies/route";

describe("GET /api/strategies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns strategies successfully", async () => {
    const strategiesQuery = {
      select: vi.fn(() => strategiesQuery),
      eq: vi.fn(() => strategiesQuery),
      order: vi.fn(() => Promise.resolve({ data: [{ id: "s1", title: "Test", status: "approved" }], error: null })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "strategy_templates") return strategiesQuery;
      return { select: vi.fn(), eq: vi.fn(), order: vi.fn() };
    });

    const response = await GET(
      new Request("http://localhost/api/strategies"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.strategies).toHaveLength(1);
  });

  it("filters by map_id and site_id", async () => {
    let usedFilters: string[] = [];
    const strategiesQuery = {
      select: vi.fn(() => strategiesQuery),
      eq: vi.fn((field: string, _val: unknown) => {
        usedFilters.push(field);
        return strategiesQuery;
      }),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "strategy_templates") return strategiesQuery;
      return { select: vi.fn(), eq: vi.fn(), order: vi.fn() };
    });

    await GET(
      new Request("http://localhost/api/strategies?map_id=map-1&site_id=site-1"),
    );

    expect(usedFilters).toContain("map_id");
    expect(usedFilters).toContain("site_id");
  });

  it("returns empty array when no strategies", async () => {
    const strategiesQuery = {
      select: vi.fn(() => strategiesQuery),
      eq: vi.fn(() => strategiesQuery),
      order: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "strategy_templates") return strategiesQuery;
      return { select: vi.fn(), eq: vi.fn(), order: vi.fn() };
    });

    const response = await GET(
      new Request("http://localhost/api/strategies"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.strategies).toEqual([]);
  });
});

describe("POST /api/strategies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VALIDATION_HMAC_SECRET = "test-secret";
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const response = await POST(
      new Request("http://localhost/api/strategies", {
        method: "POST",
        body: JSON.stringify({}),
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
      new Request("http://localhost/api/strategies", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 when title is missing", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/strategies", {
        method: "POST",
        body: JSON.stringify({ map_id: "map-1", site_id: "site-1", operator_id: "op-1", image_url: "https://example.com/img.png" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("title is required");
  });

  it("returns 400 when map_id is missing", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/strategies", {
        method: "POST",
        body: JSON.stringify({ title: "Test", site_id: "site-1", operator_id: "op-1", image_url: "https://example.com/img.png" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("map_id is required");
  });

  it("returns 400 when image_url is missing", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/strategies", {
        method: "POST",
        body: JSON.stringify({ title: "Test", map_id: "map-1", site_id: "site-1", operator_id: "op-1" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("image_url is required");
  });

  it("returns 201 and creates strategy successfully", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const adminStrategyInsert = {
      insert: vi.fn(() => adminStrategyInsert),
      select: vi.fn(() => adminStrategyInsert),
      single: vi.fn(() =>
        Promise.resolve({ data: { id: "strat-1", status: "pending" }, error: null }),
      ),
    };

    const adminTagsInsert = {
      insert: vi.fn(() => Promise.resolve({ error: null })),
    };

    const adminHotspotsInsert = {
      insert: vi.fn(() => Promise.resolve({ error: null })),
    };

    const adminImagesInsert = {
      insert: vi.fn(() => Promise.resolve({ error: null })),
    };

    const adminQueueInsert = {
      insert: vi.fn(() => Promise.resolve({ error: null })),
    };

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === "strategy_templates") return adminStrategyInsert;
      if (table === "strategy_tags") return adminTagsInsert;
      if (table === "strategy_hotspots") return adminHotspotsInsert;
      if (table === "strategy_images") return adminImagesInsert;
      if (table === "validation_queue") return adminQueueInsert;
      return { insert: vi.fn(), select: vi.fn(), single: vi.fn() };
    });

    const response = await POST(
      new Request("http://localhost/api/strategies", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Strategy",
          map_id: "map-1",
          site_id: "site-1",
          operator_id: "op-1",
          image_url: "https://example.com/img.png",
          description: "A test strategy",
          tags: ["fast", "aggressive"],
          hotspots: [{ x_percent: 50, y_percent: 30, label: "Plant" }],
          images: ["https://example.com/img1.png", "https://example.com/img2.png"],
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.strategy).toBeDefined();
    expect(body.strategy.status).toBe("pending");
  });
});
