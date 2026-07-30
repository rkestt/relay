-- ============================================================
-- 00007_add_missing_lobby_policies.sql — Add missing INSERT/DELETE
-- RLS policies so lobby creation and cleanup work correctly.
-- ============================================================

-- Lobbies — anyone authenticated can create a lobby (they become leader)
DROP POLICY IF EXISTS "lobbies_insert_leader" ON lobbies;
CREATE POLICY "lobbies_insert_leader"
    ON lobbies FOR INSERT
    WITH CHECK (leader_id = auth.uid());

-- Lobbies — leader can delete their own lobby
DROP POLICY IF EXISTS "lobbies_delete_leader" ON lobbies;
CREATE POLICY "lobbies_delete_leader"
    ON lobbies FOR DELETE
    USING (leader_id = auth.uid());

-- Rounds — leader can delete rounds (cleanup on lobby close)
DROP POLICY IF EXISTS "rounds_delete_leader" ON rounds;
CREATE POLICY "rounds_delete_leader"
    ON rounds FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM lobbies
            WHERE lobbies.id = rounds.lobby_id
              AND lobbies.leader_id = auth.uid()
        )
    );

-- Lobby bans — leader can delete bans
DROP POLICY IF EXISTS "lobby_bans_delete_leader" ON lobby_bans;
CREATE POLICY "lobby_bans_delete_leader"
    ON lobby_bans FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM lobbies
            WHERE lobbies.id = lobby_bans.lobby_id
              AND lobbies.leader_id = auth.uid()
        )
    );

-- Lobby selections — users can delete their own selections
DROP POLICY IF EXISTS "lobby_selections_delete_own" ON lobby_selections;
CREATE POLICY "lobby_selections_delete_own"
    ON lobby_selections FOR DELETE
    USING (user_id = auth.uid());

-- Task assignments — leader can delete assignments
DROP POLICY IF EXISTS "task_assignments_delete_leader" ON task_assignments;
CREATE POLICY "task_assignments_delete_leader"
    ON task_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM lobbies
            WHERE lobbies.id = task_assignments.lobby_id
              AND lobbies.leader_id = auth.uid()
        )
    );

-- Strategy tags — creator can delete their own tags
DROP POLICY IF EXISTS "strategy_tags_delete_own" ON strategy_tags;
CREATE POLICY "strategy_tags_delete_own"
    ON strategy_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_tags.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

-- Strategy hotspots — creator can delete their own hotspots
DROP POLICY IF EXISTS "strategy_hotspots_delete_own" ON strategy_hotspots;
CREATE POLICY "strategy_hotspots_delete_own"
    ON strategy_hotspots FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_hotspots.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );
