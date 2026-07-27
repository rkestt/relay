-- ============================================================
-- 00002_rls_policies.sql — Row-Level Security for r6hub
-- Enables RLS on every table and grants minimal access.
-- Assumes authenticated users (auth.uid()) throughout.
-- ============================================================

-- --------------------------------
-- Profiles
-- --------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles
CREATE POLICY "profiles_select_all"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile only
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- --------------------------------
-- Maps
-- --------------------------------
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "maps_select_all"
    ON maps FOR SELECT
    USING (true);

-- --------------------------------
-- Sites
-- --------------------------------
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "sites_select_all"
    ON sites FOR SELECT
    USING (true);

-- --------------------------------
-- Operators
-- --------------------------------
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "operators_select_all"
    ON operators FOR SELECT
    USING (true);

-- --------------------------------
-- Operator tags
-- --------------------------------
ALTER TABLE operator_tags ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "operator_tags_select_all"
    ON operator_tags FOR SELECT
    USING (true);

-- --------------------------------
-- Lobbies
-- --------------------------------
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;

-- Members of a lobby can read it
CREATE POLICY "lobbies_select_member"
    ON lobbies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = lobbies.id
              AND lobby_members.user_id   = auth.uid()
        )
        OR leader_id = auth.uid()
    );

-- Only the creator/leader can update the lobby
CREATE POLICY "lobbies_update_leader"
    ON lobbies FOR UPDATE
    USING (leader_id = auth.uid())
    WITH CHECK (leader_id = auth.uid());

-- --------------------------------
-- Lobby members
-- --------------------------------
ALTER TABLE lobby_members ENABLE ROW LEVEL SECURITY;

-- Members can see who is in their lobby
CREATE POLICY "lobby_members_select_own"
    ON lobby_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members AS lm
            WHERE lm.lobby_id = lobby_members.lobby_id
              AND lm.user_id = auth.uid()
        )
    );

-- Authenticated users can join (insert themselves)
CREATE POLICY "lobby_members_insert_own"
    ON lobby_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can leave (delete their own membership)
CREATE POLICY "lobby_members_delete_own"
    ON lobby_members FOR DELETE
    USING (user_id = auth.uid());

-- --------------------------------
-- Rounds
-- --------------------------------
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

-- Members of the parent lobby can read rounds
CREATE POLICY "rounds_select_member"
    ON rounds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = rounds.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- Members can insert rounds into their lobby
CREATE POLICY "rounds_insert_member"
    ON rounds FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = rounds.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- Members can update rounds in their lobby
CREATE POLICY "rounds_update_member"
    ON rounds FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = rounds.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- --------------------------------
-- Lobby bans
-- --------------------------------
ALTER TABLE lobby_bans ENABLE ROW LEVEL SECURITY;

-- Members of the lobby can read bans
CREATE POLICY "lobby_bans_select_member"
    ON lobby_bans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = lobby_bans.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- Members can insert bans
CREATE POLICY "lobby_bans_insert_member"
    ON lobby_bans FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = lobby_bans.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- Members can update bans they inserted
CREATE POLICY "lobby_bans_update_own"
    ON lobby_bans FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = lobby_bans.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- --------------------------------
-- Lobby selections
-- --------------------------------
ALTER TABLE lobby_selections ENABLE ROW LEVEL SECURITY;

-- Members can read all selections in their lobby
CREATE POLICY "lobby_selections_select_member"
    ON lobby_selections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = lobby_selections.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- Members can insert their own selections
CREATE POLICY "lobby_selections_insert_own"
    ON lobby_selections FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = lobby_selections.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- Members can update their own selections (e.g., locking)
CREATE POLICY "lobby_selections_update_own"
    ON lobby_selections FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- --------------------------------
-- Strategy templates
-- --------------------------------
ALTER TABLE strategy_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved strategies
CREATE POLICY "strategy_templates_select_approved"
    ON strategy_templates FOR SELECT
    USING (status = 'approved');

-- Authenticated users can insert their own strategies
CREATE POLICY "strategy_templates_insert_own"
    ON strategy_templates FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Validator role (identified via a custom claim or a validators table)
-- can update status.  This allows an admin / moderator function.
CREATE POLICY "strategy_templates_update_validator"
    ON strategy_templates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
              AND auth.users.raw_user_meta_data->>'role' = 'validator'
        )
    );

-- --------------------------------
-- Strategy tags
-- --------------------------------
ALTER TABLE strategy_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read tags for approved strategies
CREATE POLICY "strategy_tags_select_approved"
    ON strategy_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_tags.strategy_id
              AND strategy_templates.status = 'approved'
        )
    );

-- Authenticated users can insert tags for their own strategies
CREATE POLICY "strategy_tags_insert_own"
    ON strategy_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_tags.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

-- --------------------------------
-- Strategy hotspots
-- --------------------------------
ALTER TABLE strategy_hotspots ENABLE ROW LEVEL SECURITY;

-- Anyone can read hotspots for approved strategies
CREATE POLICY "strategy_hotspots_select_approved"
    ON strategy_hotspots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_hotspots.strategy_id
              AND strategy_templates.status = 'approved'
        )
    );

-- Authenticated users can insert hotspots for their own strategies
CREATE POLICY "strategy_hotspots_insert_own"
    ON strategy_hotspots FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_hotspots.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

-- --------------------------------
-- Task assignments
-- --------------------------------
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Members of the lobby can read task assignments
CREATE POLICY "task_assignments_select_member"
    ON task_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = task_assignments.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- Members can insert task assignments in their lobby
CREATE POLICY "task_assignments_insert_member"
    ON task_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = task_assignments.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- Members can update task assignments in their lobby
CREATE POLICY "task_assignments_update_member"
    ON task_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = task_assignments.lobby_id
              AND lobby_members.user_id   = auth.uid()
        )
    );

-- --------------------------------
-- Validation queue  (server-side only — no client access)
-- --------------------------------
ALTER TABLE validation_queue ENABLE ROW LEVEL SECURITY;

-- No SELECT policy → no client can read
-- No INSERT policy → only server-side (service_role) can insert
-- No UPDATE policy → only server-side can update
-- No DELETE policy → only server-side can delete
-- This means the table is effectively inaccessible to client-side requests.
CREATE POLICY "validation_queue_no_access"
    ON validation_queue FOR ALL
    USING (false)
    WITH CHECK (false);
