-- ============================================================
-- 00035_add_theme_park.sql — LWTS-19 (follow-up)
-- Aggiunge la mappa mancante Theme Park con i suoi siti reali.
-- ============================================================
-- Fonte siti (rework Y6S3):
--   1F Armory / Throne Room · 1F Lab / Storage
--   2F Initiation Room / Office · 2F Bunk / Day Care

BEGIN;

INSERT INTO maps (id, name) VALUES
    ('a1986198-1986-1986-1986-198619861986', 'Theme Park')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sites (id, map_id, name, floor) VALUES
    ('d1986198-1986-1986-1986-198619861001', 'a1986198-1986-1986-1986-198619861986', 'Armory / Throne Room',     '1F'),
    ('d1986198-1986-1986-1986-198619861002', 'a1986198-1986-1986-1986-198619861986', 'Lab / Storage',           '1F'),
    ('d1986198-1986-1986-1986-198619861003', 'a1986198-1986-1986-1986-198619861986', 'Initiation Room / Office', '2F'),
    ('d1986198-1986-1986-1986-198619861004', 'a1986198-1986-1986-1986-198619861986', 'Bunk / Day Care',         '2F')
ON CONFLICT (id) DO NOTHING;

COMMIT;