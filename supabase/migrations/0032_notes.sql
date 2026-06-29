-- Migration: Reddit-style threaded notes for admins & advisors
-- Tables: notes (self-referencing thread), note_associations, note_attachments,
-- note_reactions, note_votes, note_notifications.

-- 1. Notes (a note and its replies/sub-replies share one table)
CREATE TABLE IF NOT EXISTS "notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "parentId" uuid REFERENCES "notes" ("id") ON DELETE CASCADE,
  "rootId" uuid,
  "depth" integer DEFAULT 0 NOT NULL,
  "title" text,
  "body" text DEFAULT '' NOT NULL,
  "authorId" uuid,
  "score" integer DEFAULT 0 NOT NULL,
  "isDeleted" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_notes_rootId" ON "notes" ("rootId");
CREATE INDEX IF NOT EXISTS "idx_notes_parentId" ON "notes" ("parentId");
CREATE INDEX IF NOT EXISTS "idx_notes_depth_updatedAt" ON "notes" ("depth", "updatedAt" DESC);

-- 2. Note associations (notes <-> clients/companies)
CREATE TABLE IF NOT EXISTS "note_associations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "entityType" text NOT NULL,
  "entityId" uuid NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_note_associations_noteId" ON "note_associations" ("noteId");
CREATE INDEX IF NOT EXISTS "idx_note_associations_entity" ON "note_associations" ("entityType", "entityId");

-- 3. Note attachments (files + pasted link previews)
CREATE TABLE IF NOT EXISTS "note_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "kind" text DEFAULT 'file' NOT NULL,
  "fileUrl" text,
  "fileName" text,
  "fileSize" integer,
  "mimeType" text,
  "linkUrl" text,
  "linkTitle" text,
  "linkFavicon" text,
  "linkProvider" text,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_note_attachments_noteId" ON "note_attachments" ("noteId");

-- 4. Note reactions (one row per user+emoji)
CREATE TABLE IF NOT EXISTS "note_reactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "userId" uuid NOT NULL,
  "emoji" text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_note_reactions" ON "note_reactions" ("noteId", "userId", "emoji");

-- 5. Note votes (Reddit up/down; one row per user+note)
CREATE TABLE IF NOT EXISTS "note_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "userId" uuid NOT NULL,
  "value" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_note_votes" ON "note_votes" ("noteId", "userId");

-- 6. Note notifications (@mentions + replies)
CREATE TABLE IF NOT EXISTS "note_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "rootId" uuid,
  "recipientId" uuid NOT NULL,
  "actorId" uuid,
  "actorName" text,
  "type" text NOT NULL,
  "preview" text,
  "isRead" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_note_notifications_recipient" ON "note_notifications" ("recipientId", "isRead");

-- 7. Row Level Security — open to authenticated users, mirroring the tasks
-- tables (0031). Server actions run with the service-role key; the /dashboard
-- route guard already enforces MFA (AAL2) at the application layer, and the
-- notes UI is gated to admin/advisor roles there.
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_associations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access" ON "notes" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_associations" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_attachments" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_reactions" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_votes" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_notifications" FOR ALL TO authenticated USING (true) WITH CHECK (true);
