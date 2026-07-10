-- Workflow Templates: reusable definitions created by admins
CREATE TABLE IF NOT EXISTS "workflow_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text, -- Tiptap HTML
  "createdBy" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Workflow Template Steps: ordered steps belonging to a template
CREATE TABLE IF NOT EXISTS "workflow_template_steps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateId" uuid NOT NULL REFERENCES "workflow_templates"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "setDueDate" boolean NOT NULL DEFAULT false,
  "dueDays" integer, -- 1-7, only when setDueDate
  "dueDateBase" text, -- workflow_start | after_last_step
  "priority" text NOT NULL DEFAULT 'None', -- None | Low | Medium | High
  "description" text, -- Tiptap HTML
  "responsibility" text NOT NULL DEFAULT 'advisor', -- advisor | client
  "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "workflow_template_steps_templateId_idx" ON "workflow_template_steps" ("templateId");

-- Workflow Instances: a snapshot copy of a template assigned to a client or company
CREATE TABLE IF NOT EXISTS "workflow_instances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateId" uuid REFERENCES "workflow_templates"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "description" text, -- Tiptap HTML (snapshot)
  "entityType" text NOT NULL, -- client | company
  "entityId" uuid NOT NULL,
  "startDate" timestamp with time zone NOT NULL DEFAULT now(),
  "createdBy" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "completedAt" timestamp with time zone,
  "completedBy" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "workflow_instances_entity_idx" ON "workflow_instances" ("entityType", "entityId");

-- Workflow Instance Steps: snapshot of template steps with completion tracking
CREATE TABLE IF NOT EXISTS "workflow_instance_steps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instanceId" uuid NOT NULL REFERENCES "workflow_instances"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "setDueDate" boolean NOT NULL DEFAULT false,
  "dueDays" integer,
  "dueDateBase" text, -- workflow_start | after_last_step
  "priority" text NOT NULL DEFAULT 'None',
  "description" text, -- Tiptap HTML
  "responsibility" text NOT NULL DEFAULT 'advisor',
  "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "dueDate" timestamp with time zone, -- resolved due date for this instance
  "completedAt" timestamp with time zone,
  "completedBy" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "workflow_instance_steps_instanceId_idx" ON "workflow_instance_steps" ("instanceId");

-- Enable Row Level Security (RLS)
ALTER TABLE "workflow_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_template_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_instance_steps" ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated users
DROP POLICY IF EXISTS "Allow authenticated select access" ON "workflow_templates";
CREATE POLICY "Allow authenticated select access"
ON "workflow_templates" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated select access" ON "workflow_template_steps";
CREATE POLICY "Allow authenticated select access"
ON "workflow_template_steps" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated select access" ON "workflow_instances";
CREATE POLICY "Allow authenticated select access"
ON "workflow_instances" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated select access" ON "workflow_instance_steps";
CREATE POLICY "Allow authenticated select access"
ON "workflow_instance_steps" FOR SELECT TO authenticated USING (true);

-- Templates write: admins only
DROP POLICY IF EXISTS "Allow admin full access to workflow_templates" ON "workflow_templates";
CREATE POLICY "Allow admin full access to workflow_templates"
ON "workflow_templates" FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow admin full access to workflow_template_steps" ON "workflow_template_steps";
CREATE POLICY "Allow admin full access to workflow_template_steps"
ON "workflow_template_steps" FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Instances write: admins and advisors
DROP POLICY IF EXISTS "Allow staff full access to workflow_instances" ON "workflow_instances";
CREATE POLICY "Allow staff full access to workflow_instances"
ON "workflow_instances" FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role IN ('admin', 'advisor')
  )
);

DROP POLICY IF EXISTS "Allow staff full access to workflow_instance_steps" ON "workflow_instance_steps";
CREATE POLICY "Allow staff full access to workflow_instance_steps"
ON "workflow_instance_steps" FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role IN ('admin', 'advisor')
  )
);
