-- ============================================================
--  MotoEase — Auto-Profile Trigger
--  Paste this in Supabase SQL Editor AFTER running the main schema.
--  This creates a profile row automatically when a user registers.
-- ============================================================

-- Function: called every time a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Read role from metadata (sent during registration), default to 'customer'
  user_role_val := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'customer'::user_role
  );

  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, email, phone, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    user_role_val,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- If customer, also create a customers row
  IF user_role_val = 'customer' THEN
    INSERT INTO public.customers (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- If mechanic, also create a mechanics row
  IF user_role_val = 'mechanic' THEN
    INSERT INTO public.mechanics (user_id, is_available, is_approved, created_at, updated_at)
    VALUES (NEW.id, FALSE, FALSE, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- OPTIONAL: Disable email confirmation (for local dev/testing)
-- Run this if you want users to log in immediately after signup
-- without needing to verify their email.
-- ============================================================
-- Go to: Supabase Dashboard > Authentication > Providers > Email
-- Toggle OFF "Enable email confirmations"
-- (Cannot be done via SQL — use the Dashboard UI)

-- ============================================================
-- Done! Now register a user on http://localhost:5173/register
-- and a profile row will be auto-created in the DB.
-- ============================================================
