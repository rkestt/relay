-- ============================================================
-- 00031_realtime_publication.sql — abilita Realtime per le tabelle lobby
-- Senza questa migrazione le subscription postgres_changes del client
-- non ricevono eventi: la publication supabase_realtime è vuota.
-- Idempotente (DO block con check pg_publication_tables).
-- ============================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'public.lobby_members',
    'public.lobby_selections',
    'public.lobby_bans',
    'public.rounds'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname || '.' || tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', tbl);
    END IF;
  END LOOP;
END $$;

-- REPLICA IDENTITY FULL: gli eventi DELETE/UPDATE includono la riga completa
-- (il client usa payload.old per rimuovere membri/ban).
ALTER TABLE public.lobby_members REPLICA IDENTITY FULL;
ALTER TABLE public.lobby_selections REPLICA IDENTITY FULL;
ALTER TABLE public.lobby_bans REPLICA IDENTITY FULL;
ALTER TABLE public.rounds REPLICA IDENTITY FULL;
