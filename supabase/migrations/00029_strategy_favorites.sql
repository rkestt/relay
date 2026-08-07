-- ============================================================
-- 00029_strategy_favorites.sql — LWTS-5: tabella favoriti
-- strategy_favorites: un utente può salvare strategie come favorite (playbook).
-- RLS: owner-only (utente vede/modifica solo i propri favoriti).
-- ============================================================

CREATE TABLE IF NOT EXISTS strategy_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES strategy_templates(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, strategy_id)
);

CREATE INDEX IF NOT EXISTS idx_strategy_favorites_user ON strategy_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_favorites_strategy ON strategy_favorites (strategy_id);

ALTER TABLE strategy_favorites ENABLE ROW LEVEL SECURITY;

-- Owner: solo i propri favoriti
DROP POLICY IF EXISTS "favorites_select_own" ON strategy_favorites;
CREATE POLICY "favorites_select_own"
  ON strategy_favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON strategy_favorites;
CREATE POLICY "favorites_insert_own"
  ON strategy_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON strategy_favorites;
CREATE POLICY "favorites_delete_own"
  ON strategy_favorites FOR DELETE
  USING (auth.uid() = user_id);
