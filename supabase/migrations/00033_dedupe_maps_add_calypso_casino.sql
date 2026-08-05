-- ============================================================
-- 00033_dedupe_maps_add_calypso_casino.sql
-- Fix mappe duplicate (submit strategie + lobby picker) e
-- aggiunge la mappa mancante Calypso Casino (Y11S2).
-- ============================================================
-- Root cause: doppio seed system in conflitto (vedi 00029).
--   00005_seed_reference + 00006_seed_strategies (legacy):
--     maps a0000000-* (Bank, Clubhouse, Kafe, Border) + siti b0000000-*
--   00002_r6s_seed_data + 00010_r6s_sites (canonici):
--     maps a1111*/a2222*/a4444*/a8888* + siti d*-*
-- 00029 ha già ripulito Oregon legacy; qui ripuliamo le altre 4.
--
-- Fix:
--   1. Rimappa le 20 strategie legacy (f0000000-*) sulle mappe/siti
--      canonici corrispondenti (stesso criterio di 00029).
--   2. Elimina siti legacy b0000000-* (non più referenziati).
--   3. Elimina mappe legacy a0000000-* restanti.
--   4. Inserisce la mappa Calypso Casino (Y11S2, "Operation System
--      Override") con i suoi 4 siti reali:
--        CCTV / Vault Checkpoint (B), Bar / Betting (1F),
--        Blackjack / Poker (1F), Cigar Room / Pool (2F)

BEGIN;

-- ── 1. Rimappa strategie legacy -> mappe/siti canonici ──────────

-- Bank legacy -> Bank canonica (a1111...1111)
UPDATE strategy_templates SET
    map_id  = 'a1111111-1111-1111-1111-111111111111',
    site_id = 'd1111111-1111-1111-1111-111111111111'   -- CEO Office / Archives (Basement)
WHERE map_id = 'a0000000-0000-0000-0000-000000000002'
  AND site_id = 'b0000000-0000-0000-0000-000000000201';  -- CEO / Office (f...004, f...016)

UPDATE strategy_templates SET
    map_id  = 'a1111111-1111-1111-1111-111111111111',
    site_id = 'd1111111-1111-1111-1111-111111111112'   -- Staff Room / Open Area (1F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000002'
  AND site_id = 'b0000000-0000-0000-0000-000000000202';  -- Archives / Lobby (f...006)

UPDATE strategy_templates SET
    map_id  = 'a1111111-1111-1111-1111-111111111111',
    site_id = 'd1111111-1111-1111-1111-111111111111'   -- CEO Office / Archives (Basement)
WHERE map_id = 'a0000000-0000-0000-0000-000000000002'
  AND site_id = 'b0000000-0000-0000-0000-000000000203';  -- Vault / Staff (f...005)

UPDATE strategy_templates SET
    map_id  = 'a1111111-1111-1111-1111-111111111111',
    site_id = 'd1111111-1111-1111-1111-111111111112'   -- Staff Room / Open Area (1F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000002'
  AND site_id = 'b0000000-0000-0000-0000-000000000204';  -- Open Area / Tellers (f...011)

-- Clubhouse legacy -> Clubhouse canonica (a4444...4444)
UPDATE strategy_templates SET
    map_id  = 'a4444444-4444-4444-4444-444444444444',
    site_id = 'd4444444-4444-4444-4444-444444444444'   -- Gym / Master Bedroom (2F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000003'
  AND site_id = 'b0000000-0000-0000-0000-000000000301';  -- Bedroom / Gym (f...007)

UPDATE strategy_templates SET
    map_id  = 'a4444444-4444-4444-4444-444444444444',
    site_id = 'd4444444-4444-4444-4444-444444444443'   -- Bar / Stock Room (1F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000003'
  AND site_id = 'b0000000-0000-0000-0000-000000000302';  -- Bar / Stage (f...009)

UPDATE strategy_templates SET
    map_id  = 'a4444444-4444-4444-4444-444444444444',
    site_id = 'd4444444-4444-4444-4444-444444444442'   -- Cash Room / Storage (Basement)
WHERE map_id = 'a0000000-0000-0000-0000-000000000003'
  AND site_id = 'b0000000-0000-0000-0000-000000000303';  -- Cash / CCTV (f...008, f...017)

UPDATE strategy_templates SET
    map_id  = 'a4444444-4444-4444-4444-444444444444',
    site_id = 'd4444444-4444-4444-4444-444444444441'   -- Church / Arsenal (Basement)
WHERE map_id = 'a0000000-0000-0000-0000-000000000003'
  AND site_id = 'b0000000-0000-0000-0000-000000000304';  -- Church / Arsenal (f...012)

-- Kafe legacy -> Kafe canonica (a8888...8888)
UPDATE strategy_templates SET
    map_id  = 'a8888888-8888-8888-8888-888888888888',
    site_id = 'd8888888-8888-8888-8888-888888888883'   -- Cocktail Bar / Lounge (3F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000004'
  AND site_id = 'b0000000-0000-0000-0000-000000000401';  -- Red Stairs / Reading (f...00a, f...018)

UPDATE strategy_templates SET
    map_id  = 'a8888888-8888-8888-8888-888888888888',
    site_id = 'd8888888-8888-8888-8888-888888888882'   -- Fireplace / Cigar Lounge (2F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000004'
  AND site_id = 'b0000000-0000-0000-0000-000000000402';  -- Fireplace / Mining (f...00b)

UPDATE strategy_templates SET
    map_id  = 'a8888888-8888-8888-8888-888888888888',
    site_id = 'd8888888-8888-8888-8888-888888888881'   -- Kitchen / Reading Room (1F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000004'
  AND site_id = 'b0000000-0000-0000-0000-000000000403';  -- Kitchen / Bakery (f...00c)

UPDATE strategy_templates SET
    map_id  = 'a8888888-8888-8888-8888-888888888888',
    site_id = 'd8888888-8888-8888-8888-888888888882'   -- Fireplace / Cigar Lounge (2F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000004'
  AND site_id = 'b0000000-0000-0000-0000-000000000404';  -- Cigar / Museum (f...013)

-- Border legacy -> Border canonica (a2222...2222)
UPDATE strategy_templates SET
    map_id  = 'a2222222-2222-2222-2222-222222222222',
    site_id = 'd2222222-2222-2222-2222-222222222223'   -- Armory / Archives (2F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000005'
  AND site_id = 'b0000000-0000-0000-0000-000000000501';  -- Armory / Archives (f...00d, f...019)

UPDATE strategy_templates SET
    map_id  = 'a2222222-2222-2222-2222-222222222222',
    site_id = 'd2222222-2222-2222-2222-222222222221'   -- Customs / Workshop (1F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000005'
  AND site_id = 'b0000000-0000-0000-0000-000000000502';  -- Bathroom / Tellers (f...00e)

UPDATE strategy_templates SET
    map_id  = 'a2222222-2222-2222-2222-222222222222',
    site_id = 'd2222222-2222-2222-2222-222222222221'   -- Customs / Workshop (1F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000005'
  AND site_id = 'b0000000-0000-0000-0000-000000000503';  -- Customs / Inspection (f...00f)

UPDATE strategy_templates SET
    map_id  = 'a2222222-2222-2222-2222-222222222222',
    site_id = 'd2222222-2222-2222-2222-222222222222'   -- Ventilation Room / Supply Room (1F)
WHERE map_id = 'a0000000-0000-0000-0000-000000000005'
  AND site_id = 'b0000000-0000-0000-0000-000000000504';  -- Ventilation / Supply (f...014)

-- Verifica: nessuna strategia legacy rimasta (deve restare 0)
DO $$
DECLARE orphan INT;
BEGIN
    SELECT count(*) INTO orphan FROM strategy_templates
    WHERE map_id IN (
        'a0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000005'
    );
    IF orphan > 0 THEN
        RAISE EXCEPTION '00033: % strategie ancora su mappe legacy', orphan;
    END IF;
END $$;

-- ── 2. Elimina siti legacy (non più referenziati) ───────────────
DELETE FROM sites
WHERE map_id IN (
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000005'
);

-- ── 3. Elimina mappe legacy ─────────────────────────────────────
DELETE FROM maps
WHERE id IN (
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000005'
);

-- ── 4. Aggiunge Calypso Casino (Y11S2) + siti reali ─────────────
INSERT INTO maps (id, name) VALUES
    ('a1212121-1212-1212-1212-121212121212', 'Calypso Casino')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sites (id, map_id, name, floor) VALUES
    ('d1212121-1212-1212-1212-121212121201', 'a1212121-1212-1212-1212-121212121212', 'CCTV / Vault Checkpoint', 'Basement'),
    ('d1212121-1212-1212-1212-121212121202', 'a1212121-1212-1212-1212-121212121212', 'Bar / Betting',          '1F'),
    ('d1212121-1212-1212-1212-121212121203', 'a1212121-1212-1212-1212-121212121212', 'Blackjack / Poker',      '1F'),
    ('d1212121-1212-1212-1212-121212121204', 'a1212121-1212-1212-1212-121212121212', 'Cigar Room / Pool',      '2F')
ON CONFLICT (id) DO NOTHING;

COMMIT;
