-- Add driversLicense and pii to clients
ALTER TABLE "clients" ADD COLUMN "driversLicense" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "clients" ADD COLUMN "pii" jsonb DEFAULT '{}'::jsonb;

-- Migrate existing client DL and PII data
UPDATE clients c
SET "driversLicense" = p."driversLicense",
    "pii" = p."pii"
FROM people p
WHERE c."personId" = p.id;

-- Migrate family member Gender and DOB into the Client's familyMembers JSONB list
WITH updated_family_members AS (
  SELECT 
    c.id AS client_id,
    jsonb_agg(
      m || jsonb_build_object(
        'gender', p.pii->>'biologicalGender',
        'birthDate', p.pii->>'birthDate'
      )
    ) AS new_family_members
  FROM clients c
  CROSS JOIN LATERAL jsonb_array_elements(c."familyMembers") AS m
  JOIN people p ON p.id = (m->>'personId')::uuid
  GROUP BY c.id
)
UPDATE clients c
SET "familyMembers" = u.new_family_members
FROM updated_family_members u
WHERE c.id = u.client_id;

-- Drop driversLicense and pii from people
ALTER TABLE "people" DROP COLUMN "driversLicense";
ALTER TABLE "people" DROP COLUMN "pii";
