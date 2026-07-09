-- ============================================================
-- SQL SCRIPT TO ADD 'admin' ROLE TO DATABASE
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. First, we must alter the ENUM type to accept 'admin' as a valid role.
-- Note: PostgreSQL doesn't allow dropping or replacing enum values easily, so we just add it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'admin') THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
END $$;

-- 2. Ensure your existing admin account gets the correct role.
-- (Replace 'admin@easyride.com' with the email you actually used)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@easyride.com'; -- Or whatever your admin email is!

-- 3. Update the auth.users metadata to match just in case
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
WHERE email = 'admin@easyride.com';