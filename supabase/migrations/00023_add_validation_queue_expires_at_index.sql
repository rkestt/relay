-- ============================================================
-- 00023_add_validation_queue_expires_at_index.sql
-- Add index on validation_queue.expires_at for cleanup queries
-- (DELETE WHERE expires_at < now()).
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_validation_queue_expires_at ON validation_queue (expires_at);
