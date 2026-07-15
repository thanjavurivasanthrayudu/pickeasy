-- Drop restrictive read policies
DROP POLICY IF EXISTS "customers_own" ON customers;
DROP POLICY IF EXISTS "vehicles_own" ON vehicles;

-- Recreate policies for INSERT, UPDATE, DELETE (Customers)
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (user_id = auth.uid());

-- Recreate policies for INSERT, UPDATE, DELETE (Vehicles)
CREATE POLICY "vehicles_insert" ON vehicles FOR INSERT WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "vehicles_update" ON vehicles FOR UPDATE USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "vehicles_delete" ON vehicles FOR DELETE USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- ALLOW READ FOR ALL AUTHENTICATED USERS (Fixes Mechanic Dashboard joins)
CREATE POLICY "customers_select_authenticated" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vehicles_select_authenticated" ON vehicles FOR SELECT USING (auth.role() = 'authenticated');
