-- Fix for Customer Booking Creation failure
-- We'll make the new booking notification trigger safer and wrap it to prevent aborting the INSERT

CREATE OR REPLACE FUNCTION handle_new_booking_notify() 
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_admin_id UUID;
  v_customer_user_id UUID;
BEGIN
  -- Safe lookup for customer user_id
  SELECT user_id INTO v_customer_user_id FROM customers WHERE id = NEW.customer_id;

  BEGIN
    IF v_customer_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (
        v_customer_user_id, 
        'Booking Confirmed', 
        'Your booking #' || COALESCE(NEW.booking_number, NEW.id::text) || ' has been received.', 
        'booking'
      );
    END IF;

    -- Notify all Admins safely
    FOR v_admin_id IN (SELECT id FROM profiles WHERE role = 'admin') LOOP
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (v_admin_id, 'New Booking Received', 'Booking #' || COALESCE(NEW.booking_number, NEW.id::text) || ' needs assignment.', 'booking');
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    -- If ANY notification fails, swallow the error so it doesn't break booking creation!
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
