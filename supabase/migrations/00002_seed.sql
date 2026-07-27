-- ============================================================
-- SEED — Reference data (maps + sites + operators Y11S1)
-- Da eseguire DOPO 00001_schema.sql
-- ============================================================

-- ============================================================
-- MAPS (Ranked pool Y11S1) — 11 mappe
-- ============================================================
INSERT INTO maps (id, name, image_url) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Bank',             '/images/maps/bank.svg'),
  ('a2222222-2222-2222-2222-222222222222', 'Border',           '/images/maps/border.svg'),
  ('a3333333-3333-3333-3333-333333333333', 'Chalet',           '/images/maps/chalet.svg'),
  ('a4444444-4444-4444-4444-444444444444', 'Clubhouse',        '/images/maps/clubhouse.svg'),
  ('a5555555-5555-5555-5555-555555555555', 'Coastline',        '/images/maps/coastline.svg'),
  ('a6666666-6666-6666-6666-666666666666', 'Consulate',        '/images/maps/consulate.svg'),
  ('a7777777-7777-7777-7777-777777777777', 'Emerald Plains',   '/images/maps/emerald_plains.svg'),
  ('a8888888-8888-8888-8888-888888888888', 'Kafe Dostoyevsky', '/images/maps/kafe.svg'),
  ('a1010101-1010-1010-1010-101010101010', 'Nighthaven Labs',  '/images/maps/nighthaven.svg'),
  ('a1111111-1111-1111-1111-111111111112', 'Oregon',           '/images/maps/oregon.svg'),
  ('a1616161-1616-1616-1616-161616161616', 'Villa',            '/images/maps/villa.svg')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SITES — 42 bomb sites across 11 maps
-- ============================================================
INSERT INTO sites (id, map_id, name, floor) VALUES
  -- Bank
  ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'CEO Office / Archives',    'Basement'),
  ('d1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', 'Staff Room / Open Area',   '1F'),
  ('d1111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111111', 'Executive Lounge / CEO Office', '2F'),
  -- Border
  ('d2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222222', 'Customs / Workshop',       '1F'),
  ('d2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Ventilation Room / Supply Room', '1F'),
  ('d2222222-2222-2222-2222-222222222223', 'a2222222-2222-2222-2222-222222222222', 'Armory / Archives',        '2F'),
  ('d2222222-2222-2222-2222-222222222224', 'a2222222-2222-2222-2222-222222222222', 'Offices / Showers',        '2F'),
  -- Chalet
  ('d3333333-3333-3333-3333-333333333331', 'a3333333-3333-3333-3333-333333333333', 'Wine Cellar / Bar',        'Basement'),
  ('d3333333-3333-3333-3333-333333333332', 'a3333333-3333-3333-3333-333333333333', 'Kitchen / Dining',         '1F'),
  ('d3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Master Bedroom / Office',  '2F'),
  ('d3333333-3333-3333-3333-333333333334', 'a3333333-3333-3333-3333-333333333333', 'Library / Meeting Room',   '2F'),
  -- Clubhouse
  ('d4444444-4444-4444-4444-444444444441', 'a4444444-4444-4444-4444-444444444444', 'Church / Arsenal',         'Basement'),
  ('d4444444-4444-4444-4444-444444444442', 'a4444444-4444-4444-4444-444444444444', 'Cash Room / Storage',      'Basement'),
  ('d4444444-4444-4444-4444-444444444443', 'a4444444-4444-4444-4444-444444444444', 'Bar / Stock Room',         '1F'),
  ('d4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'Gym / Master Bedroom',     '2F'),
  ('d4444444-4444-4444-4444-444444444445', 'a4444444-4444-4444-4444-444444444444', 'CCTV / Cash',              '2F'),
  -- Coastline
  ('d5555555-5555-5555-5555-555555555551', 'a5555555-5555-5555-5555-555555555555', 'Blue Bar / Sunrise Bar',   '1F'),
  ('d5555555-5555-5555-5555-555555555552', 'a5555555-5555-5555-5555-555555555555', 'Kitchen / Service',        '1F'),
  ('d5555555-5555-5555-5555-555555555553', 'a5555555-5555-5555-5555-555555555555', 'Penthouse / Theater',      '2F'),
  ('d5555555-5555-5555-5555-555555555554', 'a5555555-5555-5555-5555-555555555555', 'Hookah Lounge / Billiards','2F'),
  -- Consulate
  ('d6666666-6666-6666-6666-666666666661', 'a6666666-6666-6666-6666-666666666666', 'Archives / Admin Office',  'Basement'),
  ('d6666666-6666-6666-6666-666666666662', 'a6666666-6666-6666-6666-666666666666', 'Lobby / Press Room',       '1F'),
  ('d6666666-6666-6666-6666-666666666663', 'a6666666-6666-6666-6666-666666666666', 'Consul Office / Meeting Room', '2F'),
  ('d6666666-6666-6666-6666-666666666664', 'a6666666-6666-6666-6666-666666666666', 'Cafeteria / Kitchen',      '2F'),
  -- Emerald Plains
  ('d7777777-7777-7777-7777-777777777771', 'a7777777-7777-7777-7777-777777777777', 'Bar / Stock',              'Basement'),
  ('d7777777-7777-7777-7777-777777777772', 'a7777777-7777-7777-7777-777777777777', 'Kitchen / Dining',         '1F'),
  ('d7777777-7777-7777-7777-777777777773', 'a7777777-7777-7777-7777-777777777777', 'Master Bedroom / Office',  '2F'),
  -- Kafe
  ('d8888888-8888-8888-8888-888888888881', 'a8888888-8888-8888-8888-888888888888', 'Kitchen / Reading Room',   '1F'),
  ('d8888888-8888-8888-8888-888888888882', 'a8888888-8888-8888-8888-888888888888', 'Fireplace / Cigar Lounge', '2F'),
  ('d8888888-8888-8888-8888-888888888883', 'a8888888-8888-8888-8888-888888888888', 'Cocktail Bar / Lounge',    '3F'),
  -- Nighthaven
  ('d1010101-1010-1010-1010-101010101011', 'a1010101-1010-1010-1010-101010101010', 'Server Room / Research',   'Basement'),
  ('d1010101-1010-1010-1010-101010101012', 'a1010101-1010-1010-1010-101010101010', 'Lobby / Operations',       '1F'),
  ('d1010101-1010-1010-1010-101010101013', 'a1010101-1010-1010-1010-101010101010', 'Command / Control',        '2F'),
  -- Oregon
  ('d1111111-1111-1111-1111-111111111121', 'a1111111-1111-1111-1111-111111111112', 'Laundry / Supply',         'Basement'),
  ('d1111111-1111-1111-1111-111111111122', 'a1111111-1111-1111-1111-111111111112', 'Kitchen / Dining',         '1F'),
  ('d1111111-1111-1111-1111-111111111123', 'a1111111-1111-1111-1111-111111111112', 'Kids Room / Dorms',        '2F'),
  ('d1111111-1111-1111-1111-111111111124', 'a1111111-1111-1111-1111-111111111112', 'Master Bedroom / Study',   '2F'),
  -- Villa
  ('d1616161-1616-1616-1616-161616161611', 'a1616161-1616-1616-1616-161616161616', 'Crypt / Piano',            'Basement'),
  ('d1616161-1616-1616-1616-161616161612', 'a1616161-1616-1616-1616-161616161616', 'Living Room / Library',    '1F'),
  ('d1616161-1616-1616-1616-161616161613', 'a1616161-1616-1616-1616-161616161616', 'Aviator / Games',          '2F'),
  ('d1616161-1616-1616-1616-161616161614', 'a1616161-1616-1616-1616-161616161616', 'Trophy / Statuary',        '2F')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- OPERATORS (Y11S1) — 76 total (39 attackers + 37 defenders)
-- ============================================================
INSERT INTO operators (id, name, side, icon_url) VALUES
  -- Attackers (39)
  ('b0101010-0101-0101-0101-010101010101', 'Sledge',      'attacker', '/images/operators/sledge.svg'),
  ('b0202020-0202-0202-0202-020202020202', 'Thatcher',    'attacker', '/images/operators/thatcher.svg'),
  ('b0303030-0303-0303-0303-030303030303', 'Ash',         'attacker', '/images/operators/ash.svg'),
  ('b0404040-0404-0404-0404-040404040404', 'Thermite',    'attacker', '/images/operators/thermite.svg'),
  ('b0505050-0505-0505-0505-050505050505', 'Twitch',      'attacker', '/images/operators/twitch.svg'),
  ('b0606060-0606-0606-0606-060606060606', 'Montagne',    'attacker', '/images/operators/montagne.svg'),
  ('b0707070-0707-0707-0707-070707070707', 'Glaz',        'attacker', '/images/operators/glaz.svg'),
  ('b0808080-0808-0808-0808-080808080808', 'Fuze',        'attacker', '/images/operators/fuze.svg'),
  ('b0909090-0909-0909-0909-090909090909', 'IQ',          'attacker', '/images/operators/iq.svg'),
  ('b1010101-1010-1010-1010-101010101010', 'Blitz',       'attacker', '/images/operators/blitz.svg'),
  ('b1111111-1111-1111-1111-111111111111', 'Buck',        'attacker', '/images/operators/buck.svg'),
  ('b1212121-1212-1212-1212-121212121212', 'Blackbeard',  'attacker', '/images/operators/blackbeard.svg'),
  ('b1313131-1313-1313-1313-131313131313', 'Capitão',     'attacker', '/images/operators/capitao.svg'),
  ('b1414141-1414-1414-1414-141414141414', 'Hibana',      'attacker', '/images/operators/hibana.svg'),
  ('b1515151-1515-1515-1515-151515151515', 'Jackal',      'attacker', '/images/operators/jackal.svg'),
  ('b1616161-1616-1616-1616-161616161616', 'Ying',        'attacker', '/images/operators/ying.svg'),
  ('b1717171-1717-1717-1717-171717171717', 'Zofia',       'attacker', '/images/operators/zofia.svg'),
  ('b1818181-1818-1818-1818-181818181818', 'Dokkaebi',    'attacker', '/images/operators/dokkaebi.svg'),
  ('b1919191-1919-1919-1919-191919191919', 'Lion',        'attacker', '/images/operators/lion.svg'),
  ('b2020202-2020-2020-2020-202020202020', 'Finka',       'attacker', '/images/operators/finka.svg'),
  ('b2121212-2121-2121-2121-212121212121', 'Maverick',    'attacker', '/images/operators/maverick.svg'),
  ('b2222222-2222-2222-2222-222222222222', 'Nomad',       'attacker', '/images/operators/nomad.svg'),
  ('b2323232-2323-2323-2323-232323232323', 'Gridlock',    'attacker', '/images/operators/gridlock.svg'),
  ('b2424242-2424-2424-2424-242424242424', 'Nøkk',        'attacker', '/images/operators/nokk.svg'),
  ('b2525252-2525-2525-2525-252525252525', 'Amaru',       'attacker', '/images/operators/amaru.svg'),
  ('b2626262-2626-2626-2626-262626262626', 'Kali',        'attacker', '/images/operators/kali.svg'),
  ('b2727272-2727-2727-2727-272727272727', 'Zero',        'attacker', '/images/operators/zero.svg'),
  ('b2828282-2828-2828-2828-282828282828', 'Ace',         'attacker', '/images/operators/ace.svg'),
  ('b2929292-2929-2929-2929-292929292929', 'Flores',      'attacker', '/images/operators/flores.svg'),
  ('b3030303-3030-3030-3030-303030303030', 'Osa',         'attacker', '/images/operators/osa.svg'),
  ('b3131313-3131-3131-3131-313131313131', 'Sens',        'attacker', '/images/operators/sens.svg'),
  ('b3232322-3232-3232-3232-323232323232', 'Grim',        'attacker', '/images/operators/grim.svg'),
  ('b3333332-3333-3333-3333-333333333333', 'Brava',       'attacker', '/images/operators/brava.svg'),
  ('b3434342-3434-3434-3434-343434343434', 'Ram',         'attacker', '/images/operators/ram.svg'),
  ('b3535352-3535-3535-3535-353535353535', 'Deimos',      'attacker', '/images/operators/deimos.svg'),
  ('b3636362-3636-3636-3636-363636363636', 'Rauora',      'attacker', '/images/operators/rauora.svg'),
  ('b3737372-3737-3737-3737-373737373737', 'Striker',     'attacker', '/images/operators/striker.svg'),
  ('b3838382-3838-3838-3838-383838383838', 'Iana',        'attacker', '/images/operators/iana.svg'),
  ('b3939392-3939-3939-3939-393939393939', 'Solid Snake', 'attacker', '/images/operators/solid_snake.svg'),
  -- Defenders (37)
  ('c0101010-0101-0101-0101-010101010101', 'Smoke',       'defender', '/images/operators/smoke.svg'),
  ('c0202020-0202-0202-0202-020202020202', 'Mute',        'defender', '/images/operators/mute.svg'),
  ('c0303030-0303-0303-0303-030303030303', 'Castle',      'defender', '/images/operators/castle.svg'),
  ('c0404040-0404-0404-0404-040404040404', 'Pulse',       'defender', '/images/operators/pulse.svg'),
  ('c0505050-0505-0505-0505-050505050505', 'Doc',         'defender', '/images/operators/doc.svg'),
  ('c0606060-0606-0606-0606-060606060606', 'Rook',        'defender', '/images/operators/rook.svg'),
  ('c0707070-0707-0707-0707-070707070707', 'Kapkan',      'defender', '/images/operators/kapkan.svg'),
  ('c0808080-0808-0808-0808-080808080808', 'Tachanka',    'defender', '/images/operators/tachanka.svg'),
  ('c0909090-0909-0909-0909-090909090909', 'Jäger',       'defender', '/images/operators/jaeger.svg'),
  ('c1010101-1010-1010-1010-101010101010', 'Bandit',      'defender', '/images/operators/bandit.svg'),
  ('c1111111-1111-1111-1111-111111111111', 'Frost',       'defender', '/images/operators/frost.svg'),
  ('c1212121-1212-1212-1212-121212121212', 'Valkyrie',    'defender', '/images/operators/valkyrie.svg'),
  ('c1313131-1313-1313-1313-131313131313', 'Caveira',     'defender', '/images/operators/caveira.svg'),
  ('c1414141-1414-1414-1414-141414141414', 'Echo',        'defender', '/images/operators/echo.svg'),
  ('c1515151-1515-1515-1515-151515151515', 'Mira',        'defender', '/images/operators/mira.svg'),
  ('c1616161-1616-1616-1616-161616161616', 'Lesion',      'defender', '/images/operators/lesion.svg'),
  ('c1717171-1717-1717-1717-171717171717', 'Ela',         'defender', '/images/operators/ela.svg'),
  ('c1818181-1818-1818-1818-181818181818', 'Vigil',       'defender', '/images/operators/vigil.svg'),
  ('c1919191-1919-1919-1919-191919191919', 'Maestro',     'defender', '/images/operators/maestro.svg'),
  ('c2020202-2020-2020-2020-202020202020', 'Alibi',       'defender', '/images/operators/alibi.svg'),
  ('c2121212-2121-2121-2121-212121212121', 'Clash',       'defender', '/images/operators/clash.svg'),
  ('c2222222-2222-2222-2222-222222222222', 'Kaid',        'defender', '/images/operators/kaid.svg'),
  ('c2323232-2323-2323-2323-232323232323', 'Mozzie',      'defender', '/images/operators/mozzie.svg'),
  ('c2424242-2424-2424-2424-242424242424', 'Warden',      'defender', '/images/operators/warden.svg'),
  ('c2525252-2525-2525-2525-252525252525', 'Goyo',        'defender', '/images/operators/goyo.svg'),
  ('c2626262-2626-2626-2626-262626262626', 'Wamai',       'defender', '/images/operators/wamai.svg'),
  ('c2727272-2727-2727-2727-272727272727', 'Oryx',        'defender', '/images/operators/oryx.svg'),
  ('c2828282-2828-2828-2828-282828282828', 'Melusi',      'defender', '/images/operators/melusi.svg'),
  ('c2929292-2929-2929-2929-292929292929', 'Aruni',       'defender', '/images/operators/aruni.svg'),
  ('c3030303-3030-3030-3030-303030303030', 'Thunderbird', 'defender', '/images/operators/thunderbird.svg'),
  ('c3131313-3131-3131-3131-313131313131', 'Thorn',       'defender', '/images/operators/thorn.svg'),
  ('c3232322-3232-3232-3232-323232323232', 'Azami',       'defender', '/images/operators/azami.svg'),
  ('c3333332-3333-3333-3333-333333333333', 'Solis',       'defender', '/images/operators/solis.svg'),
  ('c3434342-3434-3434-3434-343434343434', 'Fenrir',      'defender', '/images/operators/fenrir.svg'),
  ('c3535352-3535-3535-3535-353535353535', 'Tubarão',     'defender', '/images/operators/tubarao.svg'),
  ('c3636362-3636-3636-3636-363636363636', 'Skopós',      'defender', '/images/operators/skopos.svg'),
  ('c3737372-3737-3737-3737-373737373737', 'Sentry',      'defender', '/images/operators/sentry.svg'),
  ('c3838382-3838-3838-3838-383838383838', 'Denari',      'defender', '/images/operators/denari.svg')
ON CONFLICT (id) DO NOTHING;
