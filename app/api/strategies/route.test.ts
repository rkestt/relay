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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
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
  function makeQuery(finalResolver: () => Promise<any>) {
    const q: Record<string, any> = {
      select: vi.fn(() => q),
      eq: vi.fn(() => q),
      contains: vi.fn(() => q),
      or: vi.fn(() => q),
      order: vi.fn(() => q),
      range: vi.fn(() => finalResolver()),
    };
    return q;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns strategies successfully", async () => {
    const strategiesQuery = makeQuery(() =>
      Promise.resolve({ data: [{ id: "s1", title: "Test", status: "approved" }], error: null, count: 1 }),
    );

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
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.pageSize).toBe(20);
    expect(body.pagination.totalPages).toBe(1);
  });

  it("filters by map_id, site_id, operator_id, tag, q", async () => {
    const usedFilters: string[] = [];
    const strategiesQuery = makeQuery(() =>
      Promise.resolve({ data: [], error: null, count: 0 }),
    );
    strategiesQuery.eq.mockImplementation((field: string) => {
      usedFilters.push(`eq:${field}`);
      return strategiesQuery;
    });
    strategiesQuery.or.mockImplementation((expr: string) => {
      usedFilters.push(`or:${expr}`);
      return strategiesQuery;
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "strategy_templates") return strategiesQuery;
      return { select: vi.fn(), eq: vi.fn(), order: vi.fn() };
    });

    await GET(
      new Request(
        "http://localhost/api/strategies?map_id=map-1&site_id=site-1&operator_id=op-1&tag=fast&q=ash&page=2&page_size=10",
      ),
    );

    expect(usedFilters).toContain("eq:map_id");
    expect(usedFilters).toContain("eq:site_id");
    expect(usedFilters).toContain("eq:operator_id");
    expect(usedFilters.some((f) => f.startsWith("or:"))).toBe(true);
  });

  it("respects page_size max cap at 100", async () => {
    const strategiesQuery = makeQuery(() =>
      Promise.resolve({ data: [], error: null, count: 0 }),
    );

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "strategy_templates") return strategiesQuery;
      return { select: vi.fn(), eq: vi.fn(), order: vi.fn() };
    });

    const response = await GET(
      new Request("http://localhost/api/strategies?page_size=500"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.pagination.pageSize).toBe(100);
  });

  it("returns empty array when no strategies", async () => {
    const strategiesQuery = makeQuery(() =>
      Promise.resolve({ data: null, error: null, count: 0 }),
    );

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
    expect(body.error).toBe("Dati non validi");
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
    expect(body.error).toBe("Dati non validi");
  });

  it("returns 400 when image_url is missing", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/strategies", {
        method: "POST",
        body: JSON.stringify({ title: "Test Strategy", map_id: "map-1", site_id: "site-1", operator_id: "op-1" }),
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

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === "strategy_templates") return adminStrategyInsert;
      if (table === "strategy_tags") return adminTagsInsert;
      if (table === "strategy_hotspots") return adminHotspotsInsert;
      if (table === "strategy_images") return adminImagesInsert;
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
