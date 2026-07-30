#!/usr/bin/env node
/**
 * new-migration.mjs — Create a new migration file.
 *
 * Usage: node scripts/new-migration.mjs <kebab-case-description>
 *   e.g.: node scripts/new-migration.mjs add_user_preferences
 *
 * Creates: supabase/migrations/00026_<description>.sql
 */

import fs from "fs";
import path from "path";

const desc = process.argv[2];
if (!desc) {
  console.error("Usage: node scripts/new-migration.mjs <kebab-case-description>");
  process.exit(1);
}

const dir = path.join(process.cwd(), "supabase", "migrations");
if (!fs.existsSync(dir)) {
  console.error(`Not found: ${dir}`);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
const lastNum = files.reduce((max, f) => {
  const m = f.match(/^(\d+)/);
  return m ? Math.max(max, parseInt(m[1], 10)) : max;
}, 0);

const nextNum = String(lastNum + 1).padStart(5, "0");
const filename = `${nextNum}_${desc}.sql`;
const filepath = path.join(dir, filename);

const template = `-- ============================================================
-- ${filename}
-- ============================================================

-- Your SQL here.
`;

fs.writeFileSync(filepath, template, "utf-8");
console.log(`Created: ${filepath}`);
