-- Grant table-level privileges to authenticated role for all user-data tables.
-- RLS policies work on top of these: without table-level privilege, RLS policies
-- are never evaluated and the operation is denied with "permission denied".

-- Profiles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Lobbies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lobbies TO authenticated;

-- Lobby members
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lobby_members TO authenticated;

-- Rounds
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rounds TO authenticated;

-- ── RLS policies ──────────────────────────────────────────────

-- Allow authenticated users to insert their own profile
-- (enables auto-creation when profile doesn't exist yet)
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
