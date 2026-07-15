-- Fix Missing Relationship Data Policies for Mechanics and Admins
-- This script grants SELECT permissions so relationships like customers and vehicles load correctly.

-- 1. Grant SELECT on profiles
CREATE POLICY "profiles_read_auth" ON profiles 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Grant SELECT on customers
CREATE POLICY "customers_read_auth" ON customers 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Grant SELECT on vehicles
CREATE POLICY "vehicles_read_auth" ON vehicles 
  FOR SELECT USING (auth.role() = 'authenticated');
