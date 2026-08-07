import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAdminClient = {
  auth: { admin: { listUsers: vi.fn() } },
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

  beforeEach(() => {
    vi.resetModules();
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = SECRET;
    process.env.LEMON_SQUEEZY_API_KEY = "test-api-key";
    mockAdminClient.auth.admin.listUsers.mockResolvedValue({
      data: {
        users: [
          { id: USER_ID, email: "pro@test.local" },
        ],
      },
      error: null,
    });
    mockAdminClient.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      })),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it("rifiuta richiesta senza firma (401)", async () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const res = await POST(new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      body,
    }));
    expect(res.status).toBe(401);
  });

  it("rifiuta firma errata (401)", async () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const res = await POST(new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      headers: { "X-Signature": "deadbeef" },
      body,
    }));
    expect(res.status).toBe(401);
  });

  it("accetta firma valida e attiva Pro su subscription_created", async () => {
    const payload = {
      meta: { event_name: "subscription_created" },
      data: {
        id: "ls-sub-123",
        attributes: {
          user_email: "PRO@test.local",
          renews_at: "2026-09-01T00:00:00.000Z",
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

    // profiles aggiornato con is_pro=true
    const updateCalls = mockAdminClient.from.mock.results
      .filter((r) => r.value.update)
      .map((r) => r.value.update());
    const profileUpdate = updateCalls[0];
    expect(profileUpdate).toBeDefined();

    // license_key upsertata
    const upsertCalls = mockAdminClient.from.mock.results.filter((r) => r.value.upsert);
    expect(upsertCalls.length).toBeGreaterThan(0);
  });

  it("disattiva Pro su subscription_cancelled", async () => {
    const payload = {
      meta: { event_name: "subscription_cancelled" },
      data: {
        id: "ls-sub-123",
        attributes: { user_email: "pro@test.local", ends_at: "2026-08-10T00:00:00.000Z" },
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
    mockAdminClient.auth.admin.listUsers.mockResolvedValue({
      data: { users: [{ id: USER_ID, email: "pro@test.local" }] },
      error: null,
    });
    const payload = {
      meta: { event_name: "subscription_created" },
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

  it("GET → 405", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
