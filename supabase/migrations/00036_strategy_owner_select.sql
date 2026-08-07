-- ============================================================
-- 00036_strategy_owner_select.sql  (idempotent revision)
-- LWTS-20: my-submissions / own visibility + moderation audit cols.
-- Additive ONLY — never touches existing select_approved policies.
-- Every CREATE POLICY is guarded by DROP POLICY IF EXISTS on the
-- SAME policy, so the file can be re-run safely at any time
-- (fixes 42710 "policy already exists" on a partial prior apply).
-- ============================================================

-- --------------------------------
-- 1. Audit columns on strategy_templates (idempotent)
-- --------------------------------
ALTER TABLE strategy_templates
    ADD COLUMN IF NOT EXISTS rejected_reason TEXT NULL,
    ADD COLUMN IF NOT EXISTS moderated_by    UUID NULL,
    ADD COLUMN IF NOT EXISTS moderated_at    TIMESTAMPTZ NULL;

-- --------------------------------
-- 2. strategy_templates: owner own-select
-- --------------------------------
DROP POLICY IF EXISTS "strategy_templates_select_own" ON strategy_templates;
CREATE POLICY "strategy_templates_select_own"
    ON strategy_templates FOR SELECT
    USING (created_by = auth.uid());

-- --------------------------------
-- 3. strategy_tags: owner select + update/delete parity
-- --------------------------------
DROP POLICY IF EXISTS "strategy_tags_select_own" ON strategy_tags;
CREATE POLICY "strategy_tags_select_own"
    ON strategy_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_tags.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "strategy_tags_update_own" ON strategy_tags;
CREATE POLICY "strategy_tags_update_own"
    ON strategy_tags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_tags.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

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

-- --------------------------------
-- 4. strategy_images: owner select (update/delete own already exist, 00012)
-- --------------------------------
DROP POLICY IF EXISTS "strategy_images_select_own" ON strategy_images;
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
DROP POLICY IF EXISTS "strategy_operators_select_own" ON strategy_operators;
CREATE POLICY "strategy_operators_select_own"
    ON strategy_operators FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_operators.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "strategy_operators_update_own" ON strategy_operators;
CREATE POLICY "strategy_operators_update_own"
    ON strategy_operators FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_operators.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "strategy_operators_delete_own" ON strategy_operators;
CREATE POLICY "strategy_operators_delete_own"
    ON strategy_operators FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_operators.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );