-- ============================================================
-- 00011_lobby_insert_policy.sql — Fix missing INSERT/DELETE policies on lobbies
-- ============================================================

-- Allow authenticated users to create a lobby where they are the leader
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lobbies_insert_leader' AND tablename = 'lobbies') THEN
        CREATE POLICY "lobbies_insert_leader"
            ON lobbies FOR INSERT
            WITH CHECK (leader_id = auth.uid());
    END IF;
END
$$;

-- Allow the leader to delete their own lobby (needed for rollback on errors)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lobbies_delete_leader' AND tablename = 'lobbies') THEN
        CREATE POLICY "lobbies_delete_leader"
            ON lobbies FOR DELETE
            USING (leader_id = auth.uid());
    END IF;
END
$$;
