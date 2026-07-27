-- ============================================================
-- 00009_lobby_insert_policy.sql — Fix missing INSERT/DELETE policies on lobbies
-- ============================================================

-- Allow authenticated users to create a lobby where they are the leader
CREATE POLICY "lobbies_insert_leader"
    ON lobbies FOR INSERT
    WITH CHECK (leader_id = auth.uid());

-- Allow the leader to delete their own lobby (needed for rollback on errors)
CREATE POLICY "lobbies_delete_leader"
    ON lobbies FOR DELETE
    USING (leader_id = auth.uid());
