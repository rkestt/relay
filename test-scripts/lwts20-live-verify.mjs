// Live stage verify (non-moderator path) + owner path via Discord needs user login.
import { chromium } from "playwright";
const BASE = "https://relay-stage.vercel.app";
const EMAIL = "lwts20-test-1785961662167@relaytest.dev";
const PASS = "Lwts20-Probe!";
const b = await chromium.launch({ headless: true });
let fail = 0;
const rep = (n, ok, x="") => { console.log((ok?"PASS":"FAIL"), n, x?`— ${x}`:""); if(!ok) fail++; };
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await p.fill("#email", EMAIL); await p.fill("#password", PASS);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(2500);
  const cookies = await ctx.cookies();
  rep("login session cookie", cookies.some(c=>c.name.includes("sb-")));
  const me = await p.evaluate(async () => (await (await fetch("/api/auth/me")).json()));
  rep("non-mod isModerator=false", me.isModerator === false);
  const modResp = await p.evaluate(async () => (await fetch("/api/moderate")).status);
  rep("non-mod /api/moderate=403", modResp === 403, `status=${modResp}`);
  await p.goto(`${BASE}/moderate`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2000);
  rep("non-mod /moderate redirect → /login", p.url().includes("/login"), `url=${p.url()}`);
  const mine = await p.evaluate(async () => await (await fetch("/api/strategies/mine")).json());
  rep("mine=200 (array)", Array.isArray(mine.strategies), `count=${mine.strategies?.length}`);
  rep("mine shows own pending probe", mine.strategies?.some(s=>s.id==="a13c8916-fd49-466f-bafd-2bbda3008a99"), "a13c8916 presente");
  await p.screenshot({ path: "/tmp/lwts20-live.png" });
} catch (e) { console.log("ERR:", e.message); fail++; }
finally { await b.close(); }
console.log(fail===0 ? "LIVE NON-MOD PATH: ALL PASS" : `LIVE: ${fail} FAIL`);
process.exit(fail?1:0);
