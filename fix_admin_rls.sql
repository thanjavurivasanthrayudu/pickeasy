-- Run this in your Supabase SQL Editor to grant admins the ability to update all profiles
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$ 
BEGIN 
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policy to profiles table
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
CREATE POLICY "admin_all_profiles" ON profiles FOR ALL USING (is_admin());

-- Also add admin policies to mechanics, customers, etc if needed for administration
DROP POLICY IF EXISTS "admin_all_mechanics" ON mechanics;
CREATE POLICY "admin_all_mechanics" ON mechanics FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "admin_all_customers" ON customers;
CREATE POLICY "admin_all_customers" ON customers FOR ALL USING (is_admin());
