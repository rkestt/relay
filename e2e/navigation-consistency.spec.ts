import { test, expect, Page } from "@playwright/test";

// LWTS-14: navigazione UI/UX coerente.
// Vincolo: il back button deve essere SEMPRE in alto a sinistra (metà sinistra del viewport),
// non a destra e non inline nel body.
// CTA di conferma/avanti: sempre in basso (sticky bottom o in fondo alla pagina).

const TEST_USER = { email: "test@relay.test", password: "Test123!" };

async function loginViaAPI(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/$/, { timeout: 20000 });
}

// Trova il back button/link visibile e ritorna la sua posizione X relativa al viewport.
// Regola: left < viewportWidth / 2 => in alto a SINISTRA (ok); altrimenti FAIL.
async function getBackElementPosition(page: Page): Promise<{
  found: boolean;
  left: number;
  right: number;
  vw: number;
  text: string;
} | null> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const isBack = (b: Element) => {
      const t = (b.textContent || "").trim().toLowerCase();
      const label = (b.getAttribute("aria-label") || "").toLowerCase();
      return (
        t === "back" ||
        t.startsWith("back ") ||
        t === "back to home" ||
        t.startsWith("back to home") ||
        label.includes("back to") ||
        label === "back"
      );
    };
    // 1) back dentro un header o barra sticky/fixed in alto
    const containers = [
      ...document.querySelectorAll("header"),
      ...document.querySelectorAll('div.sticky.top-0, div.fixed'),
    ].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < 120;
    });
    for (const c of containers) {
      const cands = [...c.querySelectorAll("button, a")].filter(isBack);
      if (cands.length > 0) {
        const r = cands[0].getBoundingClientRect();
        return {
          found: true,
          left: Math.round(r.left),
          right: Math.round(r.right),
          vw,
          text: cands[0].textContent?.trim().replace(/\s+/g, " ") || "",
        };
      }
    }
    // 2) back link/button direttamente fixed/sticky in alto (es. login/signup)
    const direct = [...document.querySelectorAll("a, button")].filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        (cs.position === "fixed" || cs.position === "sticky") &&
        r.top < 120 &&
        r.width > 0 &&
        isBack(el)
      );
    });
    if (direct.length > 0) {
      const r = direct[0].getBoundingClientRect();
      return {
        found: true,
        left: Math.round(r.left),
        right: Math.round(r.right),
        vw,
        text: direct[0].textContent?.trim().replace(/\s+/g, " ") || "",
      };
    }
    return null;
  });
}

test.describe.configure({ mode: "serial" });

test.describe("Back button top-left — pagine pubbliche", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  for (const path of ["/login", "/signup", "/privacy", "/terms", "/cookies", "/settings/cookies"]) {
    test(`${path} ha il back link in alto a sinistra`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const pos = await getBackElementPosition(page);
      expect(pos, `${path}: back button trovato`).not.toBeNull();
      expect(pos!.left, `${path}: back in metà sinistra`).toBeLessThan(pos!.vw / 2);
      expect(pos!.left, `${path}: back non a destra`).toBeLessThan(pos!.vw * 0.4);
    });
  }
});

test.describe("Back button top-left — pagine autenticate", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  for (const path of ["/tasks", "/submit", "/settings/account"]) {
    test(`${path} ha il back in alto a sinistra`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const pos = await getBackElementPosition(page);
      expect(pos, `${path}: back trovato`).not.toBeNull();
      expect(pos!.left, `${path}: back in metà sinistra`).toBeLessThan(pos!.vw / 2);
      expect(pos!.left, `${path}: back non a destra`).toBeLessThan(pos!.vw * 0.4);
    });
  }

  test("home (/) non ha back (è la root)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const pos = await getBackElementPosition(page);
    // la home non deve avere un back button top-left
    expect(pos).toBeNull();
  });
});
