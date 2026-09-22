-- Migration 0021: Add task notifications support to note_notifications table

-- 1. Make noteId nullable so notifications can belong to tasks or other entities
ALTER TABLE "note_notifications" ALTER COLUMN "noteId" DROP NOT NULL;

-- 2. Add taskId column referencing tasks(id) with CASCADE delete
ALTER TABLE "note_notifications" ADD COLUMN IF NOT EXISTS "taskId" uuid REFERENCES "tasks" ("id") ON DELETE CASCADE;

-- 3. Add linkUrl column for flexible routing
ALTER TABLE "note_notifications" ADD COLUMN IF NOT EXISTS "linkUrl" text;

-- 4. Add index on taskId for performance and foreign key checks
CREATE INDEX IF NOT EXISTS "idx_note_notifications_task" ON "note_notifications" ("taskId");

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
