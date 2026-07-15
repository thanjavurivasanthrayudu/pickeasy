-- Allow mechanics to insert and update their inspections
CREATE POLICY "inspections_insert" ON inspections FOR INSERT WITH CHECK (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));
CREATE POLICY "inspections_update" ON inspections FOR UPDATE USING (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));

-- Allow mechanics to insert inspection_items
CREATE POLICY "inspection_items_insert" ON inspection_items FOR INSERT WITH CHECK (
  inspection_id IN (SELECT id FROM inspections WHERE mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()))
);
CREATE POLICY "inspection_items_select" ON inspection_items FOR SELECT USING (
  inspection_id IN (SELECT id FROM inspections) -- simplified read
);
