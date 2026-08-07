-- ============================================================
-- 00030_license_keys.sql — LWTS-5: tabella licenze Pro
-- license_keys: registra le licenze/abbonamenti per utente (provider, key, stato).
-- RLS: owner-only.
-- ============================================================

CREATE TABLE IF NOT EXISTS license_keys (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider   TEXT NOT NULL DEFAULT 'lemon-squeezy',
  key        TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_license_keys_user ON license_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_status ON license_keys (status);
-- Unique per key (usato da upsert onConflict nel webhook)
CREATE UNIQUE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys (key);

ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;

-- Owner: solo le proprie licenze
DROP POLICY IF EXISTS "license_keys_select_own" ON license_keys;
CREATE POLICY "license_keys_select_own"
  ON license_keys FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "license_keys_insert_own" ON license_keys;
CREATE POLICY "license_keys_insert_own"
  ON license_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "license_keys_delete_own" ON license_keys;
CREATE POLICY "license_keys_delete_own"
  ON license_keys FOR DELETE
  USING (auth.uid() = user_id);
