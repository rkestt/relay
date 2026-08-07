-- ============================================================
-- 00036_strategy_owner_select.sql
-- LWTS-20: my-submissions / own visibility.
-- Additive ONLY — never replaces existing select_approved policies.
-- Gives an author visibility of their OWN strategies (any status)
-- across templates/tags/images/operators, plus UPDATE/DELETE parity
-- on tags+operators (gap vs strategy_images from 00012, G5).
-- Also adds moderation audit columns (rejected_reason, moderated_by,
-- moderated_at) used by the in-app moderation flow.
-- ============================================================

-- --------------------------------
-- 1. Audit columns on strategy_templates
-- --------------------------------
ALTER TABLE strategy_templates
    ADD COLUMN IF NOT EXISTS rejected_reason TEXT NULL,
    ADD COLUMN IF NOT EXISTS moderated_by    UUID NULL,
    ADD COLUMN IF NOT EXISTS moderated_at    TIMESTAMPTZ NULL;

-- --------------------------------
-- 2. strategy_templates: owner own-select (additive)
-- --------------------------------
-- Authors can read their own strategies in ANY status (pending/approved/rejected).
-- This enables "my submissions" without exposing others' pending work.
CREATE POLICY "strategy_templates_select_own"
    ON strategy_templates FOR SELECT
    USING (created_by = auth.uid());

-- --------------------------------
-- 3. strategy_tags: owner select + update/delete parity
-- --------------------------------
CREATE POLICY "strategy_tags_select_own"
    ON strategy_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_tags.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

CREATE POLICY "strategy_tags_update_own"
    ON strategy_tags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_tags.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

CREATE POLICY "strategy_tags_delete_own"
    ON strategy_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_tags.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

-- --------------------------------
-- 4. strategy_images: owner select (update/delete own already exist, 00012)
-- --------------------------------
CREATE POLICY "strategy_images_select_own"
    ON strategy_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_images.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

-- --------------------------------
-- 5. strategy_operators: owner select + update/delete parity
-- --------------------------------
CREATE POLICY "strategy_operators_select_own"
    ON strategy_operators FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_operators.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

CREATE POLICY "strategy_operators_update_own"
    ON strategy_operators FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_operators.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

CREATE POLICY "strategy_operators_delete_own"
    ON strategy_operators FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_operators.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );
