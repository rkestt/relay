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

const mockUserClient = {
  auth: { getUser: vi.fn() },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockUserClient)),
  createAdminClient: vi.fn(() => ({
    from: (table: string) => {
      if (!queries[table]) queries[table] = makeQuery();
      return queries[table];
    },
  })),
}));

vi.mock("@/lib/auth/roles", () => ({
  isAllowed: vi.fn(),
}));

import { GET } from "@/app/api/moderate/route";
import { isAllowed } from "@/lib/auth/roles";

function q(table: string) {
  if (!queries[table]) queries[table] = makeQuery();
  return queries[table];
}

describe("GET /api/moderate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(queries).forEach((k) => delete queries[k]);
    vi.mocked(isAllowed).mockReturnValue(true);
    mockUserClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "u-1", email: "mod@example.com" } },
      error: null,
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockUserClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });
    expect((await GET(new Request("http://localhost/api/moderate"))).status).toBe(401);
  });

  it("returns 403 when authenticated but not a moderator", async () => {
    vi.mocked(isAllowed).mockReturnValue(false);
    expect((await GET(new Request("http://localhost/api/moderate"))).status).toBe(403);
  });

  it("returns pending list and filters by status pending", async () => {
    q("strategy_templates").push({
      data: [
        {
          id: "s1",
          title: "T1",
          status: "pending",
          profiles: [{ email: "author@x.dev" }],
        },
      ],
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/moderate"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.strategies).toHaveLength(1);
    expect(body.strategies[0].id).toBe("s1");
    const statusEq = q("strategy_templates").calls.find(
      (c: any) => c[0] === "eq" && c[1][0] === "status",
    );
    expect(statusEq[1][1]).toBe("pending");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 500 on query error", async () => {
    q("strategy_templates").push({ data: null, error: { message: "boom" } });
    expect((await GET(new Request("http://localhost/api/moderate"))).status).toBe(500);
  });
});