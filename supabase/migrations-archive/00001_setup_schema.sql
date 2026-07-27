-- ============================================================
-- 00001_setup_schema.sql — Core schema for r6hub
-- Creates all tables, constraints, foreign keys, and indexes.
-- Uses IF NOT EXISTS for idempotent migrations.
-- ============================================================

-- --------------------------------
-- Extension: pgcrypto for gen_random_uuid()
-- --------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- --------------------------------
-- Profiles (extends auth.users)
-- --------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username    TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);

-- --------------------------------
-- Maps
-- --------------------------------
CREATE TABLE IF NOT EXISTS maps (
    id         UUID PRIMARY KEY,
    name       TEXT NOT NULL,
    image_url  TEXT
);

-- --------------------------------
-- Sites (bomb sites on each map)
-- --------------------------------
CREATE TABLE IF NOT EXISTS sites (
    id       UUID PRIMARY KEY,
    map_id   UUID REFERENCES maps(id) ON DELETE CASCADE,
    name     TEXT NOT NULL,
    floor    TEXT
);

CREATE INDEX IF NOT EXISTS idx_sites_map_id ON sites (map_id);

-- --------------------------------
-- Operators
-- --------------------------------
CREATE TABLE IF NOT EXISTS operators (
    id       UUID PRIMARY KEY,
    name     TEXT NOT NULL,
    side     TEXT CHECK (side IN ('attacker','defender')),
    icon_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_operators_side ON operators (side);

-- --------------------------------
-- Operator tags (archetype/labels)
-- --------------------------------
CREATE TABLE IF NOT EXISTS operator_tags (
    id           UUID PRIMARY KEY,
    operator_id  UUID REFERENCES operators(id) ON DELETE CASCADE,
    tag          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_operator_tags_operator_id ON operator_tags (operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_tags_tag         ON operator_tags (tag);

-- --------------------------------
-- Lobbies (game sessions)
-- --------------------------------
CREATE TABLE IF NOT EXISTS lobbies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code   TEXT UNIQUE NOT NULL,
    leader_id   UUID NOT NULL REFERENCES profiles(id),
    status      TEXT DEFAULT 'active',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lobbies_room_code  ON lobbies (room_code);
CREATE INDEX IF NOT EXISTS idx_lobbies_leader_id  ON lobbies (leader_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_status     ON lobbies (status);

-- --------------------------------
-- Lobby members (many-to-many)
-- --------------------------------
CREATE TABLE IF NOT EXISTS lobby_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id   UUID REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES profiles(id),
    joined_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (lobby_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lobby_members_lobby_id ON lobby_members (lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_members_user_id  ON lobby_members (user_id);

-- --------------------------------
-- Rounds within a lobby
-- --------------------------------
CREATE TABLE IF NOT EXISTS rounds (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id      UUID REFERENCES lobbies(id) ON DELETE CASCADE,
    round_number  INTEGER NOT NULL,
    status        TEXT DEFAULT 'active',
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (lobby_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_rounds_lobby_id ON rounds (lobby_id);

-- --------------------------------
-- Lobby bans (operator bans per side per round)
-- --------------------------------
CREATE TABLE IF NOT EXISTS lobby_bans (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id     UUID REFERENCES lobbies(id) ON DELETE CASCADE,
    operator_id  UUID REFERENCES operators(id),
    side         TEXT CHECK (side IN ('attacker','defender')),
    round_id     UUID REFERENCES rounds(id),
    created_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (lobby_id, operator_id, side, round_id)
);

CREATE INDEX IF NOT EXISTS idx_lobby_bans_lobby_id   ON lobby_bans (lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_bans_round_id   ON lobby_bans (round_id);
CREATE INDEX IF NOT EXISTS idx_lobby_bans_operator_id ON lobby_bans (operator_id);

-- --------------------------------
-- Lobby selections (per user per round: map, site, operator)
-- --------------------------------
CREATE TABLE IF NOT EXISTS lobby_selections (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id     UUID REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES profiles(id),
    round_id     UUID REFERENCES rounds(id),
    map_id       UUID REFERENCES maps(id),
    site_id      UUID REFERENCES sites(id),
    operator_id  UUID REFERENCES operators(id),
    locked_at    TIMESTAMPTZ,
    UNIQUE (lobby_id, user_id, round_id)
);

CREATE INDEX IF NOT EXISTS idx_lobby_selections_lobby_id   ON lobby_selections (lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_selections_user_id    ON lobby_selections (user_id);
CREATE INDEX IF NOT EXISTS idx_lobby_selections_round_id   ON lobby_selections (round_id);

-- --------------------------------
-- Strategy templates (community strategies)
-- --------------------------------
CREATE TABLE IF NOT EXISTS strategy_templates (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id       UUID REFERENCES maps(id),
    site_id      UUID REFERENCES sites(id),
    title        TEXT NOT NULL,
    description  TEXT,
    image_url    TEXT NOT NULL,
    status       TEXT DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected')),
    created_by   UUID REFERENCES profiles(id),
    created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategy_templates_map_id   ON strategy_templates (map_id);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_site_id  ON strategy_templates (site_id);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_status   ON strategy_templates (status);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_created_by ON strategy_templates (created_by);

-- --------------------------------
-- Strategy tags (categorisation)
-- --------------------------------
CREATE TABLE IF NOT EXISTS strategy_tags (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id  UUID REFERENCES strategy_templates(id) ON DELETE CASCADE,
    tag          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_strategy_tags_strategy_id ON strategy_tags (strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_tags_tag          ON strategy_tags (tag);

-- --------------------------------
-- Strategy hotspots (clickable areas on the map image)
-- --------------------------------
CREATE TABLE IF NOT EXISTS strategy_hotspots (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id  UUID REFERENCES strategy_templates(id) ON DELETE CASCADE,
    x_percent    DECIMAL(5,2) NOT NULL,
    y_percent    DECIMAL(5,2) NOT NULL,
    label        TEXT
);

CREATE INDEX IF NOT EXISTS idx_strategy_hotspots_strategy_id ON strategy_hotspots (strategy_id);

-- --------------------------------
-- Task assignments (player → strategy per round)
-- --------------------------------
CREATE TABLE IF NOT EXISTS task_assignments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id     UUID REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES profiles(id),
    round_id     UUID REFERENCES rounds(id),
    strategy_id  UUID REFERENCES strategy_templates(id),
    assigned_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (lobby_id, round_id, strategy_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_lobby_id    ON task_assignments (lobby_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id     ON task_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_round_id    ON task_assignments (round_id);

-- --------------------------------
-- Validation queue (server-side strategy moderation)
-- --------------------------------
CREATE TABLE IF NOT EXISTS validation_queue (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id  UUID REFERENCES strategy_templates(id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL,
    action       TEXT NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    used_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_validation_queue_strategy_id ON validation_queue (strategy_id);
CREATE INDEX IF NOT EXISTS idx_validation_queue_token_hash  ON validation_queue (token_hash);
