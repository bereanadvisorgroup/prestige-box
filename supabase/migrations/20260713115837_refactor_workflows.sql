-- Add graph column to workflow_templates
ALTER TABLE "workflow_templates" ADD COLUMN IF NOT EXISTS "graph" jsonb NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb;

-- Add outcomes, positionX, positionY to workflow_template_steps
ALTER TABLE "workflow_template_steps" ADD COLUMN IF NOT EXISTS "outcomes" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "workflow_template_steps" ADD COLUMN IF NOT EXISTS "positionX" numeric DEFAULT 0;
ALTER TABLE "workflow_template_steps" ADD COLUMN IF NOT EXISTS "positionY" numeric DEFAULT 0;

-- Add templateStepId, outcomes, selectedOutcome to workflow_instance_steps
ALTER TABLE "workflow_instance_steps" ADD COLUMN IF NOT EXISTS "templateStepId" uuid REFERENCES "workflow_template_steps"("id") ON DELETE SET NULL;
ALTER TABLE "workflow_instance_steps" ADD COLUMN IF NOT EXISTS "outcomes" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "workflow_instance_steps" ADD COLUMN IF NOT EXISTS "selectedOutcome" jsonb DEFAULT NULL;

-- Generate index for the foreign key column to optimize lookups
CREATE INDEX IF NOT EXISTS "workflow_instance_steps_templateStepId_idx" ON "workflow_instance_steps" ("templateStepId");
