-- Migration 0013: Enable Realtime replication for note_notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'note_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "note_notifications";
  END IF;
END $$;

ALTER TABLE "note_notifications" REPLICA IDENTITY FULL;

-- Ensure RLS is active and authenticated users can access their notifications
ALTER TABLE "note_notifications" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access" ON "note_notifications";
CREATE POLICY "Allow authenticated full access"
ON "note_notifications"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
