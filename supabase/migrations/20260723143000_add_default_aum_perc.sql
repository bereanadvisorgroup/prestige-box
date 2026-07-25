-- Seed default AUM % in keyvals if it does not exist
INSERT INTO "keyvals" ("id", "value") VALUES
  ('DEFAULT_AUM_PERC', '1')
ON CONFLICT ("id") DO NOTHING;
