-- ============================================================
-- 00002_r6s_seed_data.sql — Real R6S operators & maps (Y11S1)
-- ============================================================

-- --------------------------------
-- Maps (Ranked pool Y11S1 Phase 1 — March 2026)
-- Modernized: Coastline, Villa, Oregon
-- Removed from pool: Kanal, Skyscraper, Theme Park, Outback, Stadium Bravo, Lair
-- --------------------------------
INSERT INTO maps (id, name, image_url) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Bank', NULL),
  ('a2222222-2222-2222-2222-222222222222', 'Border', NULL),
  ('a3333333-3333-3333-3333-333333333333', 'Chalet', NULL),
  ('a4444444-4444-4444-4444-444444444444', 'Clubhouse', NULL),
  ('a5555555-5555-5555-5555-555555555555', 'Coastline', NULL),
  ('a6666666-6666-6666-6666-666666666666', 'Consulate', NULL),
  ('a7777777-7777-7777-7777-777777777777', 'Emerald Plains', NULL),
  ('a8888888-8888-8888-8888-888888888888', 'Kafe Dostoyevsky', NULL),
  ('a1010101-1010-1010-1010-101010101010', 'Nighthaven Labs', NULL),
  ('a1111111-1111-1111-1111-111111111112', 'Oregon', NULL),
  ('a1616161-1616-1616-1616-161616161616', 'Villa', NULL)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------
-- Operators (Year 11 Season 1 — 75 total)
-- New in Y11S1: Solid Snake (Attacker)
-- --------------------------------

-- Attackers (39)
INSERT INTO operators (id, name, side, icon_url) VALUES
  ('b0101010-0101-0101-0101-010101010101', 'Sledge', 'attacker', NULL),
  ('b0202020-0202-0202-0202-020202020202', 'Thatcher', 'attacker', NULL),
  ('b0303030-0303-0303-0303-030303030303', 'Ash', 'attacker', NULL),
  ('b0404040-0404-0404-0404-040404040404', 'Thermite', 'attacker', NULL),
  ('b0505050-0505-0505-0505-050505050505', 'Twitch', 'attacker', NULL),
  ('b0606060-0606-0606-0606-060606060606', 'Montagne', 'attacker', NULL),
  ('b0707070-0707-0707-0707-070707070707', 'Glaz', 'attacker', NULL),
  ('b0808080-0808-0808-0808-080808080808', 'Fuze', 'attacker', NULL),
  ('b0909090-0909-0909-0909-090909090909', 'IQ', 'attacker', NULL),
  ('b1010101-1010-1010-1010-101010101010', 'Blitz', 'attacker', NULL),
  ('b1111111-1111-1111-1111-111111111111', 'Buck', 'attacker', NULL),
  ('b1212121-1212-1212-1212-121212121212', 'Blackbeard', 'attacker', NULL),
  ('b1313131-1313-1313-1313-131313131313', 'Capitão', 'attacker', NULL),
  ('b1414141-1414-1414-1414-141414141414', 'Hibana', 'attacker', NULL),
  ('b1515151-1515-1515-1515-151515151515', 'Jackal', 'attacker', NULL),
  ('b1616161-1616-1616-1616-161616161616', 'Ying', 'attacker', NULL),
  ('b1717171-1717-1717-1717-171717171717', 'Zofia', 'attacker', NULL),
  ('b1818181-1818-1818-1818-181818181818', 'Dokkaebi', 'attacker', NULL),
  ('b1919191-1919-1919-1919-191919191919', 'Lion', 'attacker', NULL),
  ('b2020202-2020-2020-2020-202020202020', 'Finka', 'attacker', NULL),
  ('b2121212-2121-2121-2121-212121212121', 'Maverick', 'attacker', NULL),
  ('b2222222-2222-2222-2222-222222222222', 'Nomad', 'attacker', NULL),
  ('b2323232-2323-2323-2323-232323232323', 'Gridlock', 'attacker', NULL),
  ('b2424242-2424-2424-2424-242424242424', 'Nøkk', 'attacker', NULL),
  ('b2525252-2525-2525-2525-252525252525', 'Amaru', 'attacker', NULL),
  ('b2626262-2626-2626-2626-262626262626', 'Kali', 'attacker', NULL),
  ('b2727272-2727-2727-2727-272727272727', 'Zero', 'attacker', NULL),
  ('b2828282-2828-2828-2828-282828282828', 'Ace', 'attacker', NULL),
  ('b2929292-2929-2929-2929-292929292929', 'Flores', 'attacker', NULL),
  ('b3030303-3030-3030-3030-303030303030', 'Osa', 'attacker', NULL),
  ('b3131313-3131-3131-3131-313131313131', 'Sens', 'attacker', NULL),
  ('b3232322-3232-3232-3232-323232323232', 'Grim', 'attacker', NULL),
  ('b3333332-3333-3333-3333-333333333333', 'Brava', 'attacker', NULL),
  ('b3434342-3434-3434-3434-343434343434', 'Ram', 'attacker', NULL),
  ('b3535352-3535-3535-3535-353535353535', 'Deimos', 'attacker', NULL),
  ('b3636362-3636-3636-3636-363636363636', 'Rauora', 'attacker', NULL),
  ('b3737372-3737-3737-3737-373737373737', 'Striker', 'attacker', NULL),
  ('b3838382-3838-3838-3838-383838383838', 'Iana', 'attacker', NULL),
  ('b3939392-3939-3939-3939-393939393939', 'Solid Snake', 'attacker', NULL)
ON CONFLICT (id) DO NOTHING;

-- Defenders (37)
INSERT INTO operators (id, name, side, icon_url) VALUES
  ('c0101010-0101-0101-0101-010101010101', 'Smoke', 'defender', NULL),
  ('c0202020-0202-0202-0202-020202020202', 'Mute', 'defender', NULL),
  ('c0303030-0303-0303-0303-030303030303', 'Castle', 'defender', NULL),
  ('c0404040-0404-0404-0404-040404040404', 'Pulse', 'defender', NULL),
  ('c0505050-0505-0505-0505-050505050505', 'Doc', 'defender', NULL),
  ('c0606060-0606-0606-0606-060606060606', 'Rook', 'defender', NULL),
  ('c0707070-0707-0707-0707-070707070707', 'Kapkan', 'defender', NULL),
  ('c0808080-0808-0808-0808-080808080808', 'Tachanka', 'defender', NULL),
  ('c0909090-0909-0909-0909-090909090909', 'Jäger', 'defender', NULL),
  ('c1010101-1010-1010-1010-101010101010', 'Bandit', 'defender', NULL),
  ('c1111111-1111-1111-1111-111111111111', 'Frost', 'defender', NULL),
  ('c1212121-1212-1212-1212-121212121212', 'Valkyrie', 'defender', NULL),
  ('c1313131-1313-1313-1313-131313131313', 'Caveira', 'defender', NULL),
  ('c1414141-1414-1414-1414-141414141414', 'Echo', 'defender', NULL),
  ('c1515151-1515-1515-1515-151515151515', 'Mira', 'defender', NULL),
  ('c1616161-1616-1616-1616-161616161616', 'Lesion', 'defender', NULL),
  ('c1717171-1717-1717-1717-171717171717', 'Ela', 'defender', NULL),
  ('c1818181-1818-1818-1818-181818181818', 'Vigil', 'defender', NULL),
  ('c1919191-1919-1919-1919-191919191919', 'Maestro', 'defender', NULL),
  ('c2020202-2020-2020-2020-202020202020', 'Alibi', 'defender', NULL),
  ('c2121212-2121-2121-2121-212121212121', 'Clash', 'defender', NULL),
  ('c2222222-2222-2222-2222-222222222222', 'Kaid', 'defender', NULL),
  ('c2323232-2323-2323-2323-232323232323', 'Mozzie', 'defender', NULL),
  ('c2424242-2424-2424-2424-242424242424', 'Warden', 'defender', NULL),
  ('c2525252-2525-2525-2525-252525252525', 'Goyo', 'defender', NULL),
  ('c2626262-2626-2626-2626-262626262626', 'Wamai', 'defender', NULL),
  ('c2727272-2727-2727-2727-272727272727', 'Oryx', 'defender', NULL),
  ('c2828282-2828-2828-2828-282828282828', 'Melusi', 'defender', NULL),
  ('c2929292-2929-2929-2929-292929292929', 'Aruni', 'defender', NULL),
  ('c3030303-3030-3030-3030-303030303030', 'Thunderbird', 'defender', NULL),
  ('c3131313-3131-3131-3131-313131313131', 'Thorn', 'defender', NULL),
  ('c3232322-3232-3232-3232-323232323232', 'Azami', 'defender', NULL),
  ('c3333332-3333-3333-3333-333333333333', 'Solis', 'defender', NULL),
  ('c3434342-3434-3434-3434-343434343434', 'Fenrir', 'defender', NULL),
  ('c3535352-3535-3535-3535-353535353535', 'Tubarão', 'defender', NULL),
  ('c3636362-3636-3636-3636-363636363636', 'Skopós', 'defender', NULL),
  ('c3737372-3737-3737-3737-373737373737', 'Sentry', 'defender', NULL),
  ('c3838382-3838-3838-3838-383838383838', 'Denari', 'defender', NULL)
ON CONFLICT (id) DO NOTHING;
