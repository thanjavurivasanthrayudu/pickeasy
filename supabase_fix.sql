-- ============================================================
--  EASY RIDE — Supabase Auth Fix Script
--  Run this ENTIRE script in Supabase SQL Editor (► Run)
--  This fixes registration & login issues.
-- ============================================================

-- ── STEP 1: Fix the handle_new_user trigger function ──────
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
  BEGIN
    user_role_val := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'customer'::user_role
    );
  EXCEPTION WHEN invalid_text_representation THEN
    user_role_val := 'customer'::user_role;
  END;

  -- Insert into profiles (UPSERT to avoid conflicts)
  INSERT INTO public.profiles (id, full_name, email, phone, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    NEW.email,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    user_role_val,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name   = COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), public.profiles.full_name),
    email       = COALESCE(NEW.email, public.profiles.email),
    phone       = COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''), public.profiles.phone),
    role        = user_role_val,
    updated_at  = NOW();

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

-- ── STEP 2: Recreate the trigger ──────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── STEP 3: Fix RLS policies — allow users to INSERT their own profile ─
-- (needed if the trigger isn't firing or user creates profile manually)
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all_users" ON public.profiles;

-- Allow authenticated users to read OTHER users' basic info 
-- (needed for mechanic lookup, admin views etc.)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow reading other profiles (for mechanic assignment, admin)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to insert their OWN profile row
-- (fallback if trigger fails)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── STEP 4: Allow customers to insert their own customers row ──────────
DROP POLICY IF EXISTS "customers_own" ON public.customers;

CREATE POLICY "customers_select_own"
  ON public.customers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "customers_insert_own"
  ON public.customers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_update_own"
  ON public.customers FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "customers_delete_own"
  ON public.customers FOR DELETE
  USING (user_id = auth.uid());

-- ── STEP 5: Allow mechanics to insert their own mechanics row ──────────
DROP POLICY IF EXISTS "mechanics_read" ON public.mechanics;
DROP POLICY IF EXISTS "mechanics_own"  ON public.mechanics;

CREATE POLICY "mechanics_select"
  ON public.mechanics FOR SELECT
  USING (is_approved = TRUE OR user_id = auth.uid());

CREATE POLICY "mechanics_insert_own"
  ON public.mechanics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "mechanics_update_own"
  ON public.mechanics FOR UPDATE
  USING (user_id = auth.uid());

-- ── STEP 6: Drop unique constraint on phone (causes issues with test accounts) ─
-- Phone number uniqueness is not enforced — multiple users can share a phone.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_unique;

-- Also ensure email uniqueness uses the auth.users as source of truth (not profiles)
-- Remove any duplicate phone values before backfill
UPDATE public.profiles SET phone = NULL WHERE phone = '9999999999';
UPDATE public.profiles SET phone = NULL
WHERE id NOT IN (
  SELECT DISTINCT ON (phone) id
  FROM public.profiles
  WHERE phone IS NOT NULL
  ORDER BY phone, created_at ASC
);

-- ── STEP 7: Backfill any existing auth users without profiles ──────────
-- Phone is set to NULL here to avoid any uniqueness conflicts on existing data.
INSERT INTO public.profiles (id, full_name, email, phone, role, created_at, updated_at)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), 'User'),
  u.email,
  NULL, -- phone omitted during backfill to avoid unique constraint conflicts
  COALESCE(
    (CASE
       WHEN (u.raw_user_meta_data->>'role') IN ('customer','mechanic','admin')
       THEN (u.raw_user_meta_data->>'role')
       ELSE 'customer'
     END)::user_role,
    'customer'::user_role
  ),
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Also backfill customers table for customer-role users
INSERT INTO public.customers (user_id, created_at, updated_at)
SELECT p.id, NOW(), NOW()
FROM public.profiles p
WHERE p.role = 'customer'
  AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- Also backfill mechanics table for mechanic-role users
INSERT INTO public.mechanics (user_id, is_available, is_approved, created_at, updated_at)
SELECT p.id, FALSE, FALSE, NOW(), NOW()
FROM public.profiles p
WHERE p.role = 'mechanic'
  AND NOT EXISTS (SELECT 1 FROM public.mechanics m WHERE m.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- Done! Run this script in Supabase SQL Editor.
-- After running, test registration & login on your app.
-- ============================================================
