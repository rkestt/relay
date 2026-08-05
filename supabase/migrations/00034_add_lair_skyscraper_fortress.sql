-- ============================================================
-- 00034_add_lair_skyscraper_fortress.sql — LWTS-19
-- Aggiunge le mappe mancanti Lair, Skyscraper e Fortress
-- con i loro siti reali (come 00033 per Calypso Casino).
-- ============================================================
-- Fonte siti:
--   Lair (Y8S3):       B Lab Support / Lab · 1F Bunks / Briefing
--                      · 2F Master Office / R6 Room
--   Skyscraper (rework): 1F Kitchen / BBQ · 1F Bedroom / Bathroom
--                      · 2F Tea Room / Karaoke · 2F Exhibition Room / Office
--   Fortress (Y3S4):   1F Hammam / Sitting Room · 1F Waiting Room / Cafeteria
--                      · 2F Bathroom / Commander's Office
--                      · 2F Dormitory / Games Room

BEGIN;

-- ── Lair ──────────────────────────────────────────────────────
INSERT INTO maps (id, name) VALUES
    ('a1313131-1313-1313-1313-131313131313', 'Lair')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sites (id, map_id, name, floor) VALUES
    ('d1313131-1313-1313-1313-131313131301', 'a1313131-1313-1313-1313-131313131313', 'Lab Support / Lab',       'Basement'),
    ('d1313131-1313-1313-1313-131313131302', 'a1313131-1313-1313-1313-131313131313', 'Bunks / Briefing',        '1F'),
    ('d1313131-1313-1313-1313-131313131303', 'a1313131-1313-1313-1313-131313131313', 'Master Office / R6 Room', '2F')
ON CONFLICT (id) DO NOTHING;

-- ── Skyscraper ────────────────────────────────────────────────
INSERT INTO maps (id, name) VALUES
    ('a1414141-1414-1414-1414-141414141414', 'Skyscraper')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sites (id, map_id, name, floor) VALUES
    ('d1414141-1414-1414-1414-141414141401', 'a1414141-1414-1414-1414-141414141414', 'Kitchen / BBQ',          '1F'),
    ('d1414141-1414-1414-1414-141414141402', 'a1414141-1414-1414-1414-141414141414', 'Bedroom / Bathroom',     '1F'),
    ('d1414141-1414-1414-1414-141414141403', 'a1414141-1414-1414-1414-141414141414', 'Tea Room / Karaoke',     '2F'),
    ('d1414141-1414-1414-1414-141414141404', 'a1414141-1414-1414-1414-141414141414', 'Exhibition Room / Office', '2F')
ON CONFLICT (id) DO NOTHING;

-- ── Fortress ──────────────────────────────────────────────────
INSERT INTO maps (id, name) VALUES
    ('a1515151-1515-1515-1515-151515151515', 'Fortress')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sites (id, map_id, name, floor) VALUES
    ('d1515151-1515-1515-1515-151515151501', 'a1515151-1515-1515-1515-151515151515', 'Hammam / Sitting Room',        '1F'),
    ('d1515151-1515-1515-1515-151515151502', 'a1515151-1515-1515-1515-151515151515', 'Waiting Room / Cafeteria',     '1F'),
    ('d1515151-1515-1515-1515-151515151503', 'a1515151-1515-1515-1515-151515151515', 'Bathroom / Commander''s Office', '2F'),
    ('d1515151-1515-1515-1515-151515151504', 'a1515151-1515-1515-1515-151515151515', 'Dormitory / Games Room',       '2F')
ON CONFLICT (id) DO NOTHING;

COMMIT;
