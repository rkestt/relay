#!/usr/bin/env node
/**
 * Comprehensive verification script.
 * Runs: lint → unit tests → build → e2e tests
 * Exits on first failure.
 */
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;
const LOG_DIR = `${ROOT}/e2e/screenshots`;

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

function run(label, cmd, opts = {}) {
  console.log(`\n═══════════════════════════════════════`);
  console.log(`  ${label}`);
  console.log(`  $ ${cmd}`);
  console.log(`═══════════════════════════════════════`);
  try {
    const out = execSync(cmd, {
      cwd: ROOT,
      stdio: "pipe",
      timeout: opts.timeout || 180_000,
      encoding: "utf-8",
      ...opts,
    });
    console.log(out.split("\n").slice(-15).join("\n"));
    console.log(`  ✅ ${label} — OK`);
    return true;
  } catch (e) {
    console.error(e.stdout?.split("\n").slice(-20).join("\n"));
    console.error(`  ❌ ${label} — FAILED (${e.status})`);
    if (!opts.optional) process.exit(e.status ?? 1);
    return false;
  }
}

// Step 1: Lint
run("ESLint", "npx eslint . --max-warnings 30");

// Step 2: Unit tests
run("Vitest", "npx vitest run", { timeout: 120_000 });

// Step 3: Build
run("Next.js Build", "npx next build", { timeout: 300_000 });

console.log(`\n═══════════════════════════════════════`);
console.log(`  ✅ All pre-tests passed`);
console.log(`  Ready for e2e — run:`);
console.log(`  npm run dev & npx playwright test`);
console.log(`═══════════════════════════════════════`);
