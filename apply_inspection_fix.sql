-- Drop existing policies to prevent 'already exists' errors
DROP POLICY IF EXISTS "inspections_insert" ON inspections;
DROP POLICY IF EXISTS "inspections_update" ON inspections;
DROP POLICY IF EXISTS "inspection_items_insert" ON inspection_items;
DROP POLICY IF EXISTS "inspection_items_select" ON inspection_items;

-- Recreate policies for inspections
CREATE POLICY "inspections_insert" ON inspections FOR INSERT 
  WITH CHECK (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));

CREATE POLICY "inspections_update" ON inspections FOR UPDATE 
  USING (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));

-- Recreate policies for inspection_items
CREATE POLICY "inspection_items_insert" ON inspection_items FOR INSERT 
  WITH CHECK (
    inspection_id IN (SELECT id FROM inspections WHERE mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()))
  );

CREATE POLICY "inspection_items_select" ON inspection_items FOR SELECT 
  USING (
    inspection_id IN (SELECT id FROM inspections)
  );
