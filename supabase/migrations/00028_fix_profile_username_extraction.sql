-- ============================================================
-- 00028_fix_profile_username_extraction.sql
-- Fix: estrazione nome utente dalla metadata di auth.
-- Prima leggeva solo raw_user_meta_data->>'username' (mai settato)
-- => tutti gli utenti finivano con 'guest-xxxxxxxx'.
-- Ora catena: metadata.name (Discord/OAuth) -> metadata.username -> guest.
-- L'email NON viene usata come fallback: chi non ha nome reale
-- deve passare dall'onboarding ("completa profilo").
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    meta_name     TEXT;
    meta_username TEXT;
BEGIN
    meta_name     := NULLIF(NEW.raw_user_meta_data->>'name', '');
    meta_username := NULLIF(NEW.raw_user_meta_data->>'username', '');

    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(meta_name, meta_username, 'guest-' || substr(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
