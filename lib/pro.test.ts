import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAdminClient = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

import { isProUser, getProStatus } from "./pro";

function mockProfileRow(row: { is_pro?: boolean; pro_expires_at?: string | null } | null) {
  mockAdminClient.from.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue(
          row === null
            ? { data: null, error: null }
            : { data: row, error: null },
        ),
      })),
    })),
  });
}

describe("lib/pro", () => {
  beforeEach(() => vi.clearAllMocks());

  it("utente senza profilo → non pro", async () => {
    mockProfileRow(null);
    expect(await isProUser("u1")).toBe(false);
  });

  it("is_pro true senza scadenza → pro", async () => {
    mockProfileRow({ is_pro: true, pro_expires_at: null });
    expect(await isProUser("u1")).toBe(true);
  });

  it("is_pro true con scadenza futura → pro", async () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    mockProfileRow({ is_pro: true, pro_expires_at: future });
    expect(await isProUser("u1")).toBe(true);
  });

  it("is_pro true con scadenza passata → NON pro", async () => {
    const past = new Date(Date.now() - 86400_000).toISOString();
    mockProfileRow({ is_pro: true, pro_expires_at: past });
    expect(await isProUser("u1")).toBe(false);
  });

  it("is_pro false → non pro", async () => {
    mockProfileRow({ is_pro: false, pro_expires_at: null });
    expect(await isProUser("u1")).toBe(false);
  });

  it("getProStatus espone proExpiresAt", async () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    mockProfileRow({ is_pro: true, pro_expires_at: future });
    const status = await getProStatus("u1");
    expect(status.isPro).toBe(true);
    expect(status.proExpiresAt).toBe(future);
  });
});
