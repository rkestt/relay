-- ============================================================
-- 00019_create_storage_bucket.sql — Create "strategies" storage bucket
-- The uploadImage() function in submit pages uploads to this bucket.
-- ============================================================

-- 1. Create the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('strategies', 'strategies', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies for the strategies bucket

-- Anyone can read objects from the strategies bucket (public images)
CREATE POLICY "strategies_bucket_select_all"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'strategies');

-- Authenticated users can upload to their own folder
CREATE POLICY "strategies_bucket_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'strategies'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Authenticated users can update their own objects
CREATE POLICY "strategies_bucket_update_own"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'strategies'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Authenticated users can delete their own objects
CREATE POLICY "strategies_bucket_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'strategies'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
