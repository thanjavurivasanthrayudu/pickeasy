-- 1. Updates Function (Handles Status Changes)
CREATE OR REPLACE FUNCTION handle_booking_updates_notify()
RETURNS TRIGGER SECURITY DEFINER AS $$
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
    -- Admin assigns a mechanic (Admin Accepts)
    WHEN 'mechanic_assigned' THEN
      INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
      VALUES (v_customer_user_id, 'Service Request Accepted', 'Your service request has been accepted.', 'booking', false, 'booking_assigned');
      
      IF v_mechanic_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
        VALUES (v_mechanic_user_id, 'New Job Assigned', 'You have been assigned a new service request.', 'booking', false, 'booking_assigned');
      END IF;

    -- Booking gets outright rejected by the Mechanic
    WHEN 'mechanic_rejected' THEN
       INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
       VALUES (v_customer_user_id, 'Service Request Rejected', 'Your service request has been rejected by the mechanic.', 'booking', false, 'system');
       
    WHEN 'cancelled' THEN
       INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
       VALUES (v_customer_user_id, 'Service Request Cancelled', 'Your service request has been cancelled.', 'booking', false, 'system');

    WHEN 'mechanic_accepted' THEN
       INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
       VALUES (v_customer_user_id, 'Mechanic on the way', 'The mechanic is on their way for booking #' || NEW.booking_number, 'booking', false, 'system');
       
    -- Mechanic arrived
    WHEN 'mechanic_arrived' THEN
       INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
       VALUES (v_customer_user_id, 'Mechanic Arrived', 'The mechanic has arrived for booking #' || NEW.booking_number, 'booking', false, 'mechanic_arrived');
       
    WHEN 'in_progress' THEN
       INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
       VALUES (v_customer_user_id, 'Service Started', 'Service has started for booking #' || NEW.booking_number, 'booking', false, 'system');

    WHEN 'inspection_done' THEN
       INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
       VALUES (v_customer_user_id, 'Inspection Completed', 'The inspection report is ready for booking #' || NEW.booking_number, 'booking', false, 'system');

    WHEN 'awaiting_payment' THEN
       INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
       VALUES (v_customer_user_id, 'Payment Required', 'Service for booking #' || NEW.booking_number || ' is complete. Please complete the payment.', 'payment', false, 'system');

    WHEN 'completed' THEN
       INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
       VALUES (v_customer_user_id, 'Service Complete', 'Booking #' || NEW.booking_number || ' is completed and paid!', 'booking', false, 'booking_completed');
       
       IF v_mechanic_user_id IS NOT NULL THEN
         INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
         VALUES (v_mechanic_user_id, 'Job Completed', 'Booking #' || NEW.booking_number || ' is complete!', 'booking', false, 'booking_completed');
       END IF;

    ELSE
       -- Do nothing for other states (pending, refunded)
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind the trigger
DROP TRIGGER IF EXISTS trigger_booking_updates_notify ON bookings;
CREATE TRIGGER trigger_booking_updates_notify
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION handle_booking_updates_notify();


-- 3. Insert Function (Handles New Bookings)
CREATE OR REPLACE FUNCTION notify_on_new_booking()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  customer_uid UUID;
BEGIN
  -- Get the customer's user_id from the customers table
  SELECT user_id INTO customer_uid
  FROM customers
  WHERE id = NEW.customer_id;

  -- Create notification for the customer
  INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
  VALUES (
    customer_uid, 
    'Booking Confirmed', 
    'Your booking #' || NEW.booking_number || ' has been received.', 
    'booking', 
    false, 
    'booking_created'
  );
  
  -- Create notification for all admins
  INSERT INTO notifications (user_id, title, body, reference_type, is_read, notification_type)
  SELECT id, 'New Booking Received', 'A new booking #' || NEW.booking_number || ' needs assignment.', 'booking', false, 'system'
  FROM profiles
  WHERE role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Bind the trigger for insert
DROP TRIGGER IF EXISTS trigger_new_booking_notify ON bookings;
CREATE TRIGGER trigger_new_booking_notify
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_booking();
