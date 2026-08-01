-- ============================================================
-- 00026_drop_maps_image_url.sql — LWTS-4: remove map images
-- Remove image_url from maps: images section dropped entirely
-- (UI chooser + submit hotspot editor removed; strategy images stay).
-- Idempotent; safe on fresh DBs (seed migrations 00002/00005/00013
-- run before this one and are already tracked in schema_migrations).
-- ============================================================

ALTER TABLE maps DROP COLUMN IF EXISTS image_url;
