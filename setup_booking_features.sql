-- Give mechanics access to see unassigned pending jobs
DROP POLICY IF EXISTS "bookings_mechanic" ON bookings;
CREATE POLICY "bookings_mechanic" ON bookings FOR SELECT
  USING (
    mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()) 
    OR 
    (mechanic_id IS NULL AND status = 'pending')
  );

-- Allow mechanics to claim jobs (Update the booking ONLY if it's currently unassigned)
DROP POLICY IF EXISTS "bookings_mechanic_update" ON bookings;
CREATE POLICY "bookings_mechanic_update" ON bookings FOR UPDATE
  USING (
    mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()) 
    OR 
    (mechanic_id IS NULL AND status = 'pending')
  );
