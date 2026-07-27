-- ============================================================
-- 00005_auth_triggers.sql — Auth helpers and profile auto-creation
-- ============================================================

-- --------------------------------
-- Function: auto-create profile on user signup
-- --------------------------------
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

-- --------------------------------
-- Trigger: run on auth.users insert
-- --------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------
-- Function: update lobby updated_at on member change
-- --------------------------------
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

-- --------------------------------
-- Function: mark lobby closed when leader leaves
-- --------------------------------
CREATE OR REPLACE FUNCTION public.handle_leader_leave()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.lobbies
    SET status = 'closed'
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
