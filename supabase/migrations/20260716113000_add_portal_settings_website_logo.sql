-- Seed default website and logo settings in keyvals if they do not exist
INSERT INTO "keyvals" ("id", "value") VALUES
  ('BUSINESS_WEBSITE', ''),
  ('COMPANY_LOGO_URL', '')
ON CONFLICT ("id") DO NOTHING;
