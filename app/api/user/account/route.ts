import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1. Anonymize lobbies created by user (keep records, remove leader reference)
  await withTimeout(
    supabase.from("lobbies").update({ leader_id: null }).eq("leader_id", user.id),
    15000,
    "anonymize lobbies"
  );

  // 2. Delete lobby selections (child of lobby_members)
  await withTimeout(
    supabase.from("lobby_selections").delete().eq("user_id", user.id),
    15000,
    "delete lobby selections"
  );

  // 3. Delete lobby bans (child of lobby_members / lobbies)
  const { data: bannedLobbyIds } = await withTimeout(
    supabase
      .from("lobby_members")
      .select("lobby_id")
      .eq("user_id", user.id),
    10000,
    "fetch banned lobby ids"
  );
  if (bannedLobbyIds && bannedLobbyIds.length > 0) {
    const lobbyIds = bannedLobbyIds.map((r: { lobby_id: string }) => r.lobby_id);
    await withTimeout(
      supabase.from("lobby_bans").delete().in("lobby_id", lobbyIds),
      15000,
      "delete lobby bans"
    );
  }

  // 4. Delete strategy child tables before anonymizing strategy_templates
  const { data: strategies } = await withTimeout(
    supabase
      .from("strategy_templates")
      .select("id")
      .eq("created_by", user.id),
    10000,
    "fetch user strategies"
  );
  if (strategies && strategies.length > 0) {
    const strategyIds = strategies.map((s: { id: string }) => s.id);
    await withTimeout(
      supabase.from("strategy_tags").delete().in("strategy_id", strategyIds),
      15000,
      "delete strategy tags"
    );
    await withTimeout(
      supabase.from("strategy_hotspots").delete().in("strategy_id", strategyIds),
      15000,
      "delete strategy hotspots"
    );
    await withTimeout(
      supabase.from("strategy_images").delete().in("strategy_id", strategyIds),
      15000,
      "delete strategy images"
    );
    await withTimeout(
      supabase.from("validation_queue").delete().in("strategy_id", strategyIds),
      15000,
      "delete validation queue"
    );
  }

  // 5. Anonymize strategy templates (keep records, remove creator reference)
  await withTimeout(
    supabase.from("strategy_templates").update({ created_by: null }).eq("created_by", user.id),
    15000,
    "anonymize strategy templates"
  );

  // 6. Remove lobby memberships (after selections/bans deleted)
  await withTimeout(
    supabase.from("lobby_members").delete().eq("user_id", user.id),
    15000,
    "delete lobby memberships"
  );

  // 7. Remove task assignments
  await withTimeout(
    supabase.from("task_assignments").delete().eq("user_id", user.id),
    15000,
    "delete task assignments"
  );

  // 8. Remove task votes
  await withTimeout(
    supabase.from("task_votes").delete().eq("user_id", user.id),
    15000,
    "delete task votes"
  );

  // 9. Delete profile
  await withTimeout(
    supabase.from("profiles").delete().eq("id", user.id),
    15000,
    "delete profile"
  );

  // 10. Delete auth user (requires admin client to bypass RLS)
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("Failed to delete user:", deleteError);
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 200 });
}
