-- ============================================================
-- Storage bucket per immagini strategie
-- Da eseguire DOPO 00001_schema.sql
-- ============================================================

-- Crea bucket pubblico per immagini strategie
INSERT INTO storage.buckets (id, name, public)
VALUES ('strategies', 'strategies', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: tutti possono vedere
DROP POLICY IF EXISTS "strategies_bucket_select" ON storage.objects;
CREATE POLICY "strategies_bucket_select" ON storage.objects FOR SELECT
    USING (bucket_id = 'strategies');

-- Policy: solo proprietario può caricare (path = user_id/filename)
DROP POLICY IF EXISTS "strategies_bucket_insert_own" ON storage.objects;
CREATE POLICY "strategies_bucket_insert_own" ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'strategies'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: solo proprietario può aggiornare
DROP POLICY IF EXISTS "strategies_bucket_update_own" ON storage.objects;
CREATE POLICY "strategies_bucket_update_own" ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'strategies'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: solo proprietario può cancellare
DROP POLICY IF EXISTS "strategies_bucket_delete_own" ON storage.objects;
CREATE POLICY "strategies_bucket_delete_own" ON storage.objects FOR DELETE
    USING (
        bucket_id = 'strategies'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
