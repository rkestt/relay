import { test, expect, Page, ConsoleMessage, Request } from '@playwright/test';

const TEST_USER = { email: "test@relay.test", password: "Test123!" };

async function loginViaAPI(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/$/, { timeout: 20000 });
}

test("lobby probe with error capture", async ({ page }) => {
  // Login first
  await loginViaAPI(page);
  
  // Setup error capture
  const errors: string[] = [];
  const networkFailures: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(`[console.error] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[page.error] ${err.message}`));
  page.on("requestfailed", (req: Request) => {
    networkFailures.push(`[NETWORK] ${req.url()} — ${req.failure()?.errorText ?? "?"}`);
  });

  // Go to lobby
  const resp = await page.goto("/lobby/BTDWNS", { waitUntil: "domcontentloaded" });
  console.log(`Status: ${resp?.status()}`);
  await page.waitForTimeout(1000);

  // Dump errors
  console.log("--- CONSOLE ERRORS ---");
  errors.forEach(e => console.log(e));
  console.log("--- NETWORK FAILURES ---");
  networkFailures.forEach(e => console.log(e));
  
  // Screenshot
  await page.screenshot({ path: "/tmp/lobby-debug.png", fullPage: true });
  console.log("--- PAGE CONTENT (first 3000 chars) ---");
  const text = await page.textContent("body") || "";
  console.log(text.substring(0, 3000));
});
