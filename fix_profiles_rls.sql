-- ============================================================
-- FIX: Allow any logged-in user to read profiles
-- This is required so mechanics can see customer names
-- when viewing their assigned jobs.
-- ============================================================

-- Drop the old restrictive policy (own profile only)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

-- New policy: any authenticated user can read any profile
-- (needed for mechanic → customer name, admin views, etc.)
CREATE POLICY "profiles_select_authenticated"
  ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Keep the update/insert as own-only (security preserved)
-- profiles_update_own and profiles_insert_own remain unchanged
