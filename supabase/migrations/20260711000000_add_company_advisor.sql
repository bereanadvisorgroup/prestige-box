-- Assigned advisor for a company (mirrors clients.advisorId).
-- An Admin is an advisor with admin capabilities, so both admins and advisors
-- can be assigned. Visibility is unaffected: all admins/advisors see all companies.
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "advisorId" uuid;
