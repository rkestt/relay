import { describe, it, expect } from "vitest";
import { getClientIp, shouldCountAuthRequest } from "./rate-limit";

function req(headers: Record<string, string>): Parameters<typeof getClientIp>[0] {
  return { headers: new Headers(headers) } as Parameters<typeof getClientIp>[0];
}

describe("getClientIp", () => {
  it("prende il primo IP della lista x-forwarded-for", () => {
    expect(
      getClientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })),
    ).toBe("203.0.113.7");
  });

  it("scarta entry non-IP nella lista", () => {
    expect(
      getClientIp(req({ "x-forwarded-for": "unknown, 203.0.113.7" })),
    ).toBe("203.0.113.7");
  });

  it("fallback su x-real-ip", () => {
    expect(getClientIp(req({ "x-real-ip": "198.51.100.3" }))).toBe(
      "198.51.100.3",
    );
  });

  it("fallback su request.ip (IPv6)", () => {
    expect(
      getClientIp({
        headers: new Headers(),
        ip: "2001:db8::1",
      } as unknown as Parameters<typeof getClientIp>[0]),
    ).toBe("2001:db8::1");
  });

  it("unknown quando non c'è nulla", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });
});

describe("shouldCountAuthRequest", () => {
  it("GET di /login e /signup non contano (pagine statiche prefetchate)", () => {
    expect(shouldCountAuthRequest("/login", "GET")).toBe(false);
    expect(shouldCountAuthRequest("/signup", "GET")).toBe(false);
    expect(shouldCountAuthRequest("/login?tab=email", "GET")).toBe(false);
  });

  it("POST su /login conta (server actions)", () => {
    expect(shouldCountAuthRequest("/login", "POST")).toBe(true);
  });

  it("GET di /auth/callback conta (handoff reale)", () => {
    expect(shouldCountAuthRequest("/auth/callback", "GET")).toBe(true);
    expect(shouldCountAuthRequest("/auth/confirm", "GET")).toBe(true);
  });

  it("path non-auth non contano", () => {
    expect(shouldCountAuthRequest("/", "GET")).toBe(false);
    expect(shouldCountAuthRequest("/api/strategies", "POST")).toBe(false);
  });
});
