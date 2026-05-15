-- ============================================================
-- 00004_seed_strategies.sql — Approved strategy templates
-- 25 realistic strategies across maps with tags & hotspots.
-- All use the reference UUIDs from 00003_seed_reference.sql.
-- All status = 'approved' so they are visible via RLS.
-- ============================================================

-- --------------------------------
-- OREGON — Kids / Dorms (2F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000101',
     'Oregon Kids Dorms – Hard Breach Take',
     'Standard attack on Kids/Dorms. Thatcher EMPs the wall between Kids and Dorms, Thermite opens it. Buck clears the rafters from below. Smoke plants default.',
     '/images/strategies/oregon_kids_breach.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'Plant'),
    ('g0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'Oregon');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 50.00, 30.00, 'Thatcher EMP — outside wall'),
    ('h0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 50.00, 45.00, 'Thermite breach — main wall'),
    ('h0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 30.00, 70.00, 'Buck soft-destroys floor from below');

-- --------------------------------
-- OREGON — Kitchen / Dining (1F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000102',
     'Oregon Kitchen – Vertical Play',
     'Sledge opens hatches and floor above Kitchen. Zofia clears freezer corner. Nomad holds flank from Shower hallway. Plant in default box.',
     '/images/strategies/oregon_kitchen_vertical.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000002', 'Vertical'),
    ('g0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 'Plant'),
    ('g0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002', 'Oregon');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000002', 40.00, 25.00, 'Sledge opens floor hatches above'),
    ('h0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 65.00, 50.00, 'Zofia clears freezer with stuns'),
    ('h0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002', 20.00, 80.00, 'Nomad airjab — Shower hallway');

-- --------------------------------
-- OREGON — Laundry / Supply (B)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000103',
     'Oregon Basement – Hard Breach & Flank Denial',
     'Ace breaches the Supply Room wall from Construction. Iana drones out Laundry. Gridlock covers Construction stairs. Plant default.',
     '/images/strategies/oregon_basement_breach.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000003', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000003', 'Flank Denial'),
    ('g0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000003', 'Oregon');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000003', 60.00, 30.00, 'Ace breach — Supply wall'),
    ('h0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000003', 30.00, 50.00, 'Iana drone — Laundry corner'),
    ('h0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000003', 80.00, 70.00, 'Gridlock trax — Construction stairs');

-- --------------------------------
-- BANK — CEO / Office (3F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000004',
     'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000201',
     'Bank CEO – Default Plant from Open Area',
     'Hibana opens the CEO hatch and a couple of reinforced walls. Zofia clears cubby and open area. Jackal tracks roamers. Plant below hatch.',
     '/images/strategies/bank_ceo_plant.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-00000000000a', 'f0000000-0000-0000-0000-000000000004', 'Hard Breach'),
    ('g0000000-0000-0000-0000-00000000000b', 'f0000000-0000-0000-0000-000000000004', 'Roamer Clear'),
    ('g0000000-0000-0000-0000-00000000000c', 'f0000000-0000-0000-0000-000000000004', 'Bank');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-00000000000a', 'f0000000-0000-0000-0000-000000000004', 50.00, 20.00, 'Hibana opens CEO hatch'),
    ('h0000000-0000-0000-0000-00000000000b', 'f0000000-0000-0000-0000-000000000004', 70.00, 50.00, 'Zofia — cubby clear with impacts'),
    ('h0000000-0000-0000-0000-00000000000c', 'f0000000-0000-0000-0000-000000000004', 25.00, 75.00, 'Jackal tracks roamers in stairs');

-- --------------------------------
-- BANK — Vault / Staff (B)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000005',
     'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000203',
     'Bank Basement – Vault Execute',
     'Thatcher and Thermite open the Vault wall. Buck opens the ceiling for vertical play. Nomad holds Blue Stairs. Plant in default.',
     '/images/strategies/bank_vault_execute.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-00000000000d', 'f0000000-0000-0000-0000-000000000005', 'Hard Breach'),
    ('g0000000-0000-0000-0000-00000000000e', 'f0000000-0000-0000-0000-000000000005', 'Vertical'),
    ('g0000000-0000-0000-0000-00000000000f', 'f0000000-0000-0000-0000-000000000005', 'Bank');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-00000000000d', 'f0000000-0000-0000-0000-000000000005', 50.00, 25.00, 'Thatcher EMP → Thermite breach — Vault wall'),
    ('h0000000-0000-0000-0000-00000000000e', 'f0000000-0000-0000-0000-000000000005', 30.00, 55.00, 'Buck shoots ceiling for Staff vert'),
    ('h0000000-0000-0000-0000-00000000000f', 'f0000000-0000-0000-0000-000000000005', 80.00, 80.00, 'Nomad airjab — Blue Stairs flank');

-- --------------------------------
-- BANK — Archives / Lobby (1F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000006',
     'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000202',
     'Bank Archives – Lobby Control',
     'Aggressive take of Archives via Lobby. Ash rushes Lobby, clears server rack. Iana provides intel on Archives. Sledge opens floor from 2F.',
     '/images/strategies/bank_archives_lobby.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000006', 'Entry Fragger'),
    ('g0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000006', 'Vertical'),
    ('g0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000006', 'Bank');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000006', 75.00, 30.00, 'Ash breaching Lobby windows'),
    ('h0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000006', 40.00, 55.00, 'Iana drone — Archives corner'),
    ('h0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000006', 60.00, 15.00, 'Sledge — 2F floor destruction above Archives');

-- --------------------------------
-- CLUBHOUSE — Bedroom / Gym (2F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000007',
     'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000301',
     'Clubhouse Bedroom – Vertical Take from Gym',
     'Ace opens Gym wall from Bedroom side. Buck opens floor from 3F rafters. Finka boost for entry. Plant default bedroom.',
     '/images/strategies/clubhouse_bedroom_vertical.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000007', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000007', 'Vertical'),
    ('g0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000007', 'Clubhouse');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000007', 55.00, 35.00, 'Ace breach — Gym connecting wall'),
    ('h0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000007', 30.00, 60.00, 'Buck — vertical play from 3F rafters'),
    ('h0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000007', 50.00, 85.00, 'Plant default — behind cover in Bedroom');

-- --------------------------------
-- CLUBHOUSE — Cash / CCTV (B)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000008',
     'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000303',
     'Clubhouse Basement – CCTV & Cash Execute',
     'Hibana opens CCTV wall. Thatcher disables Bandit batteries. Sledge opens floor above Cash. Nomad holds Construction stairs. Plant default Cash.',
     '/images/strategies/clubhouse_cash_execute.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000008', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000008', 'Flank Denial'),
    ('g0000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000008', 'Clubhouse');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000008', 50.00, 20.00, 'Thatcher EMP → Hibana breach — CCTV wall'),
    ('h0000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000008', 35.00, 55.00, 'Sledge opens floor above Cash'),
    ('h0000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000008', 80.00, 80.00, 'Nomad airjab — Construction stairs flank');

-- --------------------------------
-- CLUBHOUSE — Bar / Stage (1F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000009',
     'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000302',
     'Clubhouse Bar – Stage Take',
     'Zofia rushes Bar with stuns. Jackal tracks roamers in Church. Sledge opens floor above Stage. Plant behind bar.',
     '/images/strategies/clubhouse_bar_stage.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000009', 'Entry Fragger'),
    ('g0000000-0000-0000-0000-00000000001a', 'f0000000-0000-0000-0000-000000000009', 'Roamer Clear'),
    ('g0000000-0000-0000-0000-00000000001b', 'f0000000-0000-0000-0000-000000000009', 'Clubhouse');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000009', 65.00, 30.00, 'Zofia — Bar entry with stuns'),
    ('h0000000-0000-0000-0000-00000000001a', 'f0000000-0000-0000-0000-000000000009', 30.00, 50.00, 'Jackal tracking — Church hallway'),
    ('h0000000-0000-0000-0000-00000000001b', 'f0000000-0000-0000-0000-000000000009', 70.00, 75.00, 'Sledge vertical — floor above Stage');

-- --------------------------------
-- KAFE — Red Stairs / Reading (3F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-00000000000a',
     'a0000000-0000-0000-0000-000000000004',
     'b0000000-0000-0000-0000-000000000401',
     'Kafe 3F – Red Stairs & Reading Execute',
     'Thermite breaches Reading Room wall from Red Stairs side. Buck plays vertical from 3F rafters. Iana drones out Cocktail. Plant default Reading.',
     '/images/strategies/kafe_redstairs_execute.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-00000000001c', 'f0000000-0000-0000-0000-00000000000a', 'Hard Breach'),
    ('g0000000-0000-0000-0000-00000000001d', 'f0000000-0000-0000-0000-00000000000a', 'Vertical'),
    ('g0000000-0000-0000-0000-00000000001e', 'f0000000-0000-0000-0000-00000000000a', 'Kafe');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-00000000001c', 'f0000000-0000-0000-0000-00000000000a', 45.00, 20.00, 'Thermite breach — Reading wall from Red Stairs'),
    ('h0000000-0000-0000-0000-00000000001d', 'f0000000-0000-0000-0000-00000000000a', 25.00, 55.00, 'Buck vertical — floor holes from rafters'),
    ('h0000000-0000-0000-0000-00000000001e', 'f0000000-0000-0000-0000-00000000000a', 70.00, 40.00, 'Iana — Cocktail drone clearance');

-- --------------------------------
-- KAFE — Fireplace / Mining (2F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-00000000000b',
     'a0000000-0000-0000-0000-000000000004',
     'b0000000-0000-0000-0000-000000000402',
     'Kafe 2F – Fireplace Default Plant',
     'Ace opens Fireplace wall from Piano. Nomad covers Red Stairs. Finka rushes Mining. Plant in default behind counter.',
     '/images/strategies/kafe_fireplace_default.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-00000000001f', 'f0000000-0000-0000-0000-00000000000b', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-00000000000b', 'Flank Denial'),
    ('g0000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-00000000000b', 'Kafe');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-00000000001f', 'f0000000-0000-0000-0000-00000000000b', 55.00, 25.00, 'Ace breach — Fireplace wall from Piano'),
    ('h0000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-00000000000b', 30.00, 70.00, 'Nomad trax — Red Stairs flank hold'),
    ('h0000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-00000000000b', 60.00, 55.00, 'Plant default — behind Fireplace counter');

-- --------------------------------
-- KAFE — Kitchen / Bakery (1F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-00000000000c',
     'a0000000-0000-0000-0000-000000000004',
     'b0000000-0000-0000-0000-000000000403',
     'Kafe 1F – Bakery Rush',
     'Ash and Zofia double-rush Bakery from main entrance. Jackal tracks roamers in Kitchen. Plant default Bakery.',
     '/images/strategies/kafe_bakery_rush.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-00000000000c', 'Entry Fragger'),
    ('g0000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-00000000000c', 'Rush'),
    ('g0000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-00000000000c', 'Kafe');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-00000000000c', 70.00, 25.00, 'Ash — Bakery window breach'),
    ('h0000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-00000000000c', 40.00, 55.00, 'Jackal — Kitchen roam clear'),
    ('h0000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-00000000000c', 65.00, 80.00, 'Plant default — Bakery corner');

-- --------------------------------
-- BORDER — Armory / Archives (2F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-00000000000d',
     'a0000000-0000-0000-0000-000000000005',
     'b0000000-0000-0000-0000-000000000501',
     'Border Armory – Default Plant from CCTV',
     'Thatcher EMPs Armory wall, Thermite opens. Sledge clears floor above. Gridlock holds stairs. Plant default behind server rack.',
     '/images/strategies/border_armory_default.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-00000000000d', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000026', 'f0000000-0000-0000-0000-00000000000d', 'Flank Denial'),
    ('g0000000-0000-0000-0000-000000000027', 'f0000000-0000-0000-0000-00000000000d', 'Border');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-00000000000d', 50.00, 20.00, 'Thatcher EMP → Thermite breach — Armory wall'),
    ('h0000000-0000-0000-0000-000000000026', 'f0000000-0000-0000-0000-00000000000d', 30.00, 60.00, 'Sledge — vertical from floor above'),
    ('h0000000-0000-0000-0000-000000000027', 'f0000000-0000-0000-0000-00000000000d', 75.00, 80.00, 'Gridlock trax — stairs flank hold');

-- --------------------------------
-- BORDER — Bathroom / Tellers (1F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-00000000000e',
     'a0000000-0000-0000-0000-000000000005',
     'b0000000-0000-0000-0000-000000000502',
     'Border Tellers – Customs Execute',
     'Hibana opens Tellers wall from Customs. Ash clears Bathroom. Iana gives intel on Tellers corner. Plant default behind counter.',
     '/images/strategies/border_tellers_execute.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000028', 'f0000000-0000-0000-0000-00000000000e', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000029', 'f0000000-0000-0000-0000-00000000000e', 'Entry Fragger'),
    ('g0000000-0000-0000-0000-00000000002a', 'f0000000-0000-0000-0000-00000000000e', 'Border');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000028', 'f0000000-0000-0000-0000-00000000000e', 50.00, 25.00, 'Hibana breach — Tellers wall from Customs'),
    ('h0000000-0000-0000-0000-000000000029', 'f0000000-0000-0000-0000-00000000000e', 20.00, 55.00, 'Ash — Bathroom clear'),
    ('h0000000-0000-0000-0000-00000000002a', 'f0000000-0000-0000-0000-00000000000e', 60.00, 75.00, 'Plant default — Tellers counter');

-- --------------------------------
-- BORDER — Customs / Inspection (1F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-00000000000f',
     'a0000000-0000-0000-0000-000000000005',
     'b0000000-0000-0000-0000-000000000503',
     'Border Customs – Vertical & Flank Denial',
     'Sledge opens floor above Customs. Nomad holds East stairs. Twitch clears gadgets on site. Plant default behind pillar.',
     '/images/strategies/border_customs_vertical.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-00000000002b', 'f0000000-0000-0000-0000-00000000000f', 'Vertical'),
    ('g0000000-0000-0000-0000-00000000002c', 'f0000000-0000-0000-0000-00000000000f', 'Flank Denial'),
    ('g0000000-0000-0000-0000-00000000002d', 'f0000000-0000-0000-0000-00000000000f', 'Border');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-00000000002b', 'f0000000-0000-0000-0000-00000000000f', 45.00, 25.00, 'Sledge — vertical from 2F floor'),
    ('h0000000-0000-0000-0000-00000000002c', 'f0000000-0000-0000-0000-00000000000f', 80.00, 60.00, 'Nomad airjab — East stairs'),
    ('h0000000-0000-0000-0000-00000000002d', 'f0000000-0000-0000-0000-00000000000f', 50.00, 75.00, 'Twitch drone — gadget clear on site');

-- --------------------------------
-- OREGON — Tower / Bedroom (2F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000010',
     'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000104',
     'Oregon Tower – Attic & Bedroom Execute',
     'Ace opens the attic wall from tower stairs. Buck vertical from attic roof. Nomad holds main stairs. Plant default bedroom.',
     '/images/strategies/oregon_tower_attic.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-00000000002e', 'f0000000-0000-0000-0000-000000000010', 'Hard Breach'),
    ('g0000000-0000-0000-0000-00000000004e', 'f0000000-0000-0000-0000-000000000010', 'Vertical'),
    ('g0000000-0000-0000-0000-00000000002f', 'f0000000-0000-0000-0000-000000000010', 'Oregon');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-00000000002e', 'f0000000-0000-0000-0000-000000000010', 55.00, 20.00, 'Ace breach — Attic wall from Tower stairs'),
    ('h0000000-0000-0000-0000-00000000002f', 'f0000000-0000-0000-0000-000000000010', 30.00, 50.00, 'Buck vertical — shooting floor from Attic roof'),
    ('h0000000-0000-0000-0000-000000000030', 'f0000000-0000-0000-0000-000000000010', 75.00, 80.00, 'Nomad — main stairs flank hold');

-- --------------------------------
-- BANK — Open Area / Tellers (1F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000011',
     'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000204',
     'Bank Open Area – Avast Ye Execute',
     'Thermite breaches Open Area wall from Parking. Zofia clears teller corner. Sledge opens floor for vert. Plant default behind pillar.',
     '/images/strategies/bank_openarea_execute.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000030', 'f0000000-0000-0000-0000-000000000011', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000011', 'Vertical'),
    ('g0000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000011', 'Bank');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000011', 50.00, 20.00, 'Thermite breach — Open Area wall from Parking'),
    ('h0000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000011', 35.00, 55.00, 'Zofia — teller corner clear'),
    ('h0000000-0000-0000-0000-000000000033', 'f0000000-0000-0000-0000-000000000011', 65.00, 40.00, 'Sledge — floor vertical from 2F');

-- --------------------------------
-- CLUBHOUSE — Church / Arsenal (1F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000012',
     'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000304',
     'Clubhouse Church – Arsenal Breach',
     'Hibana opens Church wall from Arsenal side. Iana drones Church corner. Jackal tracks roamers in Garage. Plant default Church.',
     '/images/strategies/clubhouse_church_breach.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000033', 'f0000000-0000-0000-0000-000000000012', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000034', 'f0000000-0000-0000-0000-000000000012', 'Roamer Clear'),
    ('g0000000-0000-0000-0000-000000000035', 'f0000000-0000-0000-0000-000000000012', 'Clubhouse');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000034', 'f0000000-0000-0000-0000-000000000012', 50.00, 25.00, 'Hibana breach — Church wall from Arsenal'),
    ('h0000000-0000-0000-0000-000000000035', 'f0000000-0000-0000-0000-000000000012', 30.00, 60.00, 'Iana drone — Church corner clear'),
    ('h0000000-0000-0000-0000-000000000036', 'f0000000-0000-0000-0000-000000000012', 75.00, 50.00, 'Jackal — Garage roam tracking');

-- --------------------------------
-- KAFE — Cigar / Museum (2F)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000013',
     'a0000000-0000-0000-0000-000000000004',
     'b0000000-0000-0000-0000-000000000404',
     'Kafe Cigar – Museum Default Plant',
     'Ace opens Cigar wall from Museum. Thatcher disables defender gadgets. Buck vertical from 3F. Plant default behind couch.',
     '/images/strategies/kafe_cigar_default.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000036', 'f0000000-0000-0000-0000-000000000013', 'Hard Breach'),
    ('g0000000-0000-0000-0000-000000000037', 'f0000000-0000-0000-0000-000000000013', 'Vertical'),
    ('g0000000-0000-0000-0000-000000000038', 'f0000000-0000-0000-0000-000000000013', 'Kafe');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000037', 'f0000000-0000-0000-0000-000000000013', 50.00, 20.00, 'Ace breach — Cigar wall from Museum'),
    ('h0000000-0000-0000-0000-000000000038', 'f0000000-0000-0000-0000-000000000013', 25.00, 55.00, 'Thatcher EMP — Cigar wall gadgets'),
    ('h0000000-0000-0000-0000-000000000039', 'f0000000-0000-0000-0000-000000000013', 65.00, 75.00, 'Plant default — behind Cigar couch');

-- --------------------------------
-- BORDER — Ventilation / Supply (B)
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000014',
     'a0000000-0000-0000-0000-000000000005',
     'b0000000-0000-0000-0000-000000000504',
     'Border Basement – Ventilation Execute',
     'Thermite opens Ventilation wall from Supply. Sledge vertical from 1F. Nomad holds Workshop stairs. Plant default Ventilation corner.',
     '/images/strategies/border_ventilation_execute.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000039', 'f0000000-0000-0000-0000-000000000014', 'Hard Breach'),
    ('g0000000-0000-0000-0000-00000000003a', 'f0000000-0000-0000-0000-000000000014', 'Vertical'),
    ('g0000000-0000-0000-0000-00000000003b', 'f0000000-0000-0000-0000-000000000014', 'Border');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-00000000003a', 'f0000000-0000-0000-0000-000000000014', 50.00, 20.00, 'Thermite breach — Ventilation wall'),
    ('h0000000-0000-0000-0000-00000000003b', 'f0000000-0000-0000-0000-000000000014', 40.00, 55.00, 'Sledge — vertical from 1F above'),
    ('h0000000-0000-0000-0000-00000000003c', 'f0000000-0000-0000-0000-000000000014', 80.00, 80.00, 'Nomad — Workshop stairs flank hold');

-- --------------------------------
-- OREGON — Kitchen / Dining (1F) — defender setup
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000015',
     'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000102',
     'Oregon Kitchen – Mira & Roamer Setup',
     'Mira window on Kitchen freezer wall for intel. Smoke holds Dining with canisters. Jäger protects from grenades. Bandit tricks laundry wall.',
     '/images/strategies/oregon_kitchen_mira.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-00000000003c', 'f0000000-0000-0000-0000-000000000015', 'Defender'),
    ('g0000000-0000-0000-0000-00000000003d', 'f0000000-0000-0000-0000-000000000015', 'Site Setup'),
    ('g0000000-0000-0000-0000-00000000003e', 'f0000000-0000-0000-0000-000000000015', 'Oregon');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-00000000003d', 'f0000000-0000-0000-0000-000000000015', 40.00, 30.00, 'Mira window — Kitchen freezer wall'),
    ('h0000000-0000-0000-0000-00000000003e', 'f0000000-0000-0000-0000-000000000015', 70.00, 50.00, 'Smoke — Dining area denial'),
    ('h0000000-0000-0000-0000-00000000003f', 'f0000000-0000-0000-0000-000000000015', 25.00, 75.00, 'Jäger — ADS protecting Mira');

-- --------------------------------
-- BANK — CEO / Office (3F) — defender setup
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000016',
     'a0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000201',
     'Bank CEO – Azami & Mira Hold',
     'Azami places Kiba barriers on CEO windows. Mira window on Open Area wall. Jäger protects from frags. Lesion holds stairs with gu mines.',
     '/images/strategies/bank_ceo_azami.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-00000000003f', 'f0000000-0000-0000-0000-000000000016', 'Defender'),
    ('g0000000-0000-0000-0000-000000000040', 'f0000000-0000-0000-0000-000000000016', 'Site Setup'),
    ('g0000000-0000-0000-0000-000000000041', 'f0000000-0000-0000-0000-000000000016', 'Bank');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000040', 'f0000000-0000-0000-0000-000000000016', 50.00, 20.00, 'Azami Kiba — CEO windows'),
    ('h0000000-0000-0000-0000-000000000041', 'f0000000-0000-0000-0000-000000000016', 70.00, 40.00, 'Mira window — Open Area wall'),
    ('h0000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000016', 30.00, 65.00, 'Lesion gu mines — stairs entrance');

-- --------------------------------
-- CLUBHOUSE — Cash / CCTV (B) — defender setup
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000017',
     'a0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000303',
     'Clubhouse Basement – Bandit Trick & Smoke Hold',
     'Bandit tricks CCTV wall against Thatcher. Smoke holds Cash with canisters. Jäger protects bandit. Mute jammers deny drones.',
     '/images/strategies/clubhouse_cash_bandit.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000017', 'Defender'),
    ('g0000000-0000-0000-0000-000000000043', 'f0000000-0000-0000-0000-000000000017', 'Anti-Breach'),
    ('g0000000-0000-0000-0000-000000000044', 'f0000000-0000-0000-0000-000000000017', 'Clubhouse');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000043', 'f0000000-0000-0000-0000-000000000017', 50.00, 20.00, 'Bandit trick — CCTV wall'),
    ('h0000000-0000-0000-0000-000000000044', 'f0000000-0000-0000-0000-000000000017', 35.00, 55.00, 'Smoke — Cash area denial'),
    ('h0000000-0000-0000-0000-000000000045', 'f0000000-0000-0000-0000-000000000017', 65.00, 40.00, 'Jäger ADS — protecting Bandit');

-- --------------------------------
-- KAFE — Red Stairs / Reading (3F) — defender setup
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000018',
     'a0000000-0000-0000-0000-000000000004',
     'b0000000-0000-0000-0000-000000000401',
     'Kafe 3F – Mira & Maestro Hold',
     'Mira window on Reading wall overlooking Red Stairs. Maestro turret covers default plant. Jäger protects from nades. Valkyrie cam in Cocktail.',
     '/images/strategies/kafe_3f_mira.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000045', 'f0000000-0000-0000-0000-000000000018', 'Defender'),
    ('g0000000-0000-0000-0000-000000000046', 'f0000000-0000-0000-0000-000000000018', 'Intel'),
    ('g0000000-0000-0000-0000-000000000047', 'f0000000-0000-0000-0000-000000000018', 'Kafe');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000046', 'f0000000-0000-0000-0000-000000000018', 50.00, 20.00, 'Mira window — Reading wall / Red Stairs'),
    ('h0000000-0000-0000-0000-000000000047', 'f0000000-0000-0000-0000-000000000018', 35.00, 55.00, 'Maestro turret — default plant cover'),
    ('h0000000-0000-0000-0000-000000000048', 'f0000000-0000-0000-0000-000000000018', 70.00, 40.00, 'Valkyrie cam — Cocktail room');

-- --------------------------------
-- BORDER — Armory / Archives (2F) — defender setup
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000019',
     'a0000000-0000-0000-0000-000000000005',
     'b0000000-0000-0000-0000-000000000501',
     'Border Armory – Smoke & Azami Hold',
     'Azami Kiba on Armory windows. Smoke holds Archives with canisters. Mute jammers deny breaches. Lesion gu mines on stairs.',
     '/images/strategies/border_armory_smoke.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-000000000048', 'f0000000-0000-0000-0000-000000000019', 'Defender'),
    ('g0000000-0000-0000-0000-000000000049', 'f0000000-0000-0000-0000-000000000019', 'Site Setup'),
    ('g0000000-0000-0000-0000-00000000004a', 'f0000000-0000-0000-0000-000000000019', 'Border');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-000000000049', 'f0000000-0000-0000-0000-000000000019', 50.00, 20.00, 'Azami Kiba — Armory windows'),
    ('h0000000-0000-0000-0000-00000000004a', 'f0000000-0000-0000-0000-000000000019', 35.00, 55.00, 'Smoke — Archives area denial'),
    ('h0000000-0000-0000-0000-00000000004b', 'f0000000-0000-0000-0000-000000000019', 75.00, 40.00, 'Lesion gu mines — stairs entrance');

-- --------------------------------
-- Generic — Default Plant on any hard-breach site
-- --------------------------------
INSERT INTO strategy_templates (id, map_id, site_id, title, description, image_url, status, created_by) VALUES
    ('f0000000-0000-0000-0000-00000000001a',
     'a0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000101',
     'Oregon – Thermite + Thatcher Default Plant',
     'Classic hard breach 1-2 combo. Thatcher EMPs the reinforced Kids/Dorms wall. Thermite opens. Smoke plant behind the box.',
     '/images/strategies/oregon_thermite_thatcher.webp',
     'approved', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy_tags (id, strategy_id, tag) VALUES
    ('g0000000-0000-0000-0000-00000000004b', 'f0000000-0000-0000-0000-00000000001a', 'Hard Breach'),
    ('g0000000-0000-0000-0000-00000000004c', 'f0000000-0000-0000-0000-00000000001a', 'Default Plant'),
    ('g0000000-0000-0000-0000-00000000004d', 'f0000000-0000-0000-0000-00000000001a', 'Oregon');

INSERT INTO strategy_hotspots (id, strategy_id, x_percent, y_percent, label) VALUES
    ('h0000000-0000-0000-0000-00000000004c', 'f0000000-0000-0000-0000-00000000001a', 50.00, 20.00, 'Thatcher EMP — Kids wall'),
    ('h0000000-0000-0000-0000-00000000004d', 'f0000000-0000-0000-0000-00000000001a', 50.00, 40.00, 'Thermite breach — main reinforced'),
    ('h0000000-0000-0000-0000-00000000004e', 'f0000000-0000-0000-0000-00000000001a', 55.00, 75.00, 'Plant — default box behind shield');
