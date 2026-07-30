-- ============================================================
-- 00018_fix_strategy_operator_id.sql
-- Assign operator_id to seeded strategies that have NULL.
-- Each strategy is mapped to the operator whose role is most
-- central to the strategy's execution.
--
-- Idempotent: only updates rows WHERE operator_id IS NULL.
-- ============================================================

UPDATE strategy_templates
SET operator_id = (CASE id
    -- ----------------
    -- Attack strategies
    -- ----------------
    -- Oregon Kids Dorms – Hard Breach Take (Thatcher EMPs the wall)
    WHEN 'f0000000-0000-0000-0000-000000000001' THEN 'c0000000-0000-0000-0000-000000000003'

    -- Oregon Kitchen – Vertical Play (Sledge opens hatches from above)
    WHEN 'f0000000-0000-0000-0000-000000000002' THEN 'c0000000-0000-0000-0000-000000000004'

    -- Oregon Basement – Hard Breach & Flank Denial (Ace breaches Supply wall)
    WHEN 'f0000000-0000-0000-0000-000000000003' THEN 'c0000000-0000-0000-0000-00000000000c'

    -- Bank CEO – Default Plant from Open Area (Hibana opens CEO hatch)
    WHEN 'f0000000-0000-0000-0000-000000000004' THEN 'c0000000-0000-0000-0000-000000000008'

    -- Bank Basement – Vault Execute (Buck opens ceiling for vertical)
    WHEN 'f0000000-0000-0000-0000-000000000005' THEN 'c0000000-0000-0000-0000-000000000006'

    -- Bank Archives – Lobby Control (Ash rushes Lobby, clears server rack)
    WHEN 'f0000000-0000-0000-0000-000000000006' THEN 'c0000000-0000-0000-0000-000000000002'

    -- Clubhouse Bedroom – Vertical Take from Gym (Buck opens floor from rafters)
    WHEN 'f0000000-0000-0000-0000-000000000007' THEN 'c0000000-0000-0000-0000-000000000006'

    -- Clubhouse Basement – CCTV & Cash Execute (Hibana opens CCTV wall)
    WHEN 'f0000000-0000-0000-0000-000000000008' THEN 'c0000000-0000-0000-0000-000000000008'

    -- Clubhouse Bar – Stage Take (Zofia rushes Bar with stuns)
    WHEN 'f0000000-0000-0000-0000-000000000009' THEN 'c0000000-0000-0000-0000-000000000007'

    -- Kafe Red Stairs & Reading Execute (Thermite breaches Reading wall)
    WHEN 'f0000000-0000-0000-0000-00000000000a' THEN 'c0000000-0000-0000-0000-000000000001'

    -- Kafe Fireplace Default Plant (Ace opens Fireplace wall from Piano)
    WHEN 'f0000000-0000-0000-0000-00000000000b' THEN 'c0000000-0000-0000-0000-00000000000c'

    -- Kafe Bakery Rush (Ash double-rushes Bakery from main entrance)
    WHEN 'f0000000-0000-0000-0000-00000000000c' THEN 'c0000000-0000-0000-0000-000000000002'

    -- Border Armory – Default Plant from CCTV (Thatcher EMPs Armory wall)
    WHEN 'f0000000-0000-0000-0000-00000000000d' THEN 'c0000000-0000-0000-0000-000000000003'

    -- Border Tellers – Customs Execute (Jackal tracks roamers; Hibana opens)
    WHEN 'f0000000-0000-0000-0000-00000000000e' THEN 'c0000000-0000-0000-0000-000000000009'

    -- Border Customs – Vertical & Flank Denial (Nomad holds East stairs flank)
    WHEN 'f0000000-0000-0000-0000-00000000000f' THEN 'c0000000-0000-0000-0000-00000000000b'

    -- Oregon Tower – Attic & Bedroom Execute (Buck vertical from attic roof)
    WHEN 'f0000000-0000-0000-0000-000000000010' THEN 'c0000000-0000-0000-0000-000000000006'

    -- Bank Open Area – Avast Ye Execute (Sledge opens floor for vertical)
    WHEN 'f0000000-0000-0000-0000-000000000011' THEN 'c0000000-0000-0000-0000-000000000004'

    -- Clubhouse Church – Arsenal Breach (Iana drones Church corner for intel)
    WHEN 'f0000000-0000-0000-0000-000000000012' THEN 'c0000000-0000-0000-0000-00000000000a'

    -- Kafe Cigar – Museum Default Plant (Thatcher disables defender gadgets)
    WHEN 'f0000000-0000-0000-0000-000000000013' THEN 'c0000000-0000-0000-0000-000000000003'

    -- Border Basement – Ventilation Execute (Thermite opens Ventilation wall)
    WHEN 'f0000000-0000-0000-0000-000000000014' THEN 'c0000000-0000-0000-0000-000000000001'

    -- Oregon Thermite + Thatcher Default Plant (Thermite breaches main wall)
    WHEN 'f0000000-0000-0000-0000-00000000001a' THEN 'c0000000-0000-0000-0000-000000000001'

    -- ----------------
    -- Defense strategies
    -- ----------------
    -- Oregon Kitchen – Mira & Roamer Setup (Mira window on Kitchen freezer wall)
    WHEN 'f0000000-0000-0000-0000-000000000015' THEN 'd0000000-0000-0000-0000-000000000007'

    -- Bank CEO – Azami & Mira Hold (Azami places Kiba barriers on CEO windows)
    WHEN 'f0000000-0000-0000-0000-000000000016' THEN 'd0000000-0000-0000-0000-00000000000c'

    -- Clubhouse Basement – Bandit Trick & Smoke Hold (Bandit tricks CCTV wall)
    WHEN 'f0000000-0000-0000-0000-000000000017' THEN 'd0000000-0000-0000-0000-000000000005'

    -- Kafe 3F – Mira & Maestro Hold (Maestro turret covers default plant)
    WHEN 'f0000000-0000-0000-0000-000000000018' THEN 'd0000000-0000-0000-0000-000000000009'

    -- Border Armory – Smoke & Azami Hold (Smoke holds Archives with canisters)
    WHEN 'f0000000-0000-0000-0000-000000000019' THEN 'd0000000-0000-0000-0000-000000000002'
END)::uuid
WHERE operator_id IS NULL
  AND id IN (
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000003',
    'f0000000-0000-0000-0000-000000000004',
    'f0000000-0000-0000-0000-000000000005',
    'f0000000-0000-0000-0000-000000000006',
    'f0000000-0000-0000-0000-000000000007',
    'f0000000-0000-0000-0000-000000000008',
    'f0000000-0000-0000-0000-000000000009',
    'f0000000-0000-0000-0000-00000000000a',
    'f0000000-0000-0000-0000-00000000000b',
    'f0000000-0000-0000-0000-00000000000c',
    'f0000000-0000-0000-0000-00000000000d',
    'f0000000-0000-0000-0000-00000000000e',
    'f0000000-0000-0000-0000-00000000000f',
    'f0000000-0000-0000-0000-000000000010',
    'f0000000-0000-0000-0000-000000000011',
    'f0000000-0000-0000-0000-000000000012',
    'f0000000-0000-0000-0000-000000000013',
    'f0000000-0000-0000-0000-000000000014',
    'f0000000-0000-0000-0000-000000000015',
    'f0000000-0000-0000-0000-000000000016',
    'f0000000-0000-0000-0000-000000000017',
    'f0000000-0000-0000-0000-000000000018',
    'f0000000-0000-0000-0000-000000000019',
    'f0000000-0000-0000-0000-00000000001a'
  );
