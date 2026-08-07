// LWTS-20 probe: signup su stage -> submit strategia -> verifica
import { chromium } from "playwright";

const BASE = "https://relay-stage.vercel.app";
const EMAIL = `lwts20-test-${Date.now()}@relaytest.dev`;
const PASS = "Lwts20-Probe!";
const log = (...a) => console.log("[probe]", ...a);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (m) => {
  if (m.type() === "error") log("CONSOLE ERROR:", m.text().slice(0, 200));
});
page.on("requestfailed", (r) =>
  log("REQ FAILED:", r.url().slice(0, 120), r.failure()?.errorText),
);
page.on("response", (r) => {
  if (r.url().includes("/api/") || r.url().includes("supabase"))
    log("RESP:", r.status(), r.url().slice(0, 110));
});

// 1) signup
log("→ signup", EMAIL);
await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await page.fill("#email", EMAIL);
await page.fill("#password", PASS);
await page.fill("#confirmPassword", PASS);
await page.check("#acceptTerms");
await page.screenshot({ path: "/tmp/lwts20-1-signup-filled.png" });
await page.click('button[type="submit"]');

// attesa: redirect (login ok) o messaggio conferma email
try {
  await page.waitForURL((u) => !u.pathname.includes("/signup"), {
    timeout: 15000,
  });
  log("→ redirect dopo signup:", page.url());
} catch {
  log("→ nessun redirect: stato pagina =", page.url());
  const body = await page.locator("body").innerText();
  log("→ body:", body.slice(0, 400).replace(/\n+/g, " | "));
  await page.screenshot({ path: "/tmp/lwts20-2-signup-post.png" });
}

// 2) se loggato: POST /api/strategies via fetch dal context
const cookies = await page.context().cookies();
log("→ cookies:", cookies.map((c) => c.name).join(","));
const hasSession = cookies.some((c) => c.name.includes("sb-"));
if (hasSession) {
  const payload = {
    title: `TEST LWTS-20 probe ${Date.now()}`,
    map_id: "a1010101-1010-1010-1010-101010101010",
    site_id: "d1010101-1010-1010-1010-101010101012",
    operator_id: "c1515151-1515-1515-1515-151515151515",
    side: "defender",
    description: "Probe automatico LWTS-20 (verifica submit+webhook).",
    image_url: "https://relay-stage.vercel.app/images/strategies/mock_038.webp",
    images: ["https://relay-stage.vercel.app/images/strategies/mock_038.webp"],
    tags: ["lwts20-test"],
  };
  const res = await page.evaluate(async (p) => {
    const r = await fetch("/api/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    return { status: r.status, body: await r.text() };
  }, payload);
  log("→ POST /api/strategies:", res.status, res.body.slice(0, 300));
  await page.screenshot({ path: "/tmp/lwts20-3-submit.png" });
} else {
  log("→ NO SESSIONE — submit non possibile, serve conferma email o login.");
}

await browser.close();
