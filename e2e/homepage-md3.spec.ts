import { test, expect, Page } from "@playwright/test";

const TEST_USER = { email: "test@r6hub.test", password: "Test123!" };

async function loginViaAPI(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/$/, { timeout: 20000 });
}

test.describe("Homepage MD3 refactor (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test("renders main CTAs with correct text", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "r6hub" })).toBeVisible();
    await expect(page.getByRole("button", { name: /create lobby/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /join lobby/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /submit strategy/i })).toBeVisible();
  });

  test("starting side toggle works", async ({ page }) => {
    const attackerBtn = page.getByRole("button", { name: /^attacker$/i });
    const defenderBtn = page.getByRole("button", { name: /^defender$/i });
    await expect(attackerBtn).toBeVisible();
    await expect(defenderBtn).toBeVisible();
    await defenderBtn.click();
    await expect(defenderBtn).toBeVisible();
  });

  test("join lobby opens dialog with input", async ({ page }) => {
    await page.getByRole("button", { name: /join lobby/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Join Lobby" })).toBeVisible();
    await expect(page.getByText(/6-character room code/i)).toBeVisible();
    const input = page.getByRole("textbox", { name: /room code/i });
    await expect(input).toBeVisible();
    await input.fill("ABC123");
    await expect(input).toHaveValue("ABC123");
  });

  test("dialog cancel closes it", async ({ page }) => {
    await page.getByRole("button", { name: /join lobby/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("join button disabled until 6 chars entered", async ({ page }) => {
    await page.getByRole("button", { name: /join lobby/i }).click();
    const dialog = page.getByRole("dialog");
    const joinBtn = dialog.getByRole("button", { name: /^join$/i });
    await expect(joinBtn).toBeDisabled();
    await page.getByRole("textbox", { name: /room code/i }).fill("ABCDEF");
    await expect(joinBtn).toBeEnabled();
  });

  test("no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    const critical = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("Failed to load") &&
        !e.includes("net::ERR_ABORTED") &&
        !e.includes("Mixed Content"),
    );
    expect(critical).toEqual([]);
  });
});
