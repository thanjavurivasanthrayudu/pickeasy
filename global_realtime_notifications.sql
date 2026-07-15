-- Ensures Realtime is fully enabled
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END
  $$;

  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if already added
COMMIT;


-- Master Trigger for Booking Updates (Sends Notifications to both Mechanics and Customers)
CREATE OR REPLACE FUNCTION handle_booking_updates_notify()
RETURNS TRIGGER AS $$
DECLARE
  v_mechanic_user_id UUID;
  v_customer_user_id UUID;
BEGIN
  -- We only fire if status changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- 1. Get Customer User ID
  SELECT user_id INTO v_customer_user_id FROM customers WHERE id = NEW.customer_id;
  
  -- 2. Get Mechanic User ID if assigned
  IF NEW.mechanic_id IS NOT NULL THEN
    SELECT user_id INTO v_mechanic_user_id FROM mechanics WHERE id = NEW.mechanic_id;
  END IF;


  -- Define the notifications based on status
  CASE NEW.status
    WHEN 'assigned' THEN
      -- Notify Customer
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (v_customer_user_id, 'Mechanic Assigned', 'A mechanic has been assigned to your booking #' || NEW.booking_number, 'booking');
      
      -- Notify Mechanic
      IF v_mechanic_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, type)
        VALUES (v_mechanic_user_id, 'New Job Assigned', 'You have been assigned to booking #' || NEW.booking_number, 'booking');
      END IF;

    WHEN 'accepted' THEN
       INSERT INTO notifications (user_id, title, body, type)
       VALUES (v_customer_user_id, 'Mechanic on the way', 'The mechanic is on their way for booking #' || NEW.booking_number, 'booking');
       
    WHEN 'arrived' THEN
       INSERT INTO notifications (user_id, title, body, type)
       VALUES (v_customer_user_id, 'Mechanic Arrived', 'The mechanic has arrived for booking #' || NEW.booking_number, 'booking');
       
    WHEN 'in_progress' THEN
       INSERT INTO notifications (user_id, title, body, type)
       VALUES (v_customer_user_id, 'Service Started', 'Service has started for booking #' || NEW.booking_number, 'booking');

    WHEN 'inspection_done' THEN
       INSERT INTO notifications (user_id, title, body, type)
       VALUES (v_customer_user_id, 'Inspection Completed', 'The inspection report is ready for booking #' || NEW.booking_number, 'booking');

    WHEN 'awaiting_payment' THEN
       INSERT INTO notifications (user_id, title, body, type)
       VALUES (v_customer_user_id, 'Payment Required', 'Service for booking #' || NEW.booking_number || ' is complete. Please complete the payment.', 'payment');

    WHEN 'completed' THEN
       INSERT INTO notifications (user_id, title, body, type)
       VALUES (v_customer_user_id, 'Service Complete', 'Booking #' || NEW.booking_number || ' is completed and paid!', 'booking');
       IF v_mechanic_user_id IS NOT NULL THEN
         INSERT INTO notifications (user_id, title, body, type)
         VALUES (v_mechanic_user_id, 'Job Completed', 'Booking #' || NEW.booking_number || ' is complete!', 'booking');
       END IF;

    ELSE
       -- Do nothing for other states
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_booking_updates_notify ON bookings;
CREATE TRIGGER trigger_booking_updates_notify
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION handle_booking_updates_notify();


-- Master Trigger for NEW Bookings (Sends Notifications to Admins)
CREATE OR REPLACE FUNCTION handle_new_booking_notify()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Notify the customer (optional, usually front-end does it, but we can do it here)
  INSERT INTO notifications (user_id, title, body, type)
  VALUES (
    (SELECT user_id FROM customers WHERE id = NEW.customer_id), 
    'Booking Confirmed', 
    'Your booking #' || NEW.booking_number || ' has been received.', 
    'booking'
  );

  -- Notify all Admins
  FOR v_admin_id IN (SELECT id FROM profiles WHERE role = 'admin') LOOP
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (v_admin_id, 'New Booking Received', 'Booking #' || NEW.booking_number || ' needs assignment.', 'booking');
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_booking_notify ON bookings;
CREATE TRIGGER trigger_new_booking_notify
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION handle_new_booking_notify();
