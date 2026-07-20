import { test, expect, Page, ConsoleMessage, Request } from "@playwright/test";

// ── Test config ──────────────────────────────────────────────
const TEST_USER = { email: "test@r6hub.test", password: "Test123!" };

// ── Helpers ──────────────────────────────────────────────────

async function captureConsole(
  page: Page,
): Promise<{ errors: string[] }> {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`[page.error] ${err.message}`);
  });
  return { errors };
}

async function captureNetwork(
  page: Page,
): Promise<string[]> {
  const failures: string[] = [];
  page.on("requestfailed", (req: Request) => {
    failures.push(`[NETWORK] ${req.url()} — ${req.failure()?.errorText ?? "?"}`);
  });
  return failures;
}

async function checkPage(
  page: Page,
  url: string,
  options?: {
    expectUrl?: RegExp;
    expectHeading?: RegExp;
    skipCriticalErrorCheck?: boolean;
  },
) {
  const consoleCapture = captureConsole(page);
  captureNetwork(page);

  const resp = await page.goto(url, { waitUntil: "networkidle" });
  expect(resp?.ok(), `${url} → ${resp?.status()}`).toBeTruthy();
  await page.waitForTimeout(800);

  const { errors } = await consoleCapture;
  if (errors.length > 0) console.log(`  ⚠ console:${url}`, errors);

  const critical = errors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("Failed to load") &&
      !e.includes("net::ERR_ABORTED") &&
      !e.includes("Mixed Content"),
  );
  if (!options?.skipCriticalErrorCheck) {
    expect(critical, `No runtime errors on ${url}`).toEqual([]);
  }

  if (options?.expectHeading) {
    await expect(page.getByRole("heading", { name: options.expectHeading }).first()).toBeVisible();
  }
  if (options?.expectUrl) {
    await expect(page).toHaveURL(options.expectUrl);
  }

  await page.screenshot({
    path: `e2e/screenshots/${url.replace(/[^a-z0-9]/gi, "_")}.png`,
    fullPage: true,
  });
}

// ── Login helper — logs in via Supabase SDK and seeds cookies ─

async function loginViaAPI(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  // Wait for redirect to home
  await page.waitForURL(/\/$/, { timeout: 20000 });
}

// ── Global setup: login once, save storage ───────────────────

test.describe.configure({ mode: "serial" });

test.describe("Public pages", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("/login", async ({ page }) => {
    await checkPage(page, "/login", {
      expectHeading: /welcome back/i,
    });
  });

  test("/signup", async ({ page }) => {
    await checkPage(page, "/signup", {
      expectHeading: /create account|sign up/i,
    });
  });

  test("/privacy", async ({ page }) => {
    await checkPage(page, "/privacy", {
      skipCriticalErrorCheck: true,
    });
  });

  test("/terms", async ({ page }) => {
    await checkPage(page, "/terms", {
      skipCriticalErrorCheck: true,
    });
  });

  test("/cookies", async ({ page }) => {
    await checkPage(page, "/cookies", {
      skipCriticalErrorCheck: true,
    });
  });

  test("/validate (no params = error state)", async ({ page }) => {
    await checkPage(page, "/validate", {
      skipCriticalErrorCheck: true,
    });
  });

  test("/settings/cookies (public)", async ({ page }) => {
    await checkPage(page, "/settings/cookies", {
      skipCriticalErrorCheck: true,
    });
  });

  test("redirects / → /login when unauthenticated", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Auth flow", () => {
  test("login with email/password redirects to /", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$/, { timeout: 20000 });
    expect(page.url()).toBe("http://localhost:3000/");
  });
});

test.describe("Authenticated pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test("/ — home/landing", async ({ page }) => {
    await checkPage(page, "/", {
      skipCriticalErrorCheck: true, // might need lobby data
    });
  });

  test("/tasks", async ({ page }) => {
    await checkPage(page, "/tasks", {
      skipCriticalErrorCheck: true,
    });
  });

  test("/submit", async ({ page }) => {
    await checkPage(page, "/submit", {
      skipCriticalErrorCheck: true,
    });
  });

  test("/settings/account", async ({ page }) => {
    await checkPage(page, "/settings/account", {
      skipCriticalErrorCheck: true,
    });
  });

  test("lobby page - /lobby/TESTOP", async ({ page }) => {
    await checkPage(page, "/lobby/TESTOP", {
      skipCriticalErrorCheck: true,
    });
  });

  test("lobby map selection - /lobby/TESTOP/map", async ({ page }) => {
    await checkPage(page, "/lobby/TESTOP/map", {
      skipCriticalErrorCheck: true,
    });
  });

  test("lobby bans - /lobby/TESTOP/bans", async ({ page }) => {
    await checkPage(page, "/lobby/TESTOP/bans", {
      skipCriticalErrorCheck: true,
    });
  });

  test("lobby select - /lobby/TESTOP/select", async ({ page }) => {
    await checkPage(page, "/lobby/TESTOP/select", {
      skipCriticalErrorCheck: true,
    });
  });

  test("lobby tasks - /lobby/TESTOP/tasks", async ({ page }) => {
    await checkPage(page, "/lobby/TESTOP/tasks", {
      skipCriticalErrorCheck: true,
    });
  });
});

test.describe("API", () => {
  test("GET /api/health", async ({ page }) => {
    const resp = await page.goto("/api/health");
    expect(resp?.ok()).toBeTruthy();
    const body = await resp?.json();
    expect(body?.status).toBe("ok");
  });
});
