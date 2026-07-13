-- Trigger to auto-generate notifications on new bookings

CREATE OR REPLACE FUNCTION notify_on_new_booking()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
    mechanic_record RECORD;
    customer_name TEXT;
BEGIN
    -- Get customer name
    SELECT full_name INTO customer_name FROM profiles
    JOIN customers ON customers.user_id = profiles.id
    WHERE customers.id = NEW.customer_id;

    IF customer_name IS NULL THEN
        customer_name := 'A customer';
    END IF;

    -- Notify all admins
    FOR admin_record IN (SELECT id FROM profiles WHERE role = 'admin') LOOP
        INSERT INTO notifications (user_id, title, body, notification_type, is_read, reference_id, reference_type)
        VALUES (
            admin_record.id,
            'New Booking Received',
            customer_name || ' has just booked a service! (' || NEW.booking_number || ')',
            'booking_created',
            false,
            NEW.id,
            'booking'
        );
    END LOOP;

    -- Notify all mechanics
    FOR mechanic_record IN (
        SELECT user_id FROM mechanics WHERE is_available = true AND is_approved = true
    ) LOOP
        INSERT INTO notifications (user_id, title, body, notification_type, is_read, reference_id, reference_type)
        VALUES (
            mechanic_record.user_id,
            'New Job Available',
            'A new service job has been requested! Check your open jobs pool.',
            'booking_created',
            false,
            NEW.id,
            'booking'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_new_booking ON bookings;
CREATE TRIGGER trg_notify_on_new_booking
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_booking();

-- Ensure realtime is enabled for the notifications table
alter publication supabase_realtime add table notifications;
