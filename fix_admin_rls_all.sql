-- ============================================================
-- FIX: Admin RLS policies for ALL tables
-- Run this in Supabase SQL Editor to grant admins full access
-- to inventory, payments, coupons, leaderboard, bookings, etc.
-- ============================================================

-- Ensure the is_admin() helper exists
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$ 
BEGIN 
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── INVENTORY ────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_inventory" ON inventory;
CREATE POLICY "admin_all_inventory" ON inventory FOR ALL USING (is_admin());

-- ── PAYMENTS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_payments" ON payments;
CREATE POLICY "admin_all_payments" ON payments FOR ALL USING (is_admin());

-- ── COUPONS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_coupons" ON coupons;
CREATE POLICY "admin_all_coupons" ON coupons FOR ALL USING (is_admin());

-- ── LEADERBOARD ──────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_leaderboard" ON leaderboard;
CREATE POLICY "admin_all_leaderboard" ON leaderboard FOR ALL USING (is_admin());

-- ── BOOKINGS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_bookings" ON bookings;
CREATE POLICY "admin_all_bookings" ON bookings FOR ALL USING (is_admin());

-- ── REVIEWS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_reviews" ON reviews;
CREATE POLICY "admin_all_reviews" ON reviews FOR ALL USING (is_admin());

-- ── INSPECTIONS ──────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_inspections" ON inspections;
CREATE POLICY "admin_all_inspections" ON inspections FOR ALL USING (is_admin());

-- ── VEHICLES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_vehicles" ON vehicles;
CREATE POLICY "admin_all_vehicles" ON vehicles FOR ALL USING (is_admin());

-- ── NOTIFICATIONS ────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_notifications" ON notifications;
CREATE POLICY "admin_all_notifications" ON notifications FOR ALL USING (is_admin());

-- ── SERVICE CATEGORIES ───────────────────────────────────
DROP POLICY IF EXISTS "admin_all_service_categories" ON service_categories;
CREATE POLICY "admin_all_service_categories" ON service_categories FOR ALL USING (is_admin());

-- ── SERVICE PACKAGES ─────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_service_packages" ON service_packages;
CREATE POLICY "admin_all_service_packages" ON service_packages FOR ALL USING (is_admin());

-- ============================================================
-- Done! Admin now has full access to all tables.
-- ============================================================
