-- ============================================================
-- 00027_drop_validation_queue.sql — Remove Discord webhook moderation
-- Validation tokens were generated for Discord approve/reject links.
-- Discord webhook integration removed; moderation is in-app now.
-- ============================================================

DROP TABLE IF EXISTS validation_queue;

-- RLS policy + index on the table are dropped automatically with it.
