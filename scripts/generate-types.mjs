#!/usr/bin/env node
/**
 * generate-types.mjs — Generate TypeScript types from running DB schema.
 *
 * Usage: node scripts/generate-types.mjs
 * Requires: docker exec on supabase_db_relay
 * Output: types/index.ts
 */

import { execSync } from "child_process";
import fs from "fs";

const CONTAINER = "supabase_db_relay";
const SQL_USER = "postgres";
const SQL_DB = "postgres";
const OUT = "types/index.ts";

function query(sql) {
  const raw = execSync(
    `docker exec -i ${CONTAINER} psql -U ${SQL_USER} -d ${SQL_DB} -A -t -F '|'`,
    { input: sql, encoding: "utf-8" }
  );
  return raw.trim().split("\n").filter(Boolean).map((r) => {
    const [table, column, type, nullable] = r.split("|");
    return { table, column, type, nullable: nullable === "YES" };
  });
}

function pgTypeToTs(pgType) {
  const map = {
    uuid: "string",
    text: "string",
    integer: "number",
    numeric: "number",
    boolean: "boolean",
    "timestamp with time zone": "string",
    "timestamp without time zone": "string",
    date: "string",
    json: "Record<string, unknown>",
    jsonb: "Record<string, unknown>",
    real: "number",
    "double precision": "number",
    bigint: "number",
  };
  return map[pgType] || "unknown";
}

function build() {
  const sql = [
    "SELECT table_name, column_name, data_type, is_nullable",
    "FROM information_schema.columns",
    "WHERE table_schema = 'public'",
    "  AND table_name NOT IN ('schema_migrations')",
    "ORDER BY table_name, ordinal_position;",
  ].join("\n");

  const rows = query(sql);

  const tables = {};
  for (const r of rows) {
    if (!tables[r.table]) tables[r.table] = [];
    tables[r.table].push(r);
  }

  const nameMap = {
    lobbies: "Lobby",
    lobby_bans: "LobbyBan",
    lobby_members: "LobbyMember",
    lobby_selections: "LobbySelection",
    maps: "Map",
    operator_tags: "OperatorTag",
    operators: "Operator",
    profiles: "Profile",
    rounds: "Round",
    sites: "Site",
    strategy_hotspots: "StrategyHotspot",
    strategy_images: "StrategyImage",
    strategy_tags: "StrategyTag",
    strategy_templates: "StrategyTemplate",
    task_assignments: "TaskAssignment",
    task_votes: "TaskVote",
  };

  const enumFields = {
    lobbies: { status: '"active" | "closed"', phase: '"waiting" | "playing" | "closed"', starting_side: '"attacker" | "defender" | null' },
    operators: { side: '"attacker" | "defender"' },
    rounds: { status: '"active" | "completed"', team_side: '"attacker" | "defender" | null', winner_side: '"attacker" | "defender" | null' },
    lobby_bans: { side: '"attacker" | "defender"' },
    strategy_templates: { status: '"pending" | "approved" | "rejected"' },
    task_votes: { vote_type: '"up" | "down"' },
  };

  let out = `// ──────────────────────────────────────────────
// Database types — auto-generated from live DB schema
// Regenerate: node scripts/generate-types.mjs
// ──────────────────────────────────────────────

`;

  for (const [dbTable, cols] of Object.entries(tables)) {
    const tsName = nameMap[dbTable] || dbTable;
    const enums = enumFields[dbTable] || {};
    out += `export interface ${tsName} {\n`;
    for (const c of cols) {
      let tsType = enums[c.column] || pgTypeToTs(c.type);
      if (c.nullable && !tsType.includes("null")) tsType += " | null";
      out += `  ${c.column}: ${tsType};\n`;
    }
    out += `}\n\n`;
  }

  out += `// ── Virtual / computed fields ──\n\n`;
  out += `export interface TaskAssignmentWithVotes extends TaskAssignment {\n`;
  out += `  upvotes?: number;\n  downvotes?: number;\n  user_vote?: "up" | "down" | null;\n}\n\n`;
  out += `export interface StrategyTemplateWithRelations extends StrategyTemplate {\n`;
  out += `  images?: StrategyImage[];\n  strategy_tags?: StrategyTag[];\n  strategy_hotspots?: StrategyHotspot[];\n}\n`;

  fs.writeFileSync(OUT, out, "utf-8");
  console.log(`Types written to ${OUT}`);
}

build();
