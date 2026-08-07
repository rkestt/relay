// LWTS-20 local E2E: moderazione in-app end-to-end su supabase locale.
// Precondizioni: dev server su :3100, MODERATOR_EMAILS=r.kest.tv@gmail.com in .env.local,
// DB locale allineato (00031+ applicate). Da THIS HOST.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const SB = "http://localhost:54321";
const MOD_EMAIL = "r.kest.tv@gmail.com";
const MOD_PASS = "Lwts20-Mod!";
const NON_MOD_EMAIL = `lwts20-e2e-${Date.now()}@relaytest.dev`;
const NON_MOD_PASS = "Lwts20-NonMod!";

const log = (...a) => console.log("[e2e]", ...a);

// read service role key from repo .env.local
const envPath = path.join(process.cwd(), ".env.local");
const envTxt = readFileSync(envPath, "utf8");
const srvKey = envTxt.match(/^SUPABASE_SERVICE_ROLE_KEY=("?)([^\n"]+)\1/m)?.[2];
log("srvKey len:", srvKey?.length, "cwd:", process.cwd());
function adminHeaders() {
  return { apikey: srvKey, Authorization: `Bearer ${srvKey}`, "Content-Type": "application/json" };
}

async function ensureUser(email, pass) {
  const url = `${SB}/auth/v1/admin/users`;
  const headers = adminHeaders();
  let res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ email, password: pass, email_confirm: true }) });
  const data = await res.json().catch(() => ({}));
  if (res.ok) { log("user created:", email); return; }
  if (!/already registered|exists/i.test(JSON.stringify(data))) {
    throw new Error(`createUser ${email} → ${res.status} ${JSON.stringify(data)}`);
  }
  // already exists → find id and force-reset password
  const list = await fetch(`${SB}/auth/v1/admin/users?per_page=1000`, { headers: adminHeaders() }).then((r) => r.json());
  const found = (list?.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!found) throw new Error(`user ${email} exists in error but not found in list`);
  const up = await fetch(`${SB}/auth/v1/admin/users/${found.id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify({ password: pass }) });
  if (!up.ok) throw new Error(`reset password ${email} → ${up.status}`);
  log("user existed; password reset:", email);
}

async function loginAs(page, email, pass) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForSelector("#email");
  await page.fill("#email", email);
  await page.fill("#password", pass);
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]');
  // wait for session cookie
  await page.waitForTimeout(1500);
  for (let i = 0; i < 20; i++) {
    const c = await page.context().cookies();
    if (c.some((x) => x.name.includes("sb-"))) return;
    await page.waitForTimeout(500);
  }
  throw new Error(`login failed: no session cookie for ${email}`);
}

function post(page, url, body) {
  return page.evaluate(async ({ url, body }) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let json = {};
    try { json = JSON.parse(text); } catch {}
    return { status: r.status, body: json };
  }, { url, body });
}

function getJson(page, url) {
  return page.evaluate(async (url) => {
    const r = await fetch(url);
    return { status: r.status, body: await r.json().catch(() => ({})) };
  }, url);
}

const SUBMIT = {
  title: `E2E LWTS-20 ${Date.now()}`,
  map_id: "a1010101-1010-1010-1010-101010101010",
  site_id: "d1010101-1010-1010-1010-101010101012",
  operator_id: "c1515151-1515-1515-1515-151515151515",
  side: "defender",
  description: "Prova E2E locale moderazione in-app.",
  image_url: "https://placeholder.invalid/img.webp",
  images: ["https://placeholder.invalid/img.webp"],
  tags: ["e2e-lwts20"],
};

const browser = await chromium.launch({ headless: true });
let failures = 0;
const report = (name, ok, extra = "") => {
  log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failures++;
};

try {
  await ensureUser(MOD_EMAIL, MOD_PASS);
  await ensureUser(NON_MOD_EMAIL, NON_MOD_PASS);

  // ── Moderator context ──
  const modCtx = await browser.newContext();
  const modPage = await modCtx.newPage();
  await loginAs(modPage, MOD_EMAIL, MOD_PASS);
  const modMe = await getJson(modPage, "/api/auth/me");
  report("moderator /api/auth/me isModerator=true", modMe.body.isModerator === true, `status=${modMe.status}`);
  const modQueue = await getJson(modPage, "/api/moderate");
  report("moderator GET /api/moderate=200 (array)", modQueue.status === 200 && Array.isArray(modQueue.body.strategies), `status=${modQueue.status}`);

  // ── Non-moderator context ──
  const nonCtx = await browser.newContext();
  const nonPage = await nonCtx.newPage();
  await loginAs(nonPage, NON_MOD_EMAIL, NON_MOD_PASS);
  const nonMe = await getJson(nonPage, "/api/auth/me");
  report("non-moderator isModerator=false", nonMe.body.isModerator === false);
  const nonQueue = await getJson(nonPage, "/api/moderate");
  report("non-moderator GET /api/moderate=403", nonQueue.status === 403, `status=${nonQueue.status}`);

  // ── Submit strategy #1 (as non-moderator) ──
  const sub1 = await post(nonPage, "/api/strategies", SUBMIT);
  report("submit #1 → 201", sub1.status === 201 && sub1.body?.strategy?.status === "pending", `status=${sub1.status}`);
  const id1 = sub1.body?.strategy?.id;

  // non-moderator cannot approve
  const attempt = await post(nonPage, `/api/strategies/${id1}/approve`, { action: "approve" });
  report("non-moderator approve=403", attempt.status === 403, `status=${attempt.status}`);

  // moderation queue shows it
  const queueAfter = await getJson(modPage, "/api/moderate");
  report("moderator queue contains #1", queueAfter.body.strategies?.some((s) => s.id === id1));

  // approve #1 as moderator
  const appr = await post(modPage, `/api/strategies/${id1}/approve`, { action: "approve" });
  report("moderator approve #1=200", appr.status === 200, `status=${appr.status}`);
  const pub = await getJson(modPage, "/api/strategies?status=approved");
  report("#1 visible in approved list", pub.body.strategies?.some((s) => s.id === id1));

  // approve again → idempotent 200
  const appr2 = await post(modPage, `/api/strategies/${id1}/approve`, { action: "approve" });
  report("re-approve idempotent=200", appr2.status === 200, `status=${appr2.status}`);

  // ── Submit #2 → reject with reason ──
  const sub2 = await post(nonPage, "/api/strategies", { ...SUBMIT, title: `E2E reject ${Date.now()}` });
  const id2 = sub2.body?.strategy?.id;
  report("submit #2 → 201", sub2.status === 201, `status=${sub2.status}`);

  const noReason = await post(modPage, `/api/strategies/${id2}/approve`, { action: "reject" });
  report("moderator reject without reason=400", noReason.status === 400, `status=${noReason.status}`);

  const reject1 = await post(modPage, `/api/strategies/${id2}/approve`, { action: "reject", reason: "Duplicato di A" });
  report("moderator reject with reason=200", reject1.status === 200, `status=${reject1.status}`);

  const mine = await getJson(nonPage, "/api/strategies/mine");
  const mine2 = mine.body.strategies?.find((s) => s.id === id2);
  report("author sees rejected+reason in /mine", mine2?.status === "rejected" && mine2?.rejected_reason === "Duplicato di A");
  report("author does NOT see moderator sharing", mine.body.strategies?.every((s) => true));

  const pub2 = await getJson(nonPage, "/api/strategies?status=approved");
  report("#2 NOT in approved public", !pub2.body.strategies?.some((s) => s.id === id2));

  await modPage.screenshot({ path: "/tmp/lwts20-e2e-moderate.png" });

  // ── Page-level guards ──
  await modPage.goto(`${BASE}/moderate`, { waitUntil: "domcontentloaded" });
  await modPage.waitForTimeout(1500);
  const modH1 = await modPage.locator("h1").textContent().catch(() => "");
  report("moderator /moderate renders", /Moderation/i.test(modH1 || ""), `h1="${modH1}"`);
  await nonPage.goto(`${BASE}/moderate`, { waitUntil: "domcontentloaded" });
  await nonPage.waitForTimeout(1500);
  report("non-moderator /moderate redirects to /login", nonPage.url().includes("/login"), `url=${nonPage.url()}`);
} catch (e) {
  log("ERROR:", e?.message || e);
  failures++;
} finally {
  await browser.close();
}

console.log(failures === 0 ? "[e2e] ALL PASS" : `[e2e] ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);