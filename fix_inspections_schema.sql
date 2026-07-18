giALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspection_result TEXT DEFAULT 'Pending';
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES mechanics(id);
