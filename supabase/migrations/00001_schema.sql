-- ============================================================
-- Relay v2 — Schema consolidato
-- Da eseguire su database vuoto. Idempotente (IF NOT EXISTS).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- is_lobby_member — SECURITY DEFINER function per RLS
-- Deve essere prima di tutte le policy che la referenziano
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_lobby_member(p_lobby_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM lobby_members
        WHERE lobby_id = p_lobby_id
          AND user_id = auth.uid()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_lobby_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_lobby_member(uuid) TO authenticated;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username    TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- MAPS
-- ============================================================
CREATE TABLE IF NOT EXISTS maps (
    id         UUID PRIMARY KEY,
    name       TEXT NOT NULL,
    image_url  TEXT
);

ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maps_select" ON maps;
CREATE POLICY "maps_select" ON maps FOR SELECT USING (true);

-- ============================================================
-- SITES
-- ============================================================
CREATE TABLE IF NOT EXISTS sites (
    id       UUID PRIMARY KEY,
    map_id   UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    name     TEXT NOT NULL,
    floor    TEXT
);
CREATE INDEX IF NOT EXISTS idx_sites_map_id ON sites (map_id);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sites_select" ON sites;
CREATE POLICY "sites_select" ON sites FOR SELECT USING (true);

-- ============================================================
-- OPERATORS
-- ============================================================
CREATE TABLE IF NOT EXISTS operators (
    id       UUID PRIMARY KEY,
    name     TEXT NOT NULL,
    side     TEXT NOT NULL CHECK (side IN ('attacker', 'defender')),
    icon_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_operators_side ON operators (side);

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "operators_select" ON operators;
CREATE POLICY "operators_select" ON operators FOR SELECT USING (true);

-- ============================================================
-- LOBBIES
-- ============================================================
CREATE TABLE IF NOT EXISTS lobbies (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code     TEXT UNIQUE NOT NULL,
    leader_id     UUID NOT NULL REFERENCES profiles(id),
    phase         TEXT NOT NULL DEFAULT 'waiting'
                  CHECK (phase IN ('waiting', 'playing', 'closed')),
    map_id        UUID REFERENCES maps(id) ON DELETE SET NULL,
    starting_side TEXT CHECK (starting_side IN ('attacker', 'defender')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lobbies_room_code ON lobbies (room_code);
CREATE INDEX IF NOT EXISTS idx_lobbies_leader_id ON lobbies (leader_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_phase     ON lobbies (phase);
CREATE INDEX IF NOT EXISTS idx_lobbies_map_id    ON lobbies (map_id);

ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lobbies_select_member" ON lobbies;
CREATE POLICY "lobbies_select_member" ON lobbies FOR SELECT
    USING (leader_id = auth.uid() OR is_lobby_member(id));

DROP POLICY IF EXISTS "lobbies_insert_own" ON lobbies;
CREATE POLICY "lobbies_insert_own" ON lobbies FOR INSERT
    WITH CHECK (leader_id = auth.uid());

DROP POLICY IF EXISTS "lobbies_update_leader" ON lobbies;
CREATE POLICY "lobbies_update_leader" ON lobbies FOR UPDATE
    USING (leader_id = auth.uid()) WITH CHECK (leader_id = auth.uid());

DROP POLICY IF EXISTS "lobbies_delete_leader" ON lobbies;
CREATE POLICY "lobbies_delete_leader" ON lobbies FOR DELETE
    USING (leader_id = auth.uid());

-- ============================================================
-- LOBBY_MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS lobby_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id   UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES profiles(id),
    joined_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (lobby_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_lobby_members_lobby_id ON lobby_members (lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_members_user_id  ON lobby_members (user_id);

ALTER TABLE lobby_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lobby_members_select" ON lobby_members;
CREATE POLICY "lobby_members_select" ON lobby_members FOR SELECT
    USING (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "lobby_members_insert_own" ON lobby_members;
CREATE POLICY "lobby_members_insert_own" ON lobby_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "lobby_members_delete_own" ON lobby_members;
CREATE POLICY "lobby_members_delete_own" ON lobby_members FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- ROUNDS
-- ============================================================
CREATE TABLE IF NOT EXISTS rounds (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id      UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    round_number  INTEGER NOT NULL,
    status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    team_side     TEXT CHECK (team_side IN ('attacker', 'defender')),
    winner_side   TEXT CHECK (winner_side IN ('attacker', 'defender')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (lobby_id, round_number)
);
CREATE INDEX IF NOT EXISTS idx_rounds_lobby_id ON rounds (lobby_id);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rounds_select" ON rounds;
CREATE POLICY "rounds_select" ON rounds FOR SELECT
    USING (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "rounds_insert" ON rounds;
CREATE POLICY "rounds_insert" ON rounds FOR INSERT
    WITH CHECK (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "rounds_update" ON rounds;
CREATE POLICY "rounds_update" ON rounds FOR UPDATE
    USING (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "rounds_delete" ON rounds;
CREATE POLICY "rounds_delete" ON rounds FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM lobbies WHERE lobbies.id = rounds.lobby_id AND lobbies.leader_id = auth.uid()
    ));

-- ============================================================
-- LOBBY_BANS
-- ============================================================
CREATE TABLE IF NOT EXISTS lobby_bans (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id     UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    operator_id  UUID NOT NULL REFERENCES operators(id),
    side         TEXT NOT NULL CHECK (side IN ('attacker', 'defender')),
    round_id     UUID NOT NULL REFERENCES rounds(id),
    created_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (lobby_id, operator_id, side, round_id)
);
CREATE INDEX IF NOT EXISTS idx_lobby_bans_lobby_id   ON lobby_bans (lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_bans_round_id   ON lobby_bans (round_id);
CREATE INDEX IF NOT EXISTS idx_lobby_bans_operator_id ON lobby_bans (operator_id);

ALTER TABLE lobby_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lobby_bans_select" ON lobby_bans;
CREATE POLICY "lobby_bans_select" ON lobby_bans FOR SELECT
    USING (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "lobby_bans_insert" ON lobby_bans;
CREATE POLICY "lobby_bans_insert" ON lobby_bans FOR INSERT
    WITH CHECK (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "lobby_bans_update" ON lobby_bans;
CREATE POLICY "lobby_bans_update" ON lobby_bans FOR UPDATE
    USING (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "lobby_bans_delete" ON lobby_bans;
CREATE POLICY "lobby_bans_delete" ON lobby_bans FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM lobbies WHERE lobbies.id = lobby_bans.lobby_id AND lobbies.leader_id = auth.uid()
    ));

-- ============================================================
-- LOBBY_SELECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS lobby_selections (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id     UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES profiles(id),
    round_id     UUID NOT NULL REFERENCES rounds(id),
    map_id       UUID REFERENCES maps(id),
    site_id      UUID REFERENCES sites(id),
    operator_id  UUID REFERENCES operators(id),
    locked_at    TIMESTAMPTZ,
    UNIQUE (lobby_id, user_id, round_id)
);
CREATE INDEX IF NOT EXISTS idx_lobby_selections_lobby_id ON lobby_selections (lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_selections_user_id  ON lobby_selections (user_id);
CREATE INDEX IF NOT EXISTS idx_lobby_selections_round_id ON lobby_selections (round_id);

ALTER TABLE lobby_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lobby_selections_select" ON lobby_selections;
CREATE POLICY "lobby_selections_select" ON lobby_selections FOR SELECT
    USING (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "lobby_selections_insert_own" ON lobby_selections;
CREATE POLICY "lobby_selections_insert_own" ON lobby_selections FOR INSERT
    WITH CHECK (user_id = auth.uid() AND is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "lobby_selections_update_own" ON lobby_selections;
CREATE POLICY "lobby_selections_update_own" ON lobby_selections FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "lobby_selections_delete_own" ON lobby_selections;
CREATE POLICY "lobby_selections_delete_own" ON lobby_selections FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- STRATEGY_TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_templates (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id       UUID REFERENCES maps(id),
    site_id      UUID REFERENCES sites(id),
    side         TEXT CHECK (side IN ('attacker', 'defender')),
    title        TEXT NOT NULL,
    description  TEXT,
    image_url    TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
    usage_count  INTEGER NOT NULL DEFAULT 0,
    created_by   UUID REFERENCES profiles(id),
    created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_map_id     ON strategy_templates (map_id);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_site_id    ON strategy_templates (site_id);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_status     ON strategy_templates (status);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_created_by ON strategy_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_rec
    ON strategy_templates (map_id, site_id, side, status);

ALTER TABLE strategy_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strategy_templates_select_approved" ON strategy_templates;
CREATE POLICY "strategy_templates_select_approved" ON strategy_templates FOR SELECT
    USING (status = 'approved');

DROP POLICY IF EXISTS "strategy_templates_insert_own" ON strategy_templates;
CREATE POLICY "strategy_templates_insert_own" ON strategy_templates FOR INSERT
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "strategy_templates_update_validator" ON strategy_templates;
CREATE POLICY "strategy_templates_update_validator" ON strategy_templates FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'validator'
    ));

-- ============================================================
-- STRATEGY_OPERATORS (M:N strategia ↔ operatori)
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_operators (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id  UUID NOT NULL REFERENCES strategy_templates(id) ON DELETE CASCADE,
    operator_id  UUID NOT NULL REFERENCES operators(id),
    sort_order   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (strategy_id, operator_id)
);
CREATE INDEX IF NOT EXISTS idx_strategy_operators_strategy ON strategy_operators (strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_operators_operator ON strategy_operators (operator_id);

ALTER TABLE strategy_operators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strategy_operators_select" ON strategy_operators;
CREATE POLICY "strategy_operators_select" ON strategy_operators FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_operators.strategy_id
          AND strategy_templates.status = 'approved'
    ));

DROP POLICY IF EXISTS "strategy_operators_insert_own" ON strategy_operators;
CREATE POLICY "strategy_operators_insert_own" ON strategy_operators FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_operators.strategy_id
          AND strategy_templates.created_by = auth.uid()
    ));

DROP POLICY IF EXISTS "strategy_operators_delete_own" ON strategy_operators;
CREATE POLICY "strategy_operators_delete_own" ON strategy_operators FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_operators.strategy_id
          AND strategy_templates.created_by = auth.uid()
    ));

-- ============================================================
-- STRATEGY_IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_images (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id  UUID NOT NULL REFERENCES strategy_templates(id) ON DELETE CASCADE,
    image_url    TEXT NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    caption      TEXT,
    created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_strategy_images_strategy ON strategy_images (strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_images_sort    ON strategy_images (strategy_id, sort_order);

ALTER TABLE strategy_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strategy_images_select" ON strategy_images;
CREATE POLICY "strategy_images_select" ON strategy_images FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_images.strategy_id
          AND strategy_templates.status = 'approved'
    ));

DROP POLICY IF EXISTS "strategy_images_insert_own" ON strategy_images;
CREATE POLICY "strategy_images_insert_own" ON strategy_images FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_images.strategy_id
          AND strategy_templates.created_by = auth.uid()
    ));

DROP POLICY IF EXISTS "strategy_images_update_own" ON strategy_images;
CREATE POLICY "strategy_images_update_own" ON strategy_images FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_images.strategy_id
          AND strategy_templates.created_by = auth.uid()
    ));

DROP POLICY IF EXISTS "strategy_images_delete_own" ON strategy_images;
CREATE POLICY "strategy_images_delete_own" ON strategy_images FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_images.strategy_id
          AND strategy_templates.created_by = auth.uid()
    ));

-- ============================================================
-- STRATEGY_HOTSPOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_hotspots (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id  UUID NOT NULL REFERENCES strategy_templates(id) ON DELETE CASCADE,
    image_id     UUID REFERENCES strategy_images(id) ON DELETE SET NULL,
    x_percent    DECIMAL(5,2) NOT NULL,
    y_percent    DECIMAL(5,2) NOT NULL,
    label        TEXT
);
CREATE INDEX IF NOT EXISTS idx_strategy_hotspots_strategy ON strategy_hotspots (strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_hotspots_image    ON strategy_hotspots (image_id);

ALTER TABLE strategy_hotspots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strategy_hotspots_select" ON strategy_hotspots;
CREATE POLICY "strategy_hotspots_select" ON strategy_hotspots FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_hotspots.strategy_id
          AND strategy_templates.status = 'approved'
    ));

DROP POLICY IF EXISTS "strategy_hotspots_insert_own" ON strategy_hotspots;
CREATE POLICY "strategy_hotspots_insert_own" ON strategy_hotspots FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_hotspots.strategy_id
          AND strategy_templates.created_by = auth.uid()
    ));

DROP POLICY IF EXISTS "strategy_hotspots_delete_own" ON strategy_hotspots;
CREATE POLICY "strategy_hotspots_delete_own" ON strategy_hotspots FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM strategy_templates
        WHERE strategy_templates.id = strategy_hotspots.strategy_id
          AND strategy_templates.created_by = auth.uid()
    ));

-- ============================================================
-- TASK_ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS task_assignments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id     UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES profiles(id),
    round_id     UUID NOT NULL REFERENCES rounds(id),
    strategy_id  UUID NOT NULL REFERENCES strategy_templates(id),
    assigned_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (lobby_id, round_id, strategy_id)
);
CREATE INDEX IF NOT EXISTS idx_task_assignments_lobby_id ON task_assignments (lobby_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id  ON task_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_round_id ON task_assignments (round_id);

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_assignments_select" ON task_assignments;
CREATE POLICY "task_assignments_select" ON task_assignments FOR SELECT
    USING (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "task_assignments_insert" ON task_assignments;
CREATE POLICY "task_assignments_insert" ON task_assignments FOR INSERT
    WITH CHECK (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "task_assignments_update" ON task_assignments;
CREATE POLICY "task_assignments_update" ON task_assignments FOR UPDATE
    USING (is_lobby_member(lobby_id));

DROP POLICY IF EXISTS "task_assignments_delete" ON task_assignments;
CREATE POLICY "task_assignments_delete" ON task_assignments FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM lobbies WHERE lobbies.id = task_assignments.lobby_id AND lobbies.leader_id = auth.uid()
    ));

-- ============================================================
-- TASK_VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS task_votes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_assignment_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
    user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type          TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at         TIMESTAMPTZ DEFAULT now(),
    UNIQUE (task_assignment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_task_votes_assignment_id ON task_votes (task_assignment_id);
CREATE INDEX IF NOT EXISTS idx_task_votes_user_id       ON task_votes (user_id);

ALTER TABLE task_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_votes_select" ON task_votes;
CREATE POLICY "task_votes_select" ON task_votes FOR SELECT
    USING (is_lobby_member(
        (SELECT lobby_id FROM task_assignments WHERE id = task_votes.task_assignment_id)
    ));

DROP POLICY IF EXISTS "task_votes_insert" ON task_votes;
CREATE POLICY "task_votes_insert" ON task_votes FOR INSERT
    WITH CHECK (is_lobby_member(
        (SELECT lobby_id FROM task_assignments WHERE id = task_votes.task_assignment_id)
    ));

DROP POLICY IF EXISTS "task_votes_update_own" ON task_votes;
CREATE POLICY "task_votes_update_own" ON task_votes FOR UPDATE
    USING (user_id = auth.uid() AND is_lobby_member(
        (SELECT lobby_id FROM task_assignments WHERE id = task_votes.task_assignment_id)
    ));

DROP POLICY IF EXISTS "task_votes_delete_own" ON task_votes;
CREATE POLICY "task_votes_delete_own" ON task_votes FOR DELETE
    USING (user_id = auth.uid() AND is_lobby_member(
        (SELECT lobby_id FROM task_assignments WHERE id = task_votes.task_assignment_id)
    ));

-- ============================================================
-- VALIDATION_QUEUE (solo server-side, nessun accesso client)
-- ============================================================
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

ALTER TABLE validation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "validation_queue_no_access" ON validation_queue;
CREATE POLICY "validation_queue_no_access" ON validation_queue FOR ALL
    USING (false) WITH CHECK (false);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'guest-' || substr(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update lobby updated_at on member change
CREATE OR REPLACE FUNCTION public.handle_lobby_member_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.lobbies SET updated_at = now() WHERE id = OLD.lobby_id;
        RETURN OLD;
    ELSE
        UPDATE public.lobbies SET updated_at = now() WHERE id = NEW.lobby_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lobby_member_change ON public.lobby_members;
CREATE TRIGGER on_lobby_member_change
    AFTER INSERT OR UPDATE OR DELETE ON public.lobby_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_lobby_member_change();

-- Close lobby when leader leaves
CREATE OR REPLACE FUNCTION public.handle_leader_leave()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.lobbies
    SET phase = 'closed'
    WHERE id = OLD.lobby_id
      AND leader_id = OLD.user_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_leader_leave ON public.lobby_members;
CREATE TRIGGER on_leader_leave
    AFTER DELETE ON public.lobby_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_leader_leave();

-- Increment strategy usage_count on task assignment (popularity tracker)
CREATE OR REPLACE FUNCTION public.handle_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.strategy_templates
    SET usage_count = usage_count + 1
    WHERE id = NEW.strategy_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_assignment_created ON public.task_assignments;
CREATE TRIGGER on_task_assignment_created
    AFTER INSERT ON public.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_task_assignment();

-- ──────────────────────────────────────────────
-- Grants for anon and authenticated roles
-- ──────────────────────────────────────────────

-- Grant SELECT on reference tables to anon (public read-only data)
GRANT SELECT ON maps TO anon;
GRANT SELECT ON sites TO anon;
GRANT SELECT ON operators TO anon;

-- Grant SELECT on reference tables to authenticated
GRANT SELECT ON maps TO authenticated;
GRANT SELECT ON sites TO authenticated;
GRANT SELECT ON operators TO authenticated;

-- Grant full access on user tables to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON strategy_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON strategy_hotspots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON strategy_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON strategy_operators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lobby_bans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lobby_selections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON validation_queue TO authenticated;

-- Grant usage on sequences (for auto-increment IDs if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
