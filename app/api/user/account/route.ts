import { createClient, createAdminClient } from "@/lib/supabase/server";

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
  await supabase.from("lobbies").update({ leader_id: null }).eq("leader_id", user.id);

  // 2. Remove lobby memberships
  await supabase.from("lobby_members").delete().eq("user_id", user.id);

  // 3. Anonymize strategy templates (keep records, remove creator reference)
  await supabase.from("strategy_templates").update({ created_by: null }).eq("created_by", user.id);

  // 4. Remove task assignments
  await supabase.from("task_assignments").delete().eq("user_id", user.id);

  // 5. Remove task votes
  await supabase.from("task_votes").delete().eq("user_id", user.id);

  // 6. Delete profile
  await supabase.from("profiles").delete().eq("id", user.id);

  // 7. Delete auth user (requires admin client to bypass RLS)
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("Failed to delete user:", deleteError);
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 200 });
}
