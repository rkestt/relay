// ============================================================
// generate-heavy-strategies.mjs
// Generates 250 approved strategy templates with realistic R6S
// operator combos, hotspots, and power-law usage_count.
//
// Run: node scripts/generate-heavy-strategies.mjs
// Output: supabase/migrations/00022_heavy_strategies.sql
// ============================================================
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outFile = join(__dirname, '..', 'supabase', 'migrations', '00022_heavy_strategies.sql');

// ============================================================
// SEEDED PRNG (mulberry32) — deterministic output
// ============================================================
function createRng(seed) {
  let s = seed | 0;
  return function next() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(42);

function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return rng() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// ============================================================
// HARD-CODED SEED DATA
// ============================================================

// Maps (11)
const MAPS = [
  { id: 'a1111111-1111-1111-1111-111111111111', name: 'Bank' },
  { id: 'a2222222-2222-2222-2222-222222222222', name: 'Border' },
  { id: 'a3333333-3333-3333-3333-333333333333', name: 'Chalet' },
  { id: 'a4444444-4444-4444-4444-444444444444', name: 'Clubhouse' },
  { id: 'a5555555-5555-5555-5555-555555555555', name: 'Coastline' },
  { id: 'a6666666-6666-6666-6666-666666666666', name: 'Consulate' },
  { id: 'a7777777-7777-7777-7777-777777777777', name: 'Emerald Plains' },
  { id: 'a8888888-8888-8888-8888-888888888888', name: 'Kafe Dostoyevsky' },
  { id: 'a1010101-1010-1010-1010-101010101010', name: 'Nighthaven Labs' },
  { id: 'a1111111-1111-1111-1111-111111111112', name: 'Oregon' },
  { id: 'a1616161-1616-1616-1616-161616161616', name: 'Villa' },
];

const MAP_LOOKUP = {};
for (const m of MAPS) MAP_LOOKUP[m.id] = m.name;

// Sites (42) grouped by map_id
const SITES = [
  { id: 'd1111111-1111-1111-1111-111111111111', map_id: 'a1111111-1111-1111-1111-111111111111', name: 'CEO Office / Archives' },
  { id: 'd1111111-1111-1111-1111-111111111112', map_id: 'a1111111-1111-1111-1111-111111111111', name: 'Staff Room / Open Area' },
  { id: 'd1111111-1111-1111-1111-111111111113', map_id: 'a1111111-1111-1111-1111-111111111111', name: 'Executive Lounge / CEO Office' },
  { id: 'd2222222-2222-2222-2222-222222222221', map_id: 'a2222222-2222-2222-2222-222222222222', name: 'Customs / Workshop' },
  { id: 'd2222222-2222-2222-2222-222222222222', map_id: 'a2222222-2222-2222-2222-222222222222', name: 'Ventilation Room / Supply Room' },
  { id: 'd2222222-2222-2222-2222-222222222223', map_id: 'a2222222-2222-2222-2222-222222222222', name: 'Armory / Archives' },
  { id: 'd2222222-2222-2222-2222-222222222224', map_id: 'a2222222-2222-2222-2222-222222222222', name: 'Offices / Showers' },
  { id: 'd3333333-3333-3333-3333-333333333331', map_id: 'a3333333-3333-3333-3333-333333333333', name: 'Wine Cellar / Bar' },
  { id: 'd3333333-3333-3333-3333-333333333332', map_id: 'a3333333-3333-3333-3333-333333333333', name: 'Kitchen / Dining' },
  { id: 'd3333333-3333-3333-3333-333333333333', map_id: 'a3333333-3333-3333-3333-333333333333', name: 'Master Bedroom / Office' },
  { id: 'd3333333-3333-3333-3333-333333333334', map_id: 'a3333333-3333-3333-3333-333333333333', name: 'Library / Meeting Room' },
  { id: 'd4444444-4444-4444-4444-444444444441', map_id: 'a4444444-4444-4444-4444-444444444444', name: 'Church / Arsenal' },
  { id: 'd4444444-4444-4444-4444-444444444442', map_id: 'a4444444-4444-4444-4444-444444444444', name: 'Cash Room / Storage' },
  { id: 'd4444444-4444-4444-4444-444444444443', map_id: 'a4444444-4444-4444-4444-444444444444', name: 'Bar / Stock Room' },
  { id: 'd4444444-4444-4444-4444-444444444444', map_id: 'a4444444-4444-4444-4444-444444444444', name: 'Gym / Master Bedroom' },
  { id: 'd4444444-4444-4444-4444-444444444445', map_id: 'a4444444-4444-4444-4444-444444444444', name: 'CCTV / Cash' },
  { id: 'd5555555-5555-5555-5555-555555555551', map_id: 'a5555555-5555-5555-5555-555555555555', name: 'Blue Bar / Sunrise Bar' },
  { id: 'd5555555-5555-5555-5555-555555555552', map_id: 'a5555555-5555-5555-5555-555555555555', name: 'Kitchen / Service' },
  { id: 'd5555555-5555-5555-5555-555555555553', map_id: 'a5555555-5555-5555-5555-555555555555', name: 'Penthouse / Theater' },
  { id: 'd5555555-5555-5555-5555-555555555554', map_id: 'a5555555-5555-5555-5555-555555555555', name: 'Hookah Lounge / Billiards' },
  { id: 'd6666666-6666-6666-6666-666666666661', map_id: 'a6666666-6666-6666-6666-666666666666', name: 'Archives / Admin Office' },
  { id: 'd6666666-6666-6666-6666-666666666662', map_id: 'a6666666-6666-6666-6666-666666666666', name: 'Lobby / Press Room' },
  { id: 'd6666666-6666-6666-6666-666666666663', map_id: 'a6666666-6666-6666-6666-666666666666', name: 'Consul Office / Meeting Room' },
  { id: 'd6666666-6666-6666-6666-666666666664', map_id: 'a6666666-6666-6666-6666-666666666666', name: 'Cafeteria / Kitchen' },
  { id: 'd7777777-7777-7777-7777-777777777771', map_id: 'a7777777-7777-7777-7777-777777777777', name: 'Bar / Stock' },
  { id: 'd7777777-7777-7777-7777-777777777772', map_id: 'a7777777-7777-7777-7777-777777777777', name: 'Kitchen / Dining' },
  { id: 'd7777777-7777-7777-7777-777777777773', map_id: 'a7777777-7777-7777-7777-777777777777', name: 'Master Bedroom / Office' },
  { id: 'd8888888-8888-8888-8888-888888888881', map_id: 'a8888888-8888-8888-8888-888888888888', name: 'Kitchen / Reading Room' },
  { id: 'd8888888-8888-8888-8888-888888888882', map_id: 'a8888888-8888-8888-8888-888888888888', name: 'Fireplace / Cigar Lounge' },
  { id: 'd8888888-8888-8888-8888-888888888883', map_id: 'a8888888-8888-8888-8888-888888888888', name: 'Cocktail Bar / Lounge' },
  { id: 'd1010101-1010-1010-1010-101010101011', map_id: 'a1010101-1010-1010-1010-101010101010', name: 'Server Room / Research' },
  { id: 'd1010101-1010-1010-1010-101010101012', map_id: 'a1010101-1010-1010-1010-101010101010', name: 'Lobby / Operations' },
  { id: 'd1010101-1010-1010-1010-101010101013', map_id: 'a1010101-1010-1010-1010-101010101010', name: 'Command / Control' },
  { id: 'd1111111-1111-1111-1111-111111111121', map_id: 'a1111111-1111-1111-1111-111111111112', name: 'Laundry / Supply' },
  { id: 'd1111111-1111-1111-1111-111111111122', map_id: 'a1111111-1111-1111-1111-111111111112', name: 'Kitchen / Dining' },
  { id: 'd1111111-1111-1111-1111-111111111123', map_id: 'a1111111-1111-1111-1111-111111111112', name: 'Kids Room / Dorms' },
  { id: 'd1111111-1111-1111-1111-111111111124', map_id: 'a1111111-1111-1111-1111-111111111112', name: 'Master Bedroom / Study' },
  { id: 'd1616161-1616-1616-1616-161616161611', map_id: 'a1616161-1616-1616-1616-161616161616', name: 'Crypt / Piano' },
  { id: 'd1616161-1616-1616-1616-161616161612', map_id: 'a1616161-1616-1616-1616-161616161616', name: 'Living Room / Library' },
  { id: 'd1616161-1616-1616-1616-161616161613', map_id: 'a1616161-1616-1616-1616-161616161616', name: 'Aviator / Games' },
  { id: 'd1616161-1616-1616-1616-161616161614', map_id: 'a1616161-1616-1616-1616-161616161616', name: 'Trophy / Statuary' },
];

// Group sites by map_id
const SITES_BY_MAP = {};
for (const s of SITES) {
  if (!SITES_BY_MAP[s.map_id]) SITES_BY_MAP[s.map_id] = [];
  SITES_BY_MAP[s.map_id].push(s);
}

// Operators (attacker name→uuid, defender name→uuid)
const ATT_OPS = {
  'Sledge':     'b0101010-0101-0101-0101-010101010101',
  'Thatcher':   'b0202020-0202-0202-0202-020202020202',
  'Ash':        'b0303030-0303-0303-0303-030303030303',
  'Thermite':   'b0404040-0404-0404-0404-040404040404',
  'Twitch':     'b0505050-0505-0505-0505-050505050505',
  'Montagne':   'b0606060-0606-0606-0606-060606060606',
  'Glaz':       'b0707070-0707-0707-0707-070707070707',
  'Fuze':       'b0808080-0808-0808-0808-080808080808',
  'IQ':         'b0909090-0909-0909-0909-090909090909',
  'Blitz':      'b1010101-1010-1010-1010-101010101010',
  'Buck':       'b1111111-1111-1111-1111-111111111111',
  'Blackbeard': 'b1212121-1212-1212-1212-121212121212',
  'Capitão':    'b1313131-1313-1313-1313-131313131313',
  'Hibana':     'b1414141-1414-1414-1414-141414141414',
  'Jackal':     'b1515151-1515-1515-1515-151515151515',
  'Ying':       'b1616161-1616-1616-1616-161616161616',
  'Zofia':      'b1717171-1717-1717-1717-171717171717',
  'Dokkaebi':   'b1818181-1818-1818-1818-181818181818',
  'Lion':       'b1919191-1919-1919-1919-191919191919',
  'Finka':      'b2020202-2020-2020-2020-202020202020',
  'Maverick':   'b2121212-2121-2121-2121-212121212121',
  'Nomad':      'b2222222-2222-2222-2222-222222222222',
  'Gridlock':   'b2323232-2323-2323-2323-232323232323',
  'Nøkk':       'b2424242-2424-2424-2424-242424242424',
  'Amaru':      'b2525252-2525-2525-2525-252525252525',
  'Kali':       'b2626262-2626-2626-2626-262626262626',
  'Zero':       'b2727272-2727-2727-2727-272727272727',
  'Ace':        'b2828282-2828-2828-2828-282828282828',
  'Flores':     'b2929292-2929-2929-2929-292929292929',
  'Osa':        'b3030303-3030-3030-3030-303030303030',
  'Sens':       'b3131313-3131-3131-3131-313131313131',
  'Grim':       'b3232322-3232-3232-3232-323232323232',
  'Brava':      'b3333332-3333-3333-3333-333333333333',
  'Ram':        'b3434342-3434-3434-3434-343434343434',
  'Deimos':     'b3535352-3535-3535-3535-353535353535',
  'Rauora':     'b3636362-3636-3636-3636-363636363636',
  'Striker':    'b3737372-3737-3737-3737-373737373737',
  'Iana':       'b3838382-3838-3838-3838-383838383838',
  'Solid Snake':'b3939392-3939-3939-3939-393939393939',
};
const ATT_UUIDS = Object.values(ATT_OPS);
const ATT_NAMES = Object.keys(ATT_OPS);

const DEF_OPS = {
  'Smoke':      'c0101010-0101-0101-0101-010101010101',
  'Mute':       'c0202020-0202-0202-0202-020202020202',
  'Castle':     'c0303030-0303-0303-0303-030303030303',
  'Pulse':      'c0404040-0404-0404-0404-040404040404',
  'Doc':        'c0505050-0505-0505-0505-050505050505',
  'Rook':       'c0606060-0606-0606-0606-060606060606',
  'Kapkan':     'c0707070-0707-0707-0707-070707070707',
  'Tachanka':   'c0808080-0808-0808-0808-080808080808',
  'Jäger':      'c0909090-0909-0909-0909-090909090909',
  'Bandit':     'c1010101-1010-1010-1010-101010101010',
  'Frost':      'c1111111-1111-1111-1111-111111111111',
  'Valkyrie':   'c1212121-1212-1212-1212-121212121212',
  'Caveira':    'c1313131-1313-1313-1313-131313131313',
  'Echo':       'c1414141-1414-1414-1414-141414141414',
  'Mira':       'c1515151-1515-1515-1515-151515151515',
  'Lesion':     'c1616161-1616-1616-1616-161616161616',
  'Ela':        'c1717171-1717-1717-1717-171717171717',
  'Vigil':      'c1818181-1818-1818-1818-181818181818',
  'Maestro':    'c1919191-1919-1919-1919-191919191919',
  'Alibi':      'c2020202-2020-2020-2020-202020202020',
  'Clash':      'c2121212-2121-2121-2121-212121212121',
  'Kaid':       'c2222222-2222-2222-2222-222222222222',
  'Mozzie':     'c2323232-2323-2323-2323-232323232323',
  'Warden':     'c2424242-2424-2424-2424-242424242424',
  'Goyo':       'c2525252-2525-2525-2525-252525252525',
  'Wamai':      'c2626262-2626-2626-2626-262626262626',
  'Oryx':       'c2727272-2727-2727-2727-272727272727',
  'Melusi':     'c2828282-2828-2828-2828-282828282828',
  'Aruni':      'c2929292-2929-2929-2929-292929292929',
  'Thunderbird':'c3030303-3030-3030-3030-303030303030',
  'Thorn':      'c3131313-3131-3131-3131-313131313131',
  'Azami':      'c3232322-3232-3232-3232-323232323232',
  'Solis':      'c3333332-3333-3333-3333-333333333333',
  'Fenrir':     'c3434342-3434-3434-3434-343434343434',
  'Tubarão':    'c3535352-3535-3535-3535-353535353535',
  'Skopós':     'c3636362-3636-3636-3636-363636363636',
  'Sentry':     'c3737372-3737-3737-3737-373737373737',
  'Denari':     'c3838382-3838-3838-3838-383838383838',
};
const DEF_UUIDS = Object.values(DEF_OPS);
const DEF_NAMES = Object.keys(DEF_OPS);

// ============================================================
// REALISTIC R6S COMBO TEMPLATES
// ============================================================

// Attacker combos by op count
const ATT_COMBOS = {
  1: [
    ['Ash'], ['Buck'], ['Sledge'], ['Iana'], ['Twitch'],
    ['Jackal'], ['Zofia'], ['Ying'], ['Ace'], ['Hibana'],
    ['Thermite'], ['Nomad'], ['Kali'], ['Zero'], ['Flores'],
  ],
  2: [
    ['Thermite', 'Thatcher'], ['Ace', 'Thatcher'], ['Hibana', 'Thatcher'],
    ['Ash', 'Zofia'], ['Ash', 'Jackal'], ['Ying', 'Finka'],
    ['Buck', 'Nomad'], ['Sledge', 'Nomad'], ['Buck', 'Iana'],
    ['Jackal', 'Lion'], ['Dokkaebi', 'Lion'], ['Jackal', 'Dokkaebi'],
    ['Ash', 'Thermite'], ['Zofia', 'Ace'], ['Sledge', 'Buck'],
    ['Nomad', 'Gridlock'], ['Thatcher', 'Maverick'], ['Zero', 'Iana'],
    ['Flores', 'Brava'], ['Ram', 'Deimos'],
  ],
  3: [
    ['Thermite', 'Thatcher', 'Zofia'],
    ['Ace', 'Thatcher', 'Iana'],
    ['Hibana', 'Sledge', 'Nomad'],
    ['Ash', 'Zofia', 'Jackal'],
    ['Buck', 'Iana', 'Nomad'],
    ['Thatcher', 'Thermite', 'Gridlock'],
    ['Ace', 'Thatcher', 'Finka'],
    ['Ying', 'Finka', 'Blitz'],
    ['Jackal', 'Lion', 'Dokkaebi'],
    ['Sledge', 'Nomad', 'Buck'],
    ['Ace', 'Buck', 'Iana'],
    ['Zofia', 'Thatcher', 'Hibana'],
    ['Ash', 'Finka', 'Nomad'],
    ['Jackal', 'Nomad', 'Gridlock'],
    ['Dokkaebi', 'Lion', 'Finka'],
    ['Kali', 'Iana', 'Zero'],
    ['Flores', 'Ace', 'Twitch'],
    ['Ram', 'Maverick', 'Sledge'],
    ['Deimos', 'Jackal', 'Lion'],
    ['Sens', 'Gridlock', 'Ying'],
  ],
  4: [
    ['Thermite', 'Thatcher', 'Zofia', 'Gridlock'],
    ['Ace', 'Buck', 'Iana', 'Nomad'],
    ['Hibana', 'Sledge', 'Jackal', 'Gridlock'],
    ['Ash', 'Zofia', 'Jackal', 'Finka'],
    ['Thatcher', 'Thermite', 'Nomad', 'Iana'],
    ['Ace', 'Thatcher', 'Jackal', 'Nomad'],
    ['Ying', 'Finka', 'Ash', 'Buck'],
    ['Sledge', 'Buck', 'Iana', 'Nomad'],
    ['Zofia', 'Hibana', 'Thatcher', 'Gridlock'],
    ['Kali', 'Ace', 'Iana', 'Twitch'],
    ['Jackal', 'Lion', 'Dokkaebi', 'Finka'],
    ['Ash', 'Thermite', 'Nomad', 'Gridlock'],
    ['Buck', 'Thatcher', 'Ace', 'Sledge'],
    ['Zero', 'Iana', 'Flores', 'Brava'],
    ['Ying', 'Sledge', 'Buck', 'Capitao'],
  ],
  5: [
    ['Thermite', 'Thatcher', 'Jackal', 'Nomad', 'Finka'],
    ['Ace', 'Buck', 'Iana', 'Nomad', 'Gridlock'],
    ['Hibana', 'Thatcher', 'Zofia', 'Jackal', 'Ash'],
    ['Thermite', 'Thatcher', 'Sledge', 'Nomad', 'Twitch'],
    ['Ash', 'Zofia', 'Jackal', 'Finka', 'Nomad'],
    ['Ace', 'Thatcher', 'Buck', 'Iana', 'Gridlock'],
    ['Ying', 'Finka', 'Blitz', 'Ash', 'Nomad'],
    ['Kali', 'Ace', 'Iana', 'Nomad', 'Gridlock'],
  ],
};

// Defender combos by op count
const DEF_COMBOS = {
  1: [
    ['Smoke'], ['Jäger'], ['Mira'], ['Valkyrie'], ['Bandit'],
    ['Lesion'], ['Maestro'], ['Mute'], ['Kaid'], ['Azami'],
    ['Wamai'], ['Melusi'], ['Echo'], ['Doc'], ['Rook'],
  ],
  2: [
    ['Smoke', 'Jäger'], ['Smoke', 'Maestro'], ['Smoke', 'Wamai'],
    ['Bandit', 'Kaid'], ['Mute', 'Bandit'], ['Valkyrie', 'Smoke'],
    ['Mira', 'Lesion'], ['Azami', 'Lesion'], ['Mira', 'Jäger'],
    ['Jäger', 'Wamai'], ['Lesion', 'Melusi'], ['Kaid', 'Smoke'],
    ['Mute', 'Jäger'], ['Valkyrie', 'Jäger'], ['Echo', 'Lesion'],
    ['Mozzie', 'Valkyrie'], ['Azami', 'Mira'], ['Smoke', 'Lesion'],
    ['Bandit', 'Mute'], ['Maestro', 'Smoke'],
  ],
  3: [
    ['Smoke', 'Jäger', 'Maestro'],
    ['Valkyrie', 'Jäger', 'Smoke'],
    ['Mira', 'Lesion', 'Azami'],
    ['Bandit', 'Kaid', 'Mute'],
    ['Azami', 'Mira', 'Lesion'],
    ['Smoke', 'Wamai', 'Jäger'],
    ['Melusi', 'Lesion', 'Jäger'],
    ['Valkyrie', 'Smoke', 'Jäger'],
    ['Kaid', 'Mute', 'Smoke'],
    ['Warden', 'Smoke', 'Jäger'],
    ['Mira', 'Maestro', 'Smoke'],
    ['Echo', 'Smoke', 'Jäger'],
    ['Castle', 'Mute', 'Jäger'],
    ['Solis', 'Mozzie', 'Valkyrie'],
    ['Thorn', 'Lesion', 'Melusi'],
    ['Fenrir', 'Lesion', 'Smoke'],
    ['Tubarão', 'Smoke', 'Jäger'],
    ['Aruni', 'Melusi', 'Jäger'],
    ['Goyo', 'Smoke', 'Jäger'],
    ['Oryx', 'Azami', 'Mira'],
  ],
  4: [
    ['Mira', 'Maestro', 'Smoke', 'Jäger'],
    ['Mira', 'Jäger', 'Smoke', 'Lesion'],
    ['Azami', 'Mira', 'Lesion', 'Bandit'],
    ['Smoke', 'Jäger', 'Bandit', 'Kaid'],
    ['Valkyrie', 'Smoke', 'Jäger', 'Mute'],
    ['Melusi', 'Smoke', 'Jäger', 'Lesion'],
    ['Wamai', 'Jäger', 'Smoke', 'Mira'],
    ['Kaid', 'Mute', 'Smoke', 'Jäger'],
    ['Azami', 'Lesion', 'Mira', 'Jäger'],
    ['Mira', 'Valkyrie', 'Smoke', 'Jäger'],
    ['Echo', 'Smoke', 'Mute', 'Jäger'],
    ['Maestro', 'Smoke', 'Jäger', 'Mute'],
    ['Castle', 'Mute', 'Azami', 'Jäger'],
    ['Solis', 'Valkyrie', 'Smoke', 'Lesion'],
    ['Thorn', 'Melusi', 'Lesion', 'Smoke'],
  ],
  5: [
    ['Mira', 'Jäger', 'Smoke', 'Lesion', 'Bandit'],
    ['Maestro', 'Smoke', 'Jäger', 'Valkyrie', 'Mute'],
    ['Azami', 'Mira', 'Lesion', 'Jäger', 'Wamai'],
    ['Smoke', 'Bandit', 'Kaid', 'Mute', 'Jäger'],
    ['Mira', 'Smoke', 'Jäger', 'Melusi', 'Lesion'],
    ['Kaid', 'Mute', 'Smoke', 'Jäger', 'Valkyrie'],
    ['Azami', 'Lesion', 'Smoke', 'Jäger', 'Maestro'],
    ['Echo', 'Smoke', 'Mira', 'Jäger', 'Mute'],
  ],
};

// Title / tactic phrases per side
const ATT_TACTICS = [
  'Hard Breach & Plant', 'Vertical Attack', 'Default Plant Execute',
  'Roamer Clear & Plant', 'Entry Fragger Rush', 'Flank Hold Execute',
  'Breach Denial Clear', 'Vertical Take & Plant', 'Full Execute',
  'Split Push Attack', 'Droning Intel & Plant', 'Hatch Clear Strat',
  'Shield Push Execute', 'Glaz Angle Control', 'Candela Flush Strat',
  'Hard Breach Priority', 'Vertical Pressure', 'Rush & Plant',
  'Defuser Plant Cover', 'Bait & Switch Execute',
];

const DEF_TACTICS = [
  'Mira & Smoke Hold', 'Site Denial', 'Breach Denial Setup',
  'Intel & Anchor', 'Trap Setup Hold', 'Anti-Breach Wall',
  'Azami Kiba Hold', 'Maestro Intel Defense', 'Rotational Hold',
  'Crossfire Site Setup', 'Jäger & Wamai Protection', 'Valkyrie Intel',
  '5-Stack Site Hold', 'Anchor Stack', 'Bandit Trick Denial',
  'Lesion Area Denial', 'Mozzie Drone Denial', 'Solis Intel Denial',
  'Fenrir Gas Denial', 'Double Denial Setup',
];

// ============================================================
// HOTSPOT ZONES per map (4-6 rectangular zones)
// Each zone: { label, xMin, xMax, yMin, yMax }
// ============================================================
const HOTSPOT_ZONES = {
  'a1111111-1111-1111-1111-111111111111': [ // Bank
    { label: 'CEO Breach Wall',     xMin: 50, xMax: 60, yMin: 25, yMax: 35 },
    { label: 'CEO Default Plant',   xMin: 35, xMax: 45, yMin: 55, yMax: 65 },
    { label: 'Staff Mira Window',   xMin: 40, xMax: 50, yMin: 30, yMax: 45 },
    { label: 'Staff Smoke Spot',    xMin: 55, xMax: 65, yMin: 50, yMax: 65 },
    { label: 'Lobby Flank Hold',    xMin: 15, xMax: 25, yMin: 40, yMax: 55 },
    { label: 'Executive Window',    xMin: 30, xMax: 40, yMin: 25, yMax: 40 },
  ],
  'a2222222-2222-2222-2222-222222222222': [ // Border
    { label: 'Customs Wall',        xMin: 45, xMax: 55, yMin: 20, yMax: 35 },
    { label: 'Workshop Plant',      xMin: 30, xMax: 40, yMin: 50, yMax: 60 },
    { label: 'Ventilation Breach',  xMin: 55, xMax: 65, yMin: 30, yMax: 40 },
    { label: 'Supply Denial Spot',  xMin: 60, xMax: 70, yMin: 55, yMax: 65 },
    { label: 'Armory Default Plant',xMin: 35, xMax: 45, yMin: 40, yMax: 55 },
    { label: 'Offices Exterior',    xMin: 20, xMax: 30, yMin: 25, yMax: 40 },
  ],
  'a3333333-3333-3333-3333-333333333333': [ // Chalet
    { label: 'Wine Cellar Wall',    xMin: 40, xMax: 50, yMin: 25, yMax: 35 },
    { label: 'Bar Default Plant',   xMin: 25, xMax: 35, yMin: 50, yMax: 60 },
    { label: 'Kitchen Window',      xMin: 50, xMax: 60, yMin: 30, yMax: 45 },
    { label: 'Dining Entry',        xMin: 30, xMax: 40, yMin: 55, yMax: 65 },
    { label: 'Master Bedroom Wall', xMin: 55, xMax: 65, yMin: 20, yMax: 35 },
    { label: 'Library Bookshelf',   xMin: 45, xMax: 55, yMin: 45, yMax: 60 },
  ],
  'a4444444-4444-4444-4444-444444444444': [ // Clubhouse
    { label: 'Church Default Plant',xMin: 40, xMax: 50, yMin: 50, yMax: 60 },
    { label: 'Arsenal Breach Wall', xMin: 55, xMax: 65, yMin: 25, yMax: 35 },
    { label: 'Cash Room Wall',      xMin: 30, xMax: 40, yMin: 30, yMax: 40 },
    { label: 'Storage Flank',       xMin: 20, xMax: 30, yMin: 50, yMax: 60 },
    { label: 'Bar Stock Entry',     xMin: 50, xMax: 60, yMin: 45, yMax: 55 },
    { label: 'Gym Freezer Hold',    xMin: 35, xMax: 45, yMin: 20, yMax: 30 },
  ],
  'a5555555-5555-5555-5555-555555555555': [ // Coastline
    { label: 'Blue Bar Window',     xMin: 20, xMax: 30, yMin: 30, yMax: 40 },
    { label: 'Sunrise Bar Plant',   xMin: 35, xMax: 45, yMin: 55, yMax: 65 },
    { label: 'Kitchen Default',     xMin: 50, xMax: 60, yMin: 40, yMax: 50 },
    { label: 'Service Sliding Door',xMin: 60, xMax: 70, yMin: 50, yMax: 60 },
    { label: 'Penthouse Wall',      xMin: 30, xMax: 40, yMin: 25, yMax: 35 },
    { label: 'Hookah Window',       xMin: 45, xMax: 55, yMin: 35, yMax: 45 },
  ],
  'a6666666-6666-6666-6666-666666666666': [ // Consulate
    { label: 'Archives Wall',       xMin: 40, xMax: 50, yMin: 30, yMax: 40 },
    { label: 'Admin Default Plant', xMin: 30, xMax: 40, yMin: 55, yMax: 65 },
    { label: 'Lobby Mira Window',   xMin: 50, xMax: 60, yMin: 25, yMax: 35 },
    { label: 'Press Room Hold',     xMin: 55, xMax: 65, yMin: 45, yMax: 55 },
    { label: 'Consul Office',       xMin: 20, xMax: 30, yMin: 30, yMax: 45 },
    { label: 'Cafeteria Kitchen',   xMin: 45, xMax: 55, yMin: 50, yMax: 60 },
  ],
  'a7777777-7777-7777-7777-777777777777': [ // Emerald Plains
    { label: 'Bar Stock Wall',      xMin: 35, xMax: 45, yMin: 25, yMax: 35 },
    { label: 'Kitchen Default',     xMin: 50, xMax: 60, yMin: 50, yMax: 60 },
    { label: 'Dining Entry',        xMin: 40, xMax: 50, yMin: 55, yMax: 65 },
    { label: 'Master Window',       xMin: 25, xMax: 35, yMin: 30, yMax: 40 },
    { label: 'Office Breach Wall',  xMin: 55, xMax: 65, yMin: 20, yMax: 30 },
    { label: 'Basement Stairs',     xMin: 20, xMax: 30, yMin: 45, yMax: 55 },
  ],
  'a8888888-8888-8888-8888-888888888888': [ // Kafe
    { label: 'Kitchen Red Wall',    xMin: 40, xMax: 50, yMin: 20, yMax: 30 },
    { label: 'Bakery Default Plant',xMin: 30, xMax: 40, yMin: 50, yMax: 60 },
    { label: 'Fireplace Wall',      xMin: 50, xMax: 60, yMin: 30, yMax: 40 },
    { label: 'Cigar Lounge Hold',   xMin: 55, xMax: 65, yMin: 50, yMax: 60 },
    { label: 'Cocktail Wall',       xMin: 35, xMax: 45, yMin: 25, yMax: 35 },
    { label: 'Red Stairs Flank',    xMin: 15, xMax: 25, yMin: 40, yMax: 55 },
  ],
  'a1010101-1010-1010-1010-101010101010': [ // Nighthaven Labs
    { label: 'Server Breach Wall',  xMin: 45, xMax: 55, yMin: 25, yMax: 35 },
    { label: 'Research Plant',      xMin: 35, xMax: 45, yMin: 55, yMax: 65 },
    { label: 'Lobby Mira Window',   xMin: 40, xMax: 50, yMin: 30, yMax: 40 },
    { label: 'Operations Hold',     xMin: 55, xMax: 65, yMin: 45, yMax: 55 },
    { label: 'Command Wall',        xMin: 30, xMax: 40, yMin: 20, yMax: 30 },
    { label: 'Control Stairs',      xMin: 20, xMax: 30, yMin: 40, yMax: 50 },
  ],
  'a1111111-1111-1111-1111-111111111112': [ // Oregon
    { label: 'Laundry Wall',        xMin: 40, xMax: 50, yMin: 25, yMax: 35 },
    { label: 'Supply Default Plant',xMin: 30, xMax: 40, yMin: 55, yMax: 65 },
    { label: 'Kitchen Freezer',     xMin: 50, xMax: 60, yMin: 40, yMax: 50 },
    { label: 'Dining Default',      xMin: 35, xMax: 45, yMin: 45, yMax: 55 },
    { label: 'Kids Dorms Wall',     xMin: 25, xMax: 35, yMin: 30, yMax: 40 },
    { label: 'Master Bedroom Plant',xMin: 55, xMax: 65, yMin: 50, yMax: 60 },
  ],
  'a1616161-1616-1616-1616-161616161616': [ // Villa
    { label: 'Crypt Breach Wall',   xMin: 45, xMax: 55, yMin: 25, yMax: 35 },
    { label: 'Piano Default Plant', xMin: 35, xMax: 45, yMin: 55, yMax: 65 },
    { label: 'Living Room Window',  xMin: 40, xMax: 50, yMin: 30, yMax: 40 },
    { label: 'Library Hold',        xMin: 55, xMax: 65, yMin: 50, yMax: 60 },
    { label: 'Aviator Wall',        xMin: 30, xMax: 40, yMin: 25, yMax: 35 },
    { label: 'Trophy Room Plant',   xMin: 50, xMax: 60, yMin: 45, yMax: 55 },
  ],
};

// ============================================================
// DISTRIBUTION HELPERS
// ============================================================

// Op-count distribution (must sum to 250)
const OP_DIST = [
  { count: 1, pct: 0.15, total: 38 },
  { count: 2, pct: 0.25, total: 62 },
  { count: 3, pct: 0.35, total: 88 },
  { count: 4, pct: 0.20, total: 50 },
  { count: 5, pct: 0.05, total: 12 },
];

// Usage_count tiers (power-law)
const TIERS = [
  { label: 'S', count: 5,  min: 200, max: 500 },
  { label: 'A', count: 15, min: 100, max: 200 },
  { label: 'B', count: 30, min: 50,  max: 100 },
  { label: 'C', count: 50, min: 20,  max: 50 },
  { label: 'D', count: 80, min: 5,   max: 20 },
  { label: 'E', count: 70, min: 1,   max: 5 },
];

// ============================================================
// GENERATION LOGIC
// ============================================================

// Plan: assign strategies to (map, site, side) tuples deterministically
// ensuring each site has at least 2 attacker + 2 defender strategies.

function buildStrategyPlan() {
  const plan = [];

  // First pass: guarantee minimum 2 att + 2 def per site
  for (const map of MAPS) {
    const sites = SITES_BY_MAP[map.id];
    for (const site of sites) {
      // 2 attacker, 2 defender per site minimum = 4 per site
      // For 42 sites that's only 168. We need 250 total.
      // We'll add ~82 extra distributed across all sites.
      for (let i = 0; i < 2; i++) plan.push({ mapId: map.id, siteId: site.id, side: 'attacker' });
      for (let i = 0; i < 2; i++) plan.push({ mapId: map.id, siteId: site.id, side: 'defender' });
    }
  }

  // Second pass: add remaining strategies to reach 250
  const extras = 250 - plan.length; // should be 82
  // Sort sites by site count, give extras to larger sites / random
  const siteList = [...SITES];
  for (let i = 0; i < extras; i++) {
    // Weight by existing count: prefer sites with fewer strategies
    const counts = {};
    for (const p of plan) {
      const key = p.siteId + '|' + p.side;
      counts[key] = (counts[key] || 0) + 1;
    }
    // Find site-side pairs with lowest counts
    let minCount = Infinity;
    const candidates = [];
    for (const map of MAPS) {
      const sites = SITES_BY_MAP[map.id];
      for (const site of sites) {
        for (const side of ['attacker', 'defender']) {
          const key = site.id + '|' + side;
          const c = counts[key] || 0;
          if (c < minCount) {
            minCount = c;
            candidates.length = 0;
          }
          if (c === minCount) {
            candidates.push({ mapId: map.id, siteId: site.id, side });
          }
        }
      }
    }
    const chosen = candidates[i % candidates.length];
    plan.push(chosen);
  }

  // Shuffle plan deterministically to distribute evenly
  // Use a deterministic order based on index hashing
  const shuffled = [];
  const used = new Set();
  for (let i = 0; i < plan.length; i++) {
    // Find the next unassigned index with a deterministic offset
    let idx = (i * 7 + 3) % plan.length;
    while (used.has(idx)) idx = (idx + 1) % plan.length;
    used.add(idx);
    shuffled.push(plan[idx]);
  }

  return shuffled;
}

const PLAN = buildStrategyPlan();

// ============================================================
// ASSIGN OP COUNTS TO STRATEGIES
// We have 250 strategies. Assign op counts per distribution.
// ============================================================
const OP_COUNTS = [];
for (const d of OP_DIST) {
  for (let i = 0; i < d.total; i++) {
    OP_COUNTS.push(d.count);
  }
}

// Shuffle op counts deterministically
const shuffledOpCounts = [];
{
  const used2 = new Set();
  for (let i = 0; i < OP_COUNTS.length; i++) {
    let idx = (i * 11 + 7) % OP_COUNTS.length;
    while (used2.has(idx)) idx = (idx + 1) % OP_COUNTS.length;
    used2.add(idx);
    shuffledOpCounts.push(OP_COUNTS[idx]);
  }
}

// ============================================================
// ASSIGN TIERS (usage_count)
// ============================================================
const TIER_ASSIGNMENTS = [];
for (const t of TIERS) {
  for (let i = 0; i < t.count; i++) {
    TIER_ASSIGNMENTS.push({ min: t.min, max: t.max });
  }
}

// Shuffle tier assignments
const shuffledTiers = [];
{
  const used3 = new Set();
  for (let i = 0; i < TIER_ASSIGNMENTS.length; i++) {
    let idx = (i * 13 + 5) % TIER_ASSIGNMENTS.length;
    while (used3.has(idx)) idx = (idx + 1) % TIER_ASSIGNMENTS.length;
    used3.add(idx);
    shuffledTiers.push(TIER_ASSIGNMENTS[idx]);
  }
}

// ============================================================
// UUID GENERATORS
// ============================================================
let stratCount = 0;
let opCountGlobal = 0;
let imgCountGlobal = 0;
let hotCountGlobal = 0;

function nextStratUuid() {
  stratCount++;
  const hex = stratCount.toString(16).padStart(12, '0').slice(0, 12);
  return `f7000000-0000-0000-0000-${hex}`;
}

function nextOpUuid() {
  opCountGlobal++;
  const hex = opCountGlobal.toString(16).padStart(12, '0').slice(0, 12);
  return `f7100000-0000-0000-0000-${hex}`;
}

function nextImgUuid() {
  imgCountGlobal++;
  const hex = imgCountGlobal.toString(16).padStart(12, '0').slice(0, 12);
  return `f7200000-0000-0000-0000-${hex}`;
}

function nextHotUuid() {
  hotCountGlobal++;
  const hex = hotCountGlobal.toString(16).padStart(12, '0').slice(0, 12);
  return `f7300000-0000-0000-0000-${hex}`;
}

// ============================================================
// BUILD ALL STRATEGIES
// ============================================================

const strategies = [];

for (let i = 0; i < 250; i++) {
  const plan = PLAN[i];
  const side = plan.side;
  const mapId = plan.mapId;
  const siteId = plan.siteId;
  const mapName = MAP_LOOKUP[mapId];
  const siteObj = SITES.find(s => s.id === siteId);
  const siteName = siteObj ? siteObj.name : 'Unknown';
  const opCount = shuffledOpCounts[i];
  const tier = shuffledTiers[i] || { min: 1, max: 5 };

  // Pick a combo
  const combos = side === 'attacker' ? ATT_COMBOS[opCount] : DEF_COMBOS[opCount];
  const combo = pick(combos);

  // Build title
  const tactic = side === 'attacker'
    ? pick(ATT_TACTICS)
    : pick(DEF_TACTICS);
  const shortSite = siteName.split('/')[0].trim();
  const title = `${mapName} ${shortSite} – ${tactic}`;

  // Build description from operator names + roles
  const opNamesStr = combo.join(', ');
  const roleWords = side === 'attacker'
    ? ['breach', 'clear', 'plant', 'flank', 'entry']
    : ['hold', 'deny', 'protect', 'watch', 'trap'];
  const usedWords = [];
  for (let w = 0; w < 3; w++) {
    usedWords.push(roleWords[(i + w) % roleWords.length]);
  }
  let desc;
  if (combo.length === 1) {
    desc = `${combo[0]} solo ${side} pick. ${usedWords.join(' ').replace(/^\w/, c => c.toUpperCase())} for ${side} on ${shortSite}.`;
  } else {
    desc = `${combo[0]} leads with ${combo.slice(1).join(' + ')}. ${usedWords.join(' ').replace(/^\w/, c => c.toUpperCase())} setup for ${side} on ${shortSite}.`;
  }

  // Generate description without quotes that would break SQL
  const cleanTitle = title.replace(/'/g, "''");
  const cleanDesc = desc.replace(/'/g, "''");

  const stratId = nextStratUuid();

  // Image URL for template
  const imgNum = (i + 1).toString().padStart(3, '0');
  const imgUrl = `https://example.com/strategies/${mapName.toLowerCase().replace(/\s+/g, '_')}/${shortSite.toLowerCase().replace(/[^a-z]/g, '_')}/${imgNum}.webp`;

  // usage_count
  const usageCount = tier.min === tier.max
    ? tier.min
    : randInt(tier.min, tier.max);

  // created_by: use a mock profile ID (deterministic from profile range in 00021)
  const creatorIdx = (i % 20) + 1;
  const creatorId = `e1000000-0000-0000-0000-${creatorIdx.toString(16).padStart(12, '0').slice(0, 12)}`;

  strategies.push({
    id: stratId,
    mapId,
    siteId,
    side,
    title: cleanTitle,
    description: cleanDesc,
    imageUrl: imgUrl,
    status: 'approved',
    usageCount,
    createdBy: creatorId,
    operatorIds: combo.map(name => side === 'attacker' ? ATT_OPS[name] : DEF_OPS[name]),
    operatorNames: combo,
    operatorCount: opCount,
  });
}

// ============================================================
// GENERATE SQL
// ============================================================

const lines = [];

function add(s) { lines.push(s); }

add(`-- ============================================================
-- 00022_heavy_strategies.sql — 250 approved strategies
-- AUTO-GENERATED by scripts/generate-heavy-strategies.mjs
-- DO NOT EDIT DIRECTLY
--
-- Generates: 250 strategy_templates, ~750 strategy_operators,
-- ~350 strategy_images, ~700 strategy_hotspots
-- All status = 'approved', includes usage_count power-law tiers
-- ============================================================

`);

// ---- strategy_templates ----
add('-- ============================================================');
add('-- 1. STRATEGY TEMPLATES — 250 entries');
add('-- UUID namespace: f7000000-0000-0000-0000-xxxxxxxxxxxx');
add('-- ============================================================');
add('INSERT INTO strategy_templates (id, map_id, site_id, side, title, description, image_url, status, usage_count, created_by) VALUES');

const stratRows = strategies.map((s, i) => {
  return `  ('${s.id}', '${s.mapId}', '${s.siteId}', '${s.side}', '${s.title}', '${s.description}', '${s.imageUrl}', '${s.status}', ${s.usageCount}, '${s.createdBy}')`;
});
add(stratRows.join(',\n'));
add('ON CONFLICT (id) DO NOTHING;\n');

// ---- strategy_operators ----
add('-- ============================================================');
add('-- 2. STRATEGY OPERATORS — ~750 entries');
add('-- UUID namespace: f7100000-0000-0000-0000-xxxxxxxxxxxx');
add('-- ============================================================');

const opRows = [];
for (const s of strategies) {
  for (let j = 0; j < s.operatorIds.length; j++) {
    const opUuid = nextOpUuid();
    opRows.push(`  ('${opUuid}', '${s.id}', '${s.operatorIds[j]}', ${j})`);
  }
}

// Write operators in batches of 100
for (let i = 0; i < opRows.length; i += 100) {
  const batch = opRows.slice(i, i + 100);
  add('INSERT INTO strategy_operators (id, strategy_id, operator_id, sort_order) VALUES');
  add(batch.join(',\n'));
  add('ON CONFLICT (id) DO NOTHING;\n');
}

// ---- strategy_images ----
add('-- ============================================================');
add('-- 3. STRATEGY IMAGES — 1-2 per strategy (~350 entries)');
add('-- UUID namespace: f7200000-0000-0000-0000-xxxxxxxxxxxx');
add('-- ============================================================');

const imgRows = [];
for (const s of strategies) {
  const numImgs = (imgRows.length + s.operatorCount) % 3 === 0 ? 2 : 1;
  for (let j = 0; j < numImgs; j++) {
    const imgUuid = nextImgUuid();
    const imgNum2 = imgCountGlobal;
    const caption = j === 0 ? 'Main setup view' : 'Alternate angle / variant';
    const imgUrl2 = s.imageUrl.replace('.webp', j === 0 ? '.webp' : `_v${j}.webp`);
    imgRows.push(`  ('${imgUuid}', '${s.id}', '${imgUrl2}', ${j}, '${caption}')`);
  }
}

// Write images in batches of 100
for (let i = 0; i < imgRows.length; i += 100) {
  const batch = imgRows.slice(i, i + 100);
  add('INSERT INTO strategy_images (id, strategy_id, image_url, sort_order, caption) VALUES');
  add(batch.join(',\n'));
  add('ON CONFLICT (id) DO NOTHING;\n');
}

// ---- strategy_hotspots ----
add('-- ============================================================');
add('-- 4. STRATEGY HOTSPOTS — 2-3 per strategy (~700 entries)');
add('-- UUID namespace: f7300000-0000-0000-0000-xxxxxxxxxxxx');
add('-- ============================================================');

// Collect image IDs per strategy for the image_id FK
const stratImageIds = {};
// We need to rebuild them deterministically
{
  let localImgCount = 0;
  for (const s of strategies) {
    const numImgs = (stratImageIds[s.id] || []).length === 0
      ? ((localImgCount + s.operatorCount) % 3 === 0 ? 2 : 1)
      : 0;
    // Actually rebuild
  }
}

// Simpler approach: rebuild image UUIDs deterministically
function getImageIdsForStrat(stratId, stratIdx) {
  const count = (stratIdx + strategies[stratIdx].operatorCount) % 3 === 0 ? 2 : 1;
  const ids = [];
  for (let j = 0; j < count; j++) {
    // Calculate the UUID that was assigned
    const imgNum = (() => {
      let cnt = 0;
      for (let si = 0; si < stratIdx; si++) {
        const nc = (si + strategies[si].operatorCount) % 3 === 0 ? 2 : 1;
        cnt += nc;
      }
      return cnt + j + 1;
    })();
    const hex = imgNum.toString(16).padStart(12, '0').slice(0, 12);
    ids.push(`f7200000-0000-0000-0000-${hex}`);
  }
  return ids;
}

const hotRows = [];
for (let i = 0; i < strategies.length; i++) {
  const s = strategies[i];
  const numSpots = 2 + (i % 2); // 2 or 3
  const zones = HOTSPOT_ZONES[s.mapId] || HOTSPOT_ZONES[MAPS[0].id];

  const imageIds = getImageIdsForStrat(s.id, i);

  for (let j = 0; j < numSpots; j++) {
    const hotUuid = nextHotUuid();
    const zone = zones[j % zones.length];
    const xPct = randFloat(zone.xMin, zone.xMax);
    const yPct = randFloat(zone.yMin, zone.yMax);
    // Pick the first image as default hotspot image, or null
    const imgId = j === 0 && imageIds.length > 0 ? `'${imageIds[0]}'` : 'NULL';
    const label = zone.label;
    hotRows.push(`  ('${hotUuid}', '${s.id}', ${imgId}, ${xPct.toFixed(2)}, ${yPct.toFixed(2)}, '${label}')`);
  }
}

// Write hotspots in batches of 100
for (let i = 0; i < hotRows.length; i += 100) {
  const batch = hotRows.slice(i, i + 100);
  add('INSERT INTO strategy_hotspots (id, strategy_id, image_id, x_percent, y_percent, label) VALUES');
  add(batch.join(',\n'));
  add('ON CONFLICT (id) DO NOTHING;\n');
}

// ---- VERIFICATION QUERIES ----
add(`-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- SELECT COUNT(*) FROM strategy_templates;               -- 250
-- SELECT side, COUNT(*) FROM strategy_templates GROUP BY side;  -- ~125 each
-- SELECT COUNT(*) FROM strategy_operators;                -- ~750
-- SELECT COUNT(*) FROM strategy_images;                   -- ~350
-- SELECT COUNT(*) FROM strategy_hotspots;                 -- ~700

-- Check FK integrity:
-- SELECT COUNT(*) FROM strategy_templates st
--   LEFT JOIN maps m ON m.id = st.map_id
--   WHERE m.id IS NULL;  -- 0

-- Check coverage per site (each site should have 4+ strategies):
-- SELECT s.name, COUNT(*) FROM strategy_templates st
--   JOIN sites s ON s.id = st.site_id
--   GROUP BY s.name ORDER BY s.name;
`);

// Write file
const content = lines.join('\n');
writeFileSync(outFile, content, 'utf-8');

// ============================================================
// REPORT
// ============================================================
const attCount = strategies.filter(s => s.side === 'attacker').length;
const defCount = strategies.filter(s => s.side === 'defender').length;

console.log('=== Heavy Strategies Generator ===');
console.log(`Generated: ${outFile}`);
console.log(`File size: ${(content.length / 1024).toFixed(1)} KB`);
console.log('');
console.log('Row counts:');
console.log(`  strategy_templates:  ${strategies.length}`);
console.log(`    attacker:          ${attCount}`);
console.log(`    defender:          ${defCount}`);
console.log(`  strategy_operators:  ${opRows.length}`);
console.log(`  strategy_images:     ${imgRows.length}`);
console.log(`  strategy_hotspots:   ${hotRows.length}`);
console.log('');

// Count by op count
const opCountDist = {};
for (const s of strategies) {
  const key = `${s.operatorCount}-op`;
  opCountDist[key] = (opCountDist[key] || 0) + 1;
}
console.log('Distribution by op count:');
for (const [k, v] of Object.entries(opCountDist).sort()) {
  console.log(`  ${k}: ${v}`);
}

// Coverage stats
const siteCoverage = {};
for (const s of strategies) {
  if (!siteCoverage[s.siteId]) siteCoverage[s.siteId] = { att: 0, def: 0 };
  siteCoverage[s.siteId][s.side]++;
}
let minCoverage = Infinity;
for (const [siteId, sides] of Object.entries(siteCoverage)) {
  const total = sides.att + sides.def;
  if (total < minCoverage) minCoverage = total;
}
console.log(`\nMin strategies per site: ${minCoverage} (target >= 4)`);

// Usage count range
const usageCounts = strategies.map(s => s.usageCount);
console.log(`Usage count range: ${Math.min(...usageCounts)} - ${Math.max(...usageCounts)}`);

const siteNames = Object.keys(siteCoverage).length;
console.log(`Sites covered: ${siteNames} / ${SITES.length}`);
