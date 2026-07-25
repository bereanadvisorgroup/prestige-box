-- Update trigger function to be case-insensitive on email comparison
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists in public.users by email (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM public.users WHERE LOWER(email) = LOWER(NEW.email)
  ) THEN
    -- Update the existing profile's uid and other metadata
    UPDATE public.users
    SET 
      uid = NEW.id,
      "firstName" = COALESCE(NEW.raw_user_meta_data->>'firstName', "firstName", ''),
      "lastName" = COALESCE(NEW.raw_user_meta_data->>'lastName', "lastName", ''),
      role = COALESCE(NEW.raw_user_meta_data->>'role', role, 'client'),
      "updatedAt" = now()
    WHERE LOWER(email) = LOWER(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
