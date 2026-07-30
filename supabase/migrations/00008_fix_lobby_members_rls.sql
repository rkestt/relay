-- ============================================================
-- 00006_fix_lobby_members_rls.sql — Fix infinite recursion in
-- lobby_members SELECT policy.
-- ============================================================

-- Helper that checks membership without triggering RLS recursion.
-- SECURITY DEFINER runs with the privileges of the function owner,
-- so the inner SELECT on lobby_members bypasses row-level security.
CREATE OR REPLACE FUNCTION is_lobby_member(p_lobby_id uuid)
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

-- Replace the recursive policy with one that uses the helper.
-- Restrict execution to authenticated users (defence-in-depth).
REVOKE ALL ON FUNCTION is_lobby_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_lobby_member(uuid) TO authenticated;

-- Replace the recursive policy with one that uses the helper.
DROP POLICY IF EXISTS "lobby_members_select_own" ON lobby_members;

CREATE POLICY "lobby_members_select_own"
    ON lobby_members FOR SELECT
    USING (is_lobby_member(lobby_id));
