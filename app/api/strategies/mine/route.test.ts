import { vi, describe, it, expect, beforeEach } from "vitest";

const queries: Record<string, any> = {};

function makeQuery() {
  const fn = function () {
    return proxy;
  } as any;
  fn.calls = [] as Array<[string, any[]]>;
  fn.queue = [] as any[];
  const proxy = new Proxy(fn, {
    get(_t, prop) {
      if (prop === "then") {
        return (resolve: (v: any) => void, reject: (e: any) => void) => {
          const next = fn.queue.length ? fn.queue.shift() : { data: [], error: null };
          Promise.resolve(next).then(resolve, reject);
        };
      }
      if (prop === "calls" || prop === "queue") return fn[prop];
      if (prop === "push") return (v: any) => {
        fn.queue.push(v);
        return proxy;
      };
      return (...args: any[]) => {
        fn.calls.push([String(prop), args]);
        return proxy;
      };
    },
  }) as any;
  return proxy;
}

const mockClient = {
  auth: { getUser: vi.fn() },
  from: vi.fn((table: string) => {
    if (!queries[table]) queries[table] = makeQuery();
    return queries[table];
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockClient)),
}));

import { GET } from "@/app/api/strategies/mine/route";

function q(table: string) {
  if (!queries[table]) queries[table] = makeQuery();
  return queries[table];
}


describe("GET /api/strategies/mine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(queries).forEach((k) => delete queries[k]);
  });

  it("returns 401 when not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });
    expect((await GET(new Request("http://localhost/api/strategies/mine"))).status).toBe(401);
  });

  it("filters to own user and returns private no-store header", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u-1", email: "a@b.dev" } },
      error: null,
    });
    q("strategy_templates").push({
      data: [{ id: "s1", status: "pending", rejected_reason: null }],
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/strategies/mine"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.strategies).toHaveLength(1);
    expect(body.strategies[0].id).toBe("s1");
    // filter scoped to own user
    const eqs = queries.strategy_templates.calls.filter(
      (c: any) => c[0] === "eq" && c[1][0] === "created_by",
    );
    expect(eqs[0][1][1]).toBe("u-1");
    // private no-store
    expect(response.headers.get("Cache-Control")).toContain("private");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 500 on query error", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u-1", email: "a@b.dev" } },
      error: null,
    });
    q("strategy_templates").push({ data: null, error: { message: "boom" } });

    expect((await GET(new Request("http://localhost/api/strategies/mine"))).status).toBe(500);
  });
});