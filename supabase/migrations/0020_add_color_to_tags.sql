-- Migration 0020: Add color and updatedAt to tags table and count function

ALTER TABLE "tags" 
  ADD COLUMN IF NOT EXISTS "color" text DEFAULT '#64748B',
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now();

CREATE OR REPLACE FUNCTION get_tags_with_counts()
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "peopleCount" bigint
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    t.id,
    t.name,
    t.color,
    t."createdAt",
    t."updatedAt",
    COALESCE(p.cnt, 0)::bigint AS "peopleCount"
  FROM tags t
  LEFT JOIN (
    SELECT jsonb_array_elements_text(tags) as tag_name, count(*) as cnt
    FROM people
    WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0
    GROUP BY tag_name
  ) p ON lower(t.name) = lower(p.tag_name)
  ORDER BY t.name ASC;
$$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
