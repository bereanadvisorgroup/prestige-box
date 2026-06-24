-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists in public.users by email
  IF EXISTS (
    SELECT 1 FROM public.users WHERE email = NEW.email
  ) THEN
    -- Update the existing profile's uid and other metadata
    UPDATE public.users
    SET 
      uid = NEW.id,
      "firstName" = COALESCE(NEW.raw_user_meta_data->>'firstName', "firstName", ''),
      "lastName" = COALESCE(NEW.raw_user_meta_data->>'lastName', "lastName", ''),
      role = COALESCE(NEW.raw_user_meta_data->>'role', role, 'client'),
      "updatedAt" = now()
    WHERE email = NEW.email;
  ELSE
    -- Block signup if email is not in public.users
    RAISE EXCEPTION 'You do not have an account, please contact our office for assistance.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create keyvals table
CREATE TABLE IF NOT EXISTS "keyvals" (
  "id" text PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE "keyvals" ENABLE ROW LEVEL SECURITY;

-- Policies for keyvals
DROP POLICY IF EXISTS "Allow public read access to keyvals" ON "keyvals";
CREATE POLICY "Allow public read access to keyvals" 
ON "keyvals" 
FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow admin full access to keyvals" ON "keyvals";
CREATE POLICY "Allow admin full access to keyvals" 
ON "keyvals" 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Seed default contact settings
INSERT INTO "keyvals" ("id", "value") VALUES
  ('BUSINESS_EMAIL', 'info@prestigeadvisors360.com'),
  ('BUSINESS_PHONE', '941-799-3300')
ON CONFLICT ("id") DO NOTHING;
