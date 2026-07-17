-- Add columns to inspections
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS inspection_result TEXT DEFAULT 'Pending' CHECK (inspection_result IN ('Good', 'Bad', 'Unable to Resolve', 'Pending')),
ADD COLUMN IF NOT EXISTS ai_suggestions JSONB,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES mechanics(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create Audit Log table for Inspections
CREATE TABLE IF NOT EXISTS inspection_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    mechanic_id UUID NOT NULL REFERENCES mechanics(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inspection_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select" ON inspection_audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_insert" ON inspection_audit_logs FOR INSERT WITH CHECK (true);

-- Create Trigger to auto-log changes & notify admin
CREATE OR REPLACE FUNCTION handle_inspection_update() 
RETURNS TRIGGER SECURITY DEFINER AS $func
DECLARE
    v_bike TEXT;
    v_customer TEXT;
    v_mechanic TEXT;
    v_admin_id UUID;
    v_booking_no TEXT;
BEGIN
    IF OLD.inspection_result IS DISTINCT FROM NEW.inspection_result THEN
        -- Insert Audit Log
        INSERT INTO inspection_audit_logs (inspection_id, mechanic_id, old_status, new_status)
        VALUES (NEW.id, NEW.updated_by, OLD.inspection_result, NEW.inspection_result);

        -- Fetch details for notification
        SELECT v.registration_no, p.full_name, b.booking_number
        INTO v_bike, v_customer, v_booking_no
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN customers c ON b.customer_id = c.id
        JOIN profiles p ON c.user_id = p.id
        WHERE b.id = NEW.booking_id;

        SELECT p.full_name INTO v_mechanic
        FROM mechanics m
        JOIN profiles p ON m.user_id = p.id
        WHERE m.id = NEW.mechanic_id;

        -- Create Admin Notification (Find all admins)
        FOR v_admin_id IN SELECT id FROM profiles WHERE role = 'admin' LOOP
            INSERT INTO notifications (user_id, title, body, notification_type, channel)
            VALUES (
                v_admin_id,
                'Inspection Update: ' || NEW.inspection_result,
                'Mechanic ' || COALESCE(v_mechanic, 'Unknown') || ' marked Inspection ' || COALESCE(v_booking_no, '#') || ' as ' || NEW.inspection_result || ' for Bike ' || COALESCE(v_bike, 'Unknown') || '.',
                'system',
                'in_app'
            );
        END LOOP;
    END IF;

    -- Set updated_at
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inspection_update ON inspections;
CREATE TRIGGER trg_inspection_update
BEFORE UPDATE ON inspections
FOR EACH ROW EXECUTE FUNCTION handle_inspection_update();

