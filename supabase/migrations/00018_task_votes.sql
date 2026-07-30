-- ──────────────────────────────────────────────
-- Task votes — upvote / downvote system on task assignments
-- ──────────────────────────────────────────────

-- Create task_votes table
CREATE TABLE IF NOT EXISTS task_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_assignment_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (task_assignment_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_votes_assignment_id ON task_votes (task_assignment_id);
CREATE INDEX IF NOT EXISTS idx_task_votes_user_id ON task_votes (user_id);

-- Enable RLS
ALTER TABLE task_votes ENABLE ROW LEVEL SECURITY;

-- Policies (same pattern as task_assignments in 00002_rls_policies.sql)

-- Members of the lobby can read task votes
CREATE POLICY "task_votes_select_member"
    ON task_votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = (
                SELECT lobby_id FROM task_assignments WHERE id = task_votes.task_assignment_id
            )
              AND lobby_members.user_id = auth.uid()
        )
    );

-- Members of the lobby can insert votes
CREATE POLICY "task_votes_insert_member"
    ON task_votes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = (
                SELECT lobby_id FROM task_assignments WHERE id = task_votes.task_assignment_id
            )
              AND lobby_members.user_id = auth.uid()
        )
    );

-- Members of the lobby can update their own votes (e.g. change up → down)
CREATE POLICY "task_votes_update_member"
    ON task_votes FOR UPDATE
    USING (
        task_votes.user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = (
                SELECT lobby_id FROM task_assignments WHERE id = task_votes.task_assignment_id
            )
              AND lobby_members.user_id = auth.uid()
        )
    );

-- Members of the lobby can delete their own vote
CREATE POLICY "task_votes_delete_member"
    ON task_votes FOR DELETE
    USING (
        task_votes.user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM lobby_members
            WHERE lobby_members.lobby_id = (
                SELECT lobby_id FROM task_assignments WHERE id = task_votes.task_assignment_id
            )
              AND lobby_members.user_id = auth.uid()
        )
    );
