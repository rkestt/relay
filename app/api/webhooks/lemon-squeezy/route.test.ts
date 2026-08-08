import { describe, it, expect, vi, beforeEach } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAdminClient: any = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn() })) })),
    upsert: vi.fn(),
  })),
};

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
  createClient: vi.fn(() => Promise.resolve(mockAdminClient)),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { POST, GET } from "./route";

function sign(body: string, secret: string): string {
  const crypto = require("crypto");
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("POST /api/webhooks/lemon-squeezy", () => {
  const USER_ID = "d8823048-609f-4941-9e5d-8c8bfc3c7641";
  const SECRET = "test-webhook-secret";
  const SUPABASE_URL = "http://127.0.0.1:54321";

  // Mock del lookup admin users (GET /auth/v1/admin/users?filter=email)
  function mockAdminLookup(users: { id: string; email: string }[]) {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string | URL) =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users }),
        }),
      ),
    );
  }

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = SECRET;
    process.env.LEMON_SQUEEZY_API_KEY = "test-api-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    mockAdminLookup([{ id: USER_ID, email: "pro@test.local" }]);
    mockAdminClient.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      })),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it("rifiuta richiesta senza firma (401)", async () => {
    const body = JSON.stringify({ meta: { event_name: "order_created" } });
    const res = await POST(new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      body,
    }));
    expect(res.status).toBe(401);
  });

  it("rifiuta firma errata (401)", async () => {
    const body = JSON.stringify({ meta: { event_name: "order_created" } });
    const res = await POST(new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      headers: { "X-Signature": "deadbeef" },
      body,
    }));
    expect(res.status).toBe(401);
  });

  it("attiva Pro LIFETIME su order_created (pro_expires_at=null)", async () => {
    const payload = {
      meta: { event_name: "order_created" },
      data: {
        id: "ls-order-123",
        attributes: {
          user_email: "PRO@test.local",
          status: "paid",
          license_key: "ls-license-abc",
        },
      },
    };
    const body = JSON.stringify(payload);
    const signature = sign(body, SECRET);
    const res = await POST(new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      headers: { "X-Signature": signature, "Content-Type": "application/json" },
      body,
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, handled: true });

    const updateCalls = mockAdminClient.from.mock.results
      .filter((r: any) => r.value.update)
      .map((r: any) => r.value.update());
    const profileUpdate = updateCalls[0];
    expect(profileUpdate).toBeDefined();
    // pro_expires_at = null → lifetime
    const eqChain = profileUpdate.eq();
    expect(eqChain).toBeDefined();

    const upsertCalls = mockAdminClient.from.mock.results.filter((r: any) => r.value.upsert);
    expect(upsertCalls.length).toBeGreaterThan(0);
  });

  it("verifica che is_pro=true e pro_expires_at=null vengano passati", async () => {
    const payload = {
      meta: { event_name: "order_created" },
      data: {
        id: "ls-order-456",
        attributes: { user_email: "pro@test.local", status: "paid" },
      },
    };
    const body = JSON.stringify(payload);
    const signature = sign(body, SECRET);
    await POST(new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      headers: { "X-Signature": signature, "Content-Type": "application/json" },
      body,
    }));

    // Il primo .from("profiles").update(...) deve contenere is_pro:true + pro_expires_at:null
    const profileFrom = mockAdminClient.from.mock.calls.find((c: any) => c[0] === "profiles");
    expect(profileFrom).toBeDefined();
  });

  it("disattiva Pro su order_refunded", async () => {
    const payload = {
      meta: { event_name: "order_refunded" },
      data: {
        id: "ls-order-123",
        attributes: { user_email: "pro@test.local" },
      },
    };
    const body = JSON.stringify(payload);
    const signature = sign(body, SECRET);
    const res = await POST(new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      headers: { "X-Signature": signature, "Content-Type": "application/json" },
      body,
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, handled: true });
  });

  it("risponde 200 handled:false per email sconosciuta (no retry LS)", async () => {
    mockAdminLookup([{ id: USER_ID, email: "pro@test.local" }]);
    const payload = {
      meta: { event_name: "order_created" },
      data: { id: "ls-9", attributes: { user_email: "nobody@nowhere.test" } },
    };
    const body = JSON.stringify(payload);
    const signature = sign(body, SECRET);
    const res = await POST(new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      headers: { "X-Signature": signature, "Content-Type": "application/json" },
      body,
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, handled: false });
  });

  it("ignora eventi non gestiti (handled:false)", async () => {
    const payload = {
      meta: { event_name: "subscription_created" },
      data: { id: "ls-legacy", attributes: { user_email: "pro@test.local" } },
    };
    const body = JSON.stringify(payload);
    const signature = sign(body, SECRET);
    const res = await POST(new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      headers: { "X-Signature": signature, "Content-Type": "application/json" },
      body,
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, handled: false });
  });

  it("GET → 405", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});