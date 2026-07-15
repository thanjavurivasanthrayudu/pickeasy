-- Recreate the trigger functions with SECURITY DEFINER
-- This allows the functions to insert notifications for ANY user, bypassing RLS blocks

-- Master Trigger for Booking Updates
CREATE OR REPLACE FUNCTION handle_booking_updates_notify()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_mechanic_user_id UUID;
  v_customer_user_id UUID;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_customer_user_id FROM customers WHERE id = NEW.customer_id;
  
  IF NEW.mechanic_id IS NOT NULL THEN
    SELECT user_id INTO v_mechanic_user_id FROM mechanics WHERE id = NEW.mechanic_id;
  END IF;

  CASE NEW.status
    WHEN 'assigned' THEN
      INSERT INTO notifications (user_id, title, body, type) VALUES (v_customer_user_id, 'Mechanic Assigned', 'A mechanic has been assigned to your booking #' || NEW.booking_number, 'booking');
      IF v_mechanic_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, type) VALUES (v_mechanic_user_id, 'New Job Assigned', 'You have been assigned to booking #' || NEW.booking_number, 'booking');
      END IF;
    WHEN 'accepted' THEN
       INSERT INTO notifications (user_id, title, body, type) VALUES (v_customer_user_id, 'Mechanic on the way', 'The mechanic is on their way for booking #' || NEW.booking_number, 'booking');
    WHEN 'arrived' THEN
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
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Master Trigger for NEW Bookings (Notifies Admins)
CREATE OR REPLACE FUNCTION handle_new_booking_notify() 
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  FOR v_admin_id IN (SELECT id FROM profiles WHERE role = 'admin') LOOP
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (v_admin_id, 'New Booking Received', 'Booking #' || NEW.booking_number || ' needs assignment.', 'booking');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
