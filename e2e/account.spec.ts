import { test, expect } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const EMAIL = `e2e-account-${Date.now()}@relay.test`;
const PASSWORD = "Test123!";
const NAME = "Test Account User";

let userId: string | null = null;

test.beforeAll(async () => {
  // Trigger handle_new_user auto-crea profile con guest-xxxxxxxx
  // createUser contro Supabase locale può fallire transientemente: retry
  let data: Awaited<ReturnType<typeof admin.auth.admin.createUser>>["data"] | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (!res.error) {
      data = res.data;
      break;
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  expect(data).not.toBeNull();
  userId = data!.user!.id;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  expect(profileError).toBeNull();
  expect(profile?.username).toMatch(/^guest-/);
});

test.afterAll(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  // Race di hydration: su produzione la pagina carica subito, fill può
  // atterrare prima che React monti -> valore perso -> bottone disabled.
  // Re-fill finché il bottone non è attivo (massimo 5 tentativi).
  for (let i = 0; i < 5; i++) {
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    if (await page.locator('button[type="submit"]').isEnabled()) break;
    await page.waitForTimeout(400);
  }
  await page.click('button[type="submit"]');
}

test("onboarding: guest user viene reindirizzato e completa il profilo", async ({
  page,
}) => {
  await login(page);

  // Gate redirige verso /onboarding (profilo guest-*)
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
  await expect(
    page.getByRole("heading", { name: /completa il tuo profilo/i }),
  ).toBeVisible();

  // Salva il nome
  await page.fill("#username", NAME);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/$/, { timeout: 20000 });

  // Verifica persistenza: profiles.username + metadata sync
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("profiles")
        .select("username")
        .eq("id", userId!)
        .maybeSingle();
      return data?.username;
    })
    .toBe(NAME);

  const { data: authUser } = await admin.auth.admin.getUserById(userId!);
  expect(authUser.user?.user_metadata?.name).toBe(NAME);

  // Il gate NON deve più scattare su "/"
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  expect(new URL(page.url()).pathname).toBe("/");
});

test("profile edit: cambio nome da impostazioni + navbar aggiornata", async ({
  page,
}) => {
  const NEW_NAME = "Nome Cambiato";

  // Completa onboarding se serve, poi vai alle impostazioni
  await login(page);
  try {
    await page.waitForURL(/\/onboarding/, { timeout: 8000 });
    await page.fill("#username", NAME);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$/, { timeout: 20000 });
  } catch {
    // Già su "/": profilo completo, nessun redirect
  }
  await expect(new URL(page.url()).pathname).toBe("/");

  await page.goto("/settings/account", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /impostazioni account/i })).toBeVisible();

  const nameInput = page.locator("#username");
  await expect(nameInput).toHaveValue(NAME, { timeout: 15000 });
  await nameInput.fill(NEW_NAME);
  await page.click('button:has-text("Salva profilo")');

  await expect(page.getByText("Profilo salvato")).toBeVisible();

  // Navbar mostra il nuovo nome nel dropdown
  await page.click('button[aria-label]:has(img), button.rounded-full');
  await expect(page.locator("text=" + NEW_NAME).first()).toBeVisible();

  // Verifica DB
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("profiles")
        .select("username")
        .eq("id", userId!)
        .maybeSingle();
      return data?.username;
    })
    .toBe(NEW_NAME);
});
