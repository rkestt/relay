-- ============================================================
-- 00029_fix_duplicate_oregon_sites.sql — LWTS-13: siti Oregon errati
-- ============================================================
-- Root cause: doppio seed system in conflitto.
--   00005_seed_reference + 00006_seed_strategies (legacy):
--     maps a0000000-*, sites b0000000-* — siti inventati/errati
--     (es. "Tower / Bedroom" su Oregon non esiste in-game, floor "B")
--   00002_r6s_seed_data + 00010_r6s_sites (canonici):
--     maps a1111111-*, sites d1111111-* — siti reali Y11S1
-- Risultato: dropdown mappe mostra Oregon ×2; scegliendo la mappa
-- legacy si vedono siti inesistenti.
--
-- Fix: rimappa le strategie Oregon legacy (f0000000-*) sulla mappa
-- canonica Oregon + siti canonici, elimina siti/mappa legacy,
-- corregge nome sito "Kids Room / Dorms" -> "Kids Dorms / Dorms Main Hall".

BEGIN;

-- 1. Rimappa strategie Oregon legacy -> mappa canonica Oregon + siti canonici
UPDATE strategy_templates SET
    map_id  = 'a1111111-1111-1111-1111-111111111112',
    site_id = 'd1111111-1111-1111-1111-111111111123'   -- Kids Dorms / Dorms Main Hall
WHERE map_id = 'a0000000-0000-0000-0000-000000000001'
  AND site_id = 'b0000000-0000-0000-0000-000000000101';  -- Kids / Dorms (f...01, f...1a)

UPDATE strategy_templates SET
    map_id  = 'a1111111-1111-1111-1111-111111111112',
    site_id = 'd1111111-1111-1111-1111-111111111122'   -- Kitchen / Dining (1F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000001'
  AND site_id = 'b0000000-0000-0000-0000-000000000102';  -- Kitchen / Dining (f...02, f...15)

UPDATE strategy_templates SET
    map_id  = 'a1111111-1111-1111-1111-111111111112',
    site_id = 'd1111111-1111-1111-1111-111111111121'   -- Laundry / Supply (Basement)
WHERE map_id = 'a0000000-0000-0000-0000-000000000001'
  AND site_id = 'b0000000-0000-0000-0000-000000000103';  -- Laundry / Supply (f...03)

UPDATE strategy_templates SET
    map_id  = 'a1111111-1111-1111-1111-111111111112',
    site_id = 'd1111111-1111-1111-1111-111111111124'   -- Master Bedroom / Study (2F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000001'
  AND site_id = 'b0000000-0000-0000-0000-000000000104';  -- Tower / Bedroom (f...10, inesistente in-game)

-- 2. Corregge nome sito canonico Oregon (2F): nome reale in-game
UPDATE sites SET name = 'Kids Dorms / Dorms Main Hall'
WHERE id = 'd1111111-1111-1111-1111-111111111123';

-- 3. Elimina siti Oregon legacy (non più referenziati)
DELETE FROM sites
WHERE map_id = 'a0000000-0000-0000-0000-000000000001';

-- 4. Elimina mappa Oregon legacy
DELETE FROM maps
WHERE id = 'a0000000-0000-0000-0000-000000000001';

COMMIT;
