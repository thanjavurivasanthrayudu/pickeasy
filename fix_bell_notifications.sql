-- Fix Master Trigger for Booking Updates (Sends Notifications to both Mechanics and Customers)
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
    -- "mechanic_assigned" is triggered when Admin assigns a mechanic
    WHEN 'mechanic_assigned' THEN
      -- Notify Customer that Admin Accepted (and assigned a mechanic)
      INSERT INTO notifications (user_id, title, body, type, is_read)
      VALUES (v_customer_user_id, 'Service Request Accepted', 'Your service request has been accepted.', 'booking', false);
      
      -- Notify Mechanic
      IF v_mechanic_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, type, is_read)
        VALUES (v_mechanic_user_id, 'New Job Assigned', 'You have been assigned a new service request.', 'booking', false);
      END IF;

    -- If a booking gets outright rejected/cancelled without a mechanic
    WHEN 'rejected' THEN
       INSERT INTO notifications (user_id, title, body, type, is_read)
       VALUES (v_customer_user_id, 'Service Request Rejected', 'Your service request has been rejected.', 'booking', false);
       
    WHEN 'cancelled' THEN
       INSERT INTO notifications (user_id, title, body, type, is_read)
       VALUES (v_customer_user_id, 'Service Request Rejected', 'Your service request has been rejected.', 'booking', false);

    WHEN 'mechanic_accepted' THEN
       INSERT INTO notifications (user_id, title, body, type, is_read)
       VALUES (v_customer_user_id, 'Mechanic on the way', 'The mechanic is on their way for booking #' || NEW.booking_number, 'booking', false);
       
    WHEN 'arrived' THEN
       INSERT INTO notifications (user_id, title, body, type, is_read)
       VALUES (v_customer_user_id, 'Mechanic Arrived', 'The mechanic has arrived for booking #' || NEW.booking_number, 'booking', false);
       
    WHEN 'in_progress' THEN
       INSERT INTO notifications (user_id, title, body, type, is_read)
       VALUES (v_customer_user_id, 'Service Started', 'Service has started for booking #' || NEW.booking_number, 'booking', false);

    WHEN 'inspection_done' THEN
       INSERT INTO notifications (user_id, title, body, type, is_read)
       VALUES (v_customer_user_id, 'Inspection Completed', 'The inspection report is ready for booking #' || NEW.booking_number, 'booking', false);

    WHEN 'awaiting_payment' THEN
       INSERT INTO notifications (user_id, title, body, type, is_read)
       VALUES (v_customer_user_id, 'Payment Required', 'Service for booking #' || NEW.booking_number || ' is complete. Please complete the payment.', 'payment', false);

    WHEN 'completed' THEN
       INSERT INTO notifications (user_id, title, body, type, is_read)
       VALUES (v_customer_user_id, 'Service Complete', 'Booking #' || NEW.booking_number || ' is completed and paid!', 'booking', false);
       IF v_mechanic_user_id IS NOT NULL THEN
         INSERT INTO notifications (user_id, title, body, type, is_read)
         VALUES (v_mechanic_user_id, 'Job Completed', 'Booking #' || NEW.booking_number || ' is complete!', 'booking', false);
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
