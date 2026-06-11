-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Allow public read-only access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their avatars" ON storage.objects;

-- Create policies
CREATE POLICY "Allow public read-only access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND (
    (select auth.uid()::text) = (storage.foldername(name))[1] OR
    (select role from public.users where uid = auth.uid()) = 'admin'
  )
);

CREATE POLICY "Allow authenticated users to update their avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (select auth.uid()::text) = (storage.foldername(name))[1] OR
    (select role from public.users where uid = auth.uid()) = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND (
    (select auth.uid()::text) = (storage.foldername(name))[1] OR
    (select role from public.users where uid = auth.uid()) = 'admin'
  )
);

CREATE POLICY "Allow authenticated users to delete their avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (select auth.uid()::text) = (storage.foldername(name))[1] OR
    (select role from public.users where uid = auth.uid()) = 'admin'
  )
);
