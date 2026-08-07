-- ============================================================
-- 00028_pro_profiles.sql — LWTS-5: colonne Pro su profiles
-- Aggiunge is_pro, pro_expires_at, is_verified_contributor, contributed_count.
-- Idempotente (IF NOT EXISTS).
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified_contributor BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contributed_count INT NOT NULL DEFAULT 0;

-- Indice per lookup rapido pro_expires_at (gating server-side)
CREATE INDEX IF NOT EXISTS idx_profiles_pro_expires ON profiles (pro_expires_at) WHERE is_pro;
