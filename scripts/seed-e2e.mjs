#!/usr/bin/env node
/**
 * E2E test data seeder.
 * Creates a test lobby, strategies, and related data for Playwright tests.
 * Run AFTER migrations are applied and test user exists.
 *
 * Usage: node scripts/seed-e2e.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://localhost:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3ODQzMTg2NzQsImV4cCI6MjA5OTY3ODY3NH0.Wh4M_52UoufkGPS9C1arYznlR-5q2DHFrAUBopT0_Ew";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTc4NDMxODY3NCwiZXhwIjoyMDk5Njc4Njc0fQ.7D7Z1H_4Rj15FRaLkKIJCyJtTpRSZTRxnFL5XJdo9U4";

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
const TEST_USER2_ID = "00000000-0000-0000-0000-000000000002";

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { headers: { Authorization: `Bearer ${SERVICE_KEY}` } },
});

async function main() {
  console.log("=== Seeding e2e test data ===");

  // 1. Verify test users exist
  const { data: users, error: usersErr } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", [TEST_USER_ID, TEST_USER2_ID]);
  if (usersErr) throw usersErr;
  console.log(`  Profiles found: ${users?.length ?? 0}`);

  if (!users || users.length < 2) {
    console.log("  ⚠ Both test users not found. Run create-test-user.sql first.");
    return;
  }

  // 2. Create a test lobby
  const { data: existing } = await supabase
    .from("lobbies")
    .select("id, room_code")
    .eq("leader_id", TEST_USER_ID)
    .limit(1);

  let lobbyId;
  if (existing && existing.length > 0) {
    lobbyId = existing[0].id;
    console.log(`  Using existing lobby: ${existing[0].room_code} (${lobbyId})`);
  } else {
    const { data: lobby, error: lobbyErr } = await supabase
      .from("lobbies")
      .insert({
        room_code: "TESTOP",
        leader_id: TEST_USER_ID,
        phase: "waiting",
      })
      .select("id, room_code")
      .single();
    if (lobbyErr) throw lobbyErr;
    lobbyId = lobby.id;
    console.log(`  Created lobby: ${lobby.room_code} (${lobbyId})`);

    // Add members
    await supabase.from("lobby_members").insert([
      { lobby_id: lobbyId, user_id: TEST_USER_ID },
      { lobby_id: lobbyId, user_id: TEST_USER2_ID },
    ]);
    console.log("  Added 2 members");

    // Create initial round
    await supabase.from("rounds").insert({
      lobby_id: lobbyId,
      round_number: 1,
      status: "active",
      team_side: "attacker",
    });
    console.log("  Created round 1");
  }

  // 3. Check for strategies
  const { data: strategies } = await supabase
    .from("strategy_templates")
    .select("id, title")
    .limit(3);
  const strategyCount = strategies?.length ?? 0;
  console.log(`  Strategies in DB: ${strategyCount}`);

  // 4. Verify maps exist
  const { data: maps } = await supabase.from("maps").select("id, name").limit(5);
  console.log(`  Maps in DB: ${maps?.length ?? 0}`);

  console.log("\n=== Seeding complete ===");
  console.log(`Lobby code: TESTOP`);
  console.log(`Lobby ID: ${lobbyId}`);
  console.log(`Test user 1: ${TEST_USER_ID} (test@r6hub.test / Test123!)`);
  console.log(`Test user 2: ${TEST_USER_ID} (test2@r6hub.test / Test123!)`);
}

main().catch(console.error);
