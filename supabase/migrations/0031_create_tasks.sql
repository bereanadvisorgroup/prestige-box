-- Task management: tasks + assignees + associations, plus clients.advisorId

CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL DEFAULT 'New',
	"category" text NOT NULL DEFAULT 'Other',
	"priority" text NOT NULL DEFAULT 'Low',
	"description" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"dueDate" timestamp with time zone NOT NULL,
	"completeDate" timestamp with time zone,
	"source" text NOT NULL DEFAULT 'manual',
	"sourceType" text,
	"sourceRefId" text,
	"createdBy" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now()
);

CREATE TABLE "task_assignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
	"userId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);

CREATE TABLE "task_associations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
	"entityType" text NOT NULL,
	"entityId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);

-- Owning advisor for a client (used to assign auto-generated tasks)
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "advisorId" uuid;

-- Enable RLS (mirrors existing tables: open to authenticated users)
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_assignees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_associations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access" ON "tasks" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "task_assignees" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "task_associations" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_tasks_dueDate" ON "tasks" ("dueDate");
CREATE INDEX IF NOT EXISTS "idx_tasks_status" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "idx_task_assignees_user" ON "task_assignees" ("userId", "taskId");
CREATE INDEX IF NOT EXISTS "idx_task_assignees_task" ON "task_assignees" ("taskId");
CREATE INDEX IF NOT EXISTS "idx_task_associations_entity" ON "task_associations" ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "idx_task_associations_task" ON "task_associations" ("taskId");

-- One auto-generated task per anchor (sourceType + sourceRefId) keeps the sync idempotent
CREATE UNIQUE INDEX IF NOT EXISTS "uq_tasks_auto_anchor" ON "tasks" ("sourceType", "sourceRefId") WHERE "source" = 'auto';

-- Dedup guards on junction tables
CREATE UNIQUE INDEX IF NOT EXISTS "uq_task_assignees" ON "task_assignees" ("taskId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_task_associations" ON "task_associations" ("taskId", "entityType", "entityId");
