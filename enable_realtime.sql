-- Enable Realtime for notifications and bookings (crucial for frontend postgres_changes subscriptions)

-- Drops the tables from publication if they exist to prevent errors, then adds them back
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END
  $$;

  -- Add tables
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  ALTER PUBLICATION supabase_realtime ADD TABLE payments;
COMMIT;
