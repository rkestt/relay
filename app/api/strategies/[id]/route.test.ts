import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserClient = {
  auth: { getUser: vi.fn() },
};

const mockAdminClient = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockUserClient)),
  createAdminClient: vi.fn(() => mockAdminClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { GET } from "./route";

function mockAdminQuery(strategy: Record<string, unknown> | null, error: unknown = null) {
  mockAdminClient.from.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: strategy, error }),
        })),
      })),
    })),
  });
}

const fullStrategy = {
  id: "s1",
  title: "Clubhouse Plant",
  description: "Execute",
  image_url: "https://x/img.png",
  map_id: "m1",
  site_id: "s1",
  operator_id: "op1",
  created_by: "user-1",
  created_at: "2026-01-01",
  status: "approved",
  maps: { name: "Clubhouse" },
  operators: { name: "Thermite" },
  strategy_tags: [{ id: "t1", strategy_id: "s1", tag: "Plant" }],
  strategy_hotspots: [{ id: "h1", strategy_id: "s1", x_percent: 50, y_percent: 30, label: "Plant", image_id: null }],
  strategy_images: [{ id: "i1", strategy_id: "s1", image_url: "https://x/full.png", sort_order: 0, caption: null, created_at: null }],
};

describe("GET /api/strategies/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockUserClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("404 quando la strategia non esiste", async () => {
    mockAdminQuery(null);
    const res = await GET(new Request("http://localhost/api/strategies/s1"), {
      params: Promise.resolve({ id: "s1" }),
    } as any);
    expect(res.status).toBe(404);
  });

  it("view-only senza auth: base presente, hotspot vuoti", async () => {
    mockAdminQuery(fullStrategy);
    mockUserClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET(new Request("http://localhost/api/strategies/s1"), {
      params: Promise.resolve({ id: "s1" }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.strategy.title).toBe("Clubhouse Plant");
    expect(body.strategy.gated).toBe(true);
    expect(body.hotspots).toEqual([]);
    expect(body.images).toEqual([]);
  });

  it("free autenticato: gated true, niente hotspot", async () => {
    mockAdminQuery(fullStrategy);
    mockUserClient.auth.getUser.mockResolvedValue({ data: { user: { id: "free-1" } }, error: null });
    vi.doMock("@/lib/pro", () => ({
      getProStatus: vi.fn().mockResolvedValue({ isPro: false, proExpiresAt: null }),
    }));
    const mod = await import("./route");
    const res = await mod.GET(new Request("http://localhost/api/strategies/s1"), {
      params: Promise.resolve({ id: "s1" }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.strategy.gated).toBe(true);
    expect(body.hotspots).toEqual([]);
  });

  it("pro: hotspot e immagini complete", async () => {
    mockAdminQuery(fullStrategy);
    mockUserClient.auth.getUser.mockResolvedValue({ data: { user: { id: "pro-1" } }, error: null });
    vi.doMock("@/lib/pro", () => ({
      getProStatus: vi.fn().mockResolvedValue({ isPro: true, proExpiresAt: null }),
    }));
    const mod = await import("./route");
    const res = await mod.GET(new Request("http://localhost/api/strategies/s1"), {
      params: Promise.resolve({ id: "s1" }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.strategy.gated).toBe(false);
    expect(body.hotspots).toHaveLength(1);
    expect(body.images).toHaveLength(1);
  });

  it("?full=1 per free → 403", async () => {
    mockAdminQuery(fullStrategy);
    mockUserClient.auth.getUser.mockResolvedValue({ data: { user: { id: "free-1" } }, error: null });
    vi.doMock("@/lib/pro", () => ({
      getProStatus: vi.fn().mockResolvedValue({ isPro: false, proExpiresAt: null }),
    }));
    const mod = await import("./route");
    const res = await mod.GET(new Request("http://localhost/api/strategies/s1?full=1"), {
      params: Promise.resolve({ id: "s1" }),
    } as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Pro subscription required");
  });
});
