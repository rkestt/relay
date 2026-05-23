-- ============================================================
-- 00011_fix_map_urls.sql — Fix map image URLs to .svg
-- ============================================================

UPDATE maps SET image_url = REPLACE(image_url, '.webp', '.svg');
