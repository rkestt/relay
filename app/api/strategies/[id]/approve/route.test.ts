import { vi, describe, it, expect, beforeEach } from "vitest";

const mockUserClient = {
  auth: { getUser: vi.fn() },
};

const queries: Record<string, any> = {};

// Chainable, awaitable query fake. Every method returns the same proxy;
// `await <query>` pops the next queued resolution (mockResolvedValueOnce-like
// semantics). Recorded invocations live on `calls`. Built this way so chains
// of any length/order (x.eq().select(), x.select().eq(), ...) resolve.
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
          const next = fn.queue.length ? fn.queue.shift() : { data: null, error: null };
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

import { POST } from "@/app/api/strategies/[id]/approve/route";
import { isAllowed } from "@/lib/auth/roles";

function post(body: unknown, id = "strat-1") {
  return POST(
    new Request(`http://localhost/api/strategies/${id}/approve`, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

function q(table: string) {
  if (!queries[table]) queries[table] = makeQuery();
  return queries[table];
}

function callsOf(table: string) {
  return queries[table]?.calls ?? [];
}

function findCall(table: string, method: string, indexWithin = 0) {
  return callsOf(table).filter(([m]: any) => m === method)[indexWithin];
}

describe("POST /api/strategies/[id]/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(queries).forEach((k) => delete queries[k]);
    vi.mocked(isAllowed).mockReturnValue(true);
    mockUserClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "mod@example.com" } },
      error: null,
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockUserClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });
    expect((await post({ action: "approve" })).status).toBe(401);
  });

  it("returns 403 when authenticated but not a moderator", async () => {
    vi.mocked(isAllowed).mockReturnValue(false);
    const response = await post({ action: "approve" });
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("Forbidden");
  });

  it("returns 400 on invalid action", async () => {
    expect((await post({ action: "nuke" })).status).toBe(400);
  });

  it("returns 400 on reject without reason", async () => {
    expect((await post({ action: "reject" })).status).toBe(400);
  });

  it("returns 400 on reject with blank reason", async () => {
    expect((await post({ action: "reject", reason: "   " })).status).toBe(400);
  });

  it("returns 200 and approves a pending strategy", async () => {
    q("strategy_templates").push({ data: [{ id: "strat-1" }], error: null });
    q("validation_queue").push({ error: null });

    const response = await post({ action: "approve" });

    expect(response.status).toBe(200);
    const payload = findCall("strategy_templates", "update")?.[1][0];
    expect(payload).toMatchObject({
      status: "approved",
      moderated_by: "user-1",
      rejected_reason: null,
    });
    expect(callsOf("strategy_templates").some(([m, a]: any) => m === "eq" && a[0] === "status" && a[1] === "pending")).toBe(true);
    // token invalidation
    expect(callsOf("validation_queue").some(([m, a]: any) => m === "eq" && a[1] === "strat-1")).toBe(true);
  });

  it("returns 200 and rejects with reason + audit fields", async () => {
    q("strategy_templates").push({ data: [{ id: "strat-1" }], error: null });
    q("validation_queue").push({ error: null });

    const response = await post({ action: "reject", reason: "Contenuto duplicato" });

    expect(response.status).toBe(200);
    const payload = findCall("strategy_templates", "update")?.[1][0];
    expect(payload).toMatchObject({
      status: "rejected",
      rejected_reason: "Contenuto duplicato",
    });
  });

  it("returns 404 when strategy does not exist", async () => {
    // update → 0 rows, exists-check → empty
    q("strategy_templates").push({ data: [], error: null });
    q("strategy_templates").push({ data: [], error: null });

    expect((await post({ action: "approve" })).status).toBe(404);
  });

  it("returns 409 when strategy already decided differently", async () => {
    q("strategy_templates").push({ data: [], error: null }); // update → 0 rows
    q("strategy_templates").push({ data: [{ id: "strat-1", status: "approved" }], error: null }); // exists

    const response = await post({ action: "reject", reason: "tardi" });
    expect(response.status).toBe(409);
  });

  it("returns 200 idempotent when same decision repeated", async () => {
    q("strategy_templates").push({ data: [], error: null }); // update → 0 rows
    q("strategy_templates").push({ data: [{ id: "strat-1", status: "approved" }], error: null }); // exists

    const response = await post({ action: "approve" });
    expect(response.status).toBe(200);
    expect((await response.json()).idempotent).toBe(true);
  });

  it("returns 500 when update fails", async () => {
    q("strategy_templates").push({ data: null, error: { message: "Update failed" } });

    expect((await post({ action: "approve" })).status).toBe(500);
  });
});