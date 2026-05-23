-- ============================================================
-- 00010_strategy_images.sql — Multi-image support for strategies
-- Adds strategy_images table and image_id FK to strategy_hotspots.
-- Backward compatible: existing hotspots have image_id = NULL (primary image).
-- ============================================================

-- --------------------------------
-- 1. Create strategy_images table
-- --------------------------------
CREATE TABLE strategy_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id     UUID NOT NULL REFERENCES strategy_templates(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    caption         TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_strategy_images_strategy ON strategy_images(strategy_id);
CREATE INDEX idx_strategy_images_sort    ON strategy_images(strategy_id, sort_order);

-- --------------------------------
-- 2. Add image_id FK to strategy_hotspots
-- --------------------------------
ALTER TABLE strategy_hotspots
    ADD COLUMN image_id UUID REFERENCES strategy_images(id) ON DELETE SET NULL;

CREATE INDEX idx_strategy_hotspots_image ON strategy_hotspots(image_id);

-- --------------------------------
-- 3. RLS policies for strategy_images
-- --------------------------------
ALTER TABLE strategy_images ENABLE ROW LEVEL SECURITY;

-- Anyone can read images belonging to approved strategies
CREATE POLICY "strategy_images_select_approved"
    ON strategy_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_images.strategy_id
              AND strategy_templates.status = 'approved'
        )
    );

-- Authenticated users can insert images for their own strategies
CREATE POLICY "strategy_images_insert_own"
    ON strategy_images FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_images.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

-- Authenticated users can update images on their own strategies
CREATE POLICY "strategy_images_update_own"
    ON strategy_images FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_images.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );

-- Authenticated users can delete images from their own strategies
CREATE POLICY "strategy_images_delete_own"
    ON strategy_images FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM strategy_templates
            WHERE strategy_templates.id = strategy_images.strategy_id
              AND strategy_templates.created_by = auth.uid()
        )
    );
