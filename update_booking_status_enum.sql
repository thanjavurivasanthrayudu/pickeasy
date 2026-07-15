-- Migration to add 'rejected' to the booking_status ENUM
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rejected' AFTER 'cancelled';
