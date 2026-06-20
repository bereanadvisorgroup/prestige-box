-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Documents are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a document" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update a document" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete a document" ON storage.objects;

-- Create policies for the documents bucket
CREATE POLICY "Documents are publicly accessible" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'documents');

CREATE POLICY "Anyone can upload a document" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'documents'
);

CREATE POLICY "Anyone can update a document" 
ON storage.objects FOR UPDATE TO authenticated 
USING (
    bucket_id = 'documents'
);

CREATE POLICY "Anyone can delete a document" 
ON storage.objects FOR DELETE TO authenticated 
USING (
    bucket_id = 'documents'
);
