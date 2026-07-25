-- Add notebookUrl column to clients and companies tables
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "notebookUrl" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "notebookUrl" text;
