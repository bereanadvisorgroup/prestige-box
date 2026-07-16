-- Seed default company name and social media settings in keyvals if they do not exist
INSERT INTO "keyvals" ("id", "value") VALUES
  ('COMPANY_NAME', 'Prestige Advisors'),
  ('PORTAL_SOCIAL_MEDIA', '[]')
ON CONFLICT ("id") DO NOTHING;
