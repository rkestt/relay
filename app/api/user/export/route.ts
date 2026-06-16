import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    { data: profile },
    { data: lobbies },
    { data: lobbyMemberships },
    { data: strategies },
    { data: taskAssignments },
    { data: taskVotes },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("lobbies").select("*").eq("leader_id", user.id),
    supabase.from("lobby_members").select("*").eq("user_id", user.id),
    supabase.from("strategy_templates").select("*").eq("created_by", user.id),
    supabase.from("task_assignments").select("*").eq("user_id", user.id),
    supabase.from("task_votes").select("*").eq("user_id", user.id),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile,
    lobbies: lobbies || [],
    lobby_memberships: lobbyMemberships || [],
    strategies: strategies || [],
    task_assignments: taskAssignments || [],
    task_votes: taskVotes || [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="r6hub-data-export-${Date.now()}.json"`,
    },
  });
}
