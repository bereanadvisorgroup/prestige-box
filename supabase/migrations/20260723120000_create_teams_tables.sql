-- Create Teams and Team Members tables
CREATE TABLE IF NOT EXISTS "teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read teams"
ON "teams" FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated insert teams"
ON "teams" FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated update teams"
ON "teams" FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated delete teams"
ON "teams" FOR DELETE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

-- Create Team Members table
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "teamId" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES "users"("uid") ON DELETE CASCADE,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "team_members_team_user_unique" UNIQUE ("teamId", "userId")
);

ALTER TABLE "team_members" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "team_members_teamId_idx" ON "team_members" ("teamId");
CREATE INDEX IF NOT EXISTS "team_members_userId_idx" ON "team_members" ("userId");

CREATE POLICY "Allow authenticated read team_members"
ON "team_members" FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated insert team_members"
ON "team_members" FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated update team_members"
ON "team_members" FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated delete team_members"
ON "team_members" FOR DELETE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);
