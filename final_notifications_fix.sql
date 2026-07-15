-- Complete, exhaustive reset of the notification triggers

CREATE OR REPLACE FUNCTION handle_booking_updates_notify()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_mechanic_user_id UUID;
  v_customer_user_id UUID;
BEGIN
  -- We ONLY care if the status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Load the correct user IDs
  SELECT user_id INTO v_customer_user_id FROM customers WHERE id = NEW.customer_id;
  
  IF NEW.mechanic_id IS NOT NULL THEN
    SELECT user_id INTO v_mechanic_user_id FROM mechanics WHERE id = NEW.mechanic_id;
  END IF;

  -- Insert notifications based on the new status
  CASE NEW.status
    WHEN 'mechanic_assigned' THEN
      INSERT INTO notifications (user_id, title, body, type) VALUES (v_customer_user_id, 'Mechanic Assigned', 'A mechanic has been assigned to your booking #' || NEW.booking_number, 'booking');
      IF v_mechanic_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, type) VALUES (v_mechanic_user_id, 'New Job Assigned', 'You have been assigned to booking #' || NEW.booking_number, 'booking');
      END IF;
      
    WHEN 'mechanic_accepted' THEN
       INSERT INTO notifications (user_id, title, body, type) VALUES (v_customer_user_id, 'Mechanic on the way', 'The mechanic has accepted the job and is preparing for booking #' || NEW.booking_number, 'booking');
       
    WHEN 'mechanic_arrived' THEN
       INSERT INTO notifications (user_id, title, body, type) VALUES (v_customer_user_id, 'Mechanic Arrived', 'The mechanic has arrived for booking #' || NEW.booking_number, 'booking');
       
    WHEN 'in_progress' THEN
       INSERT INTO notifications (user_id, title, body, type) VALUES (v_customer_user_id, 'Service Started', 'Service has started for booking #' || NEW.booking_number, 'booking');
       
    WHEN 'inspection_done' THEN
       INSERT INTO notifications (user_id, title, body, type) VALUES (v_customer_user_id, 'Inspection Completed', 'The inspection report is ready for booking #' || NEW.booking_number, 'booking');
       
    WHEN 'awaiting_payment' THEN
       INSERT INTO notifications (user_id, title, body, type) VALUES (v_customer_user_id, 'Payment Required', 'Service for booking #' || NEW.booking_number || ' is complete. Please complete the payment.', 'payment');
       
    WHEN 'completed' THEN
       INSERT INTO notifications (user_id, title, body, type) VALUES (v_customer_user_id, 'Service Complete', 'Booking #' || NEW.booking_number || ' is completed and paid!', 'booking');
       IF v_mechanic_user_id IS NOT NULL THEN
         INSERT INTO notifications (user_id, title, body, type) VALUES (v_mechanic_user_id, 'Job Completed', 'Booking #' || NEW.booking_number || ' is complete!', 'booking');
       END IF;
       
    ELSE
       -- Do nothing
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the update trigger
DROP TRIGGER IF EXISTS trigger_booking_updates_notify ON bookings;
CREATE TRIGGER trigger_booking_updates_notify
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION handle_booking_updates_notify();


-- Also ensure New Bookings correctly notify Admins
CREATE OR REPLACE FUNCTION handle_new_booking_notify() 
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_admin_id UUID;
  v_customer_user_id UUID;
BEGIN
  SELECT user_id INTO v_customer_user_id FROM customers WHERE id = NEW.customer_id;

  BEGIN
    -- Customer Confirmation
    IF v_customer_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (
        v_customer_user_id, 
        'Booking Confirmed', 
        'Your booking #' || COALESCE(NEW.booking_number, NEW.id::text) || ' has been received.', 
        'booking'
      );
    END IF;

    -- Admin Alert
    FOR v_admin_id IN (SELECT id FROM profiles WHERE role = 'admin') LOOP
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (v_admin_id, 'New Booking Received', 'Booking #' || COALESCE(NEW.booking_number, NEW.id::text) || ' needs assignment.', 'booking');
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the insert trigger
DROP TRIGGER IF EXISTS trigger_new_booking_notify ON bookings;
CREATE TRIGGER trigger_new_booking_notify
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION handle_new_booking_notify();
