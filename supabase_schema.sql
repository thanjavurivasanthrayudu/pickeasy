-- ============================================================
--  MotoEase — Complete Supabase SQL Schema
--  Paste this entire script into the Supabase SQL Editor
--  and click "Run" (►)
-- ============================================================

-- ── Enable required extensions ────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUM types ────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role       AS ENUM ('customer', 'mechanic', 'admin');
  CREATE TYPE booking_status  AS ENUM (
    'pending','mechanic_assigned','mechanic_accepted','mechanic_rejected',
    'mechanic_arrived','in_progress','inspection_done','awaiting_payment',
    'completed','cancelled','refunded'
  );
  CREATE TYPE payment_status  AS ENUM ('pending','captured','failed','refunded');
  CREATE TYPE payment_method  AS ENUM ('razorpay','cash','upi','wallet');
  CREATE TYPE vehicle_type    AS ENUM ('bike','scooter','moped','electric');
  CREATE TYPE service_level   AS ENUM ('basic','standard','full','custom');
  CREATE TYPE ticket_status   AS ENUM ('open','in_progress','resolved','closed');
  CREATE TYPE notif_channel   AS ENUM ('in_app','sms','email','push');
  CREATE TYPE notif_type      AS ENUM (
    'booking_created','booking_assigned','booking_completed','payment_success',
    'mechanic_arrived','review_received','otp','system'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── PROFILES (extends Supabase auth.users) ────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE,
  phone           TEXT UNIQUE,
  role            user_role NOT NULL DEFAULT 'customer',
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  is_verified     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── CUSTOMERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address_line1   TEXT,
  address_line2   TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  latitude        DECIMAL(10, 7),
  longitude       DECIMAL(10, 7),
  loyalty_points  INTEGER DEFAULT 0,
  total_bookings  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── VEHICLES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  year            INTEGER,
  vehicle_type    vehicle_type DEFAULT 'bike',
  color           TEXT,
  registration_no TEXT,
  vin             TEXT,
  engine_cc       INTEGER,
  fuel_type       TEXT DEFAULT 'petrol',
  odometer_km     INTEGER DEFAULT 0,
  last_service_at DATE,
  is_primary      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── MECHANICS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mechanics (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  aadhaar_number      TEXT,
  license_number      TEXT,
  experience_years    INTEGER DEFAULT 0,
  specializations     TEXT[] DEFAULT '{}',
  service_radius_km   INTEGER DEFAULT 10,
  is_available        BOOLEAN DEFAULT FALSE,
  is_approved         BOOLEAN DEFAULT FALSE,
  rating              DECIMAL(3,2) DEFAULT 0.0,
  total_jobs          INTEGER DEFAULT 0,
  total_earnings      DECIMAL(12,2) DEFAULT 0,
  current_latitude    DECIMAL(10,7),
  current_longitude   DECIMAL(10,7),
  city                TEXT,
  bank_account_no     TEXT,
  bank_ifsc           TEXT,
  upi_id              TEXT,
  leaderboard_points  INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── SERVICE CATEGORIES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SERVICE PACKAGES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_packages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     UUID REFERENCES service_categories(id),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  level           service_level DEFAULT 'basic',
  base_price      DECIMAL(10,2) NOT NULL,
  duration_mins   INTEGER NOT NULL DEFAULT 60,
  is_active       BOOLEAN DEFAULT TRUE,
  includes        TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOOKINGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number      TEXT UNIQUE NOT NULL,
  customer_id         UUID NOT NULL REFERENCES customers(id),
  vehicle_id          UUID NOT NULL REFERENCES vehicles(id),
  mechanic_id         UUID REFERENCES mechanics(id),
  package_id          UUID REFERENCES service_packages(id),
  status              booking_status DEFAULT 'pending',
  scheduled_date      DATE NOT NULL,
  scheduled_time      TIME NOT NULL,
  address_line1       TEXT NOT NULL,
  address_line2       TEXT,
  city                TEXT NOT NULL,
  state               TEXT,
  pincode             TEXT,
  latitude            DECIMAL(10,7),
  longitude           DECIMAL(10,7),
  base_amount         DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount     DECIMAL(10,2) DEFAULT 0,
  tax_amount          DECIMAL(10,2) DEFAULT 0,
  total_amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_code         TEXT,
  special_notes       TEXT,
  customer_rating     INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  customer_review     TEXT,
  mechanic_arrived_at TIMESTAMPTZ,
  service_started_at  TIMESTAMPTZ,
  service_ended_at    TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancel_reason       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'ME' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_number ON bookings;
CREATE TRIGGER trg_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW WHEN (NEW.booking_number IS NULL OR NEW.booking_number = '')
  EXECUTE FUNCTION generate_booking_number();

-- ── BOOKING STATUS HISTORY ────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status      booking_status NOT NULL,
  changed_by  UUID REFERENCES profiles(id),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── INSPECTIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  mechanic_id     UUID NOT NULL REFERENCES mechanics(id),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  overall_rating  INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  notes           TEXT,
  photo_urls      TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INSPECTION CHECKLIST ITEMS ────────────────────────────
CREATE TABLE IF NOT EXISTS inspection_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id   UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  component       TEXT NOT NULL,
  condition       TEXT CHECK (condition IN ('good','fair','needs_attention','critical')),
  notes           TEXT,
  photo_url       TEXT,
  requires_part   BOOLEAN DEFAULT FALSE
);

-- ── SPARE PARTS (used in a booking) ──────────────────────
CREATE TABLE IF NOT EXISTS spare_parts_used (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id   UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  part_name       TEXT NOT NULL,
  part_number     TEXT,
  quantity        INTEGER DEFAULT 1,
  unit_price      DECIMAL(10,2) NOT NULL,
  total_price     DECIMAL(10,2) NOT NULL,
  is_approved     BOOLEAN DEFAULT FALSE
);

-- ── PAYMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id          UUID NOT NULL REFERENCES bookings(id),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  amount              DECIMAL(10,2) NOT NULL,
  currency            TEXT DEFAULT 'INR',
  method              payment_method DEFAULT 'razorpay',
  status              payment_status DEFAULT 'pending',
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature  TEXT,
  refund_amount       DECIMAL(10,2) DEFAULT 0,
  refund_reason       TEXT,
  refunded_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── INVOICES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  TEXT UNIQUE,
  booking_id      UUID UNIQUE NOT NULL REFERENCES bookings(id),
  payment_id      UUID REFERENCES payments(id),
  subtotal        DECIMAL(10,2) NOT NULL,
  discount        DECIMAL(10,2) DEFAULT 0,
  tax             DECIMAL(10,2) DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL,
  pdf_url         TEXT,
  issued_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── COUPONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT UNIQUE NOT NULL,
  description         TEXT,
  discount_type       TEXT CHECK (discount_type IN ('percentage','fixed')) DEFAULT 'percentage',
  discount_value      DECIMAL(10,2) NOT NULL,
  max_discount        DECIMAL(10,2),
  min_order_value     DECIMAL(10,2) DEFAULT 0,
  max_uses            INTEGER DEFAULT 100,
  used_count          INTEGER DEFAULT 0,
  valid_from          TIMESTAMPTZ,
  valid_until         TIMESTAMPTZ,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── REVIEWS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID UNIQUE NOT NULL REFERENCES bookings(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  mechanic_id     UUID NOT NULL REFERENCES mechanics(id),
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           TEXT,
  comment         TEXT,
  is_public       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  notification_type notif_type DEFAULT 'system',
  channel         notif_channel DEFAULT 'in_app',
  reference_id    UUID,
  reference_type  TEXT,
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INVENTORY ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_name       TEXT NOT NULL,
  part_number     TEXT UNIQUE,
  category        TEXT,
  brand           TEXT,
  quantity        INTEGER DEFAULT 0,
  min_quantity    INTEGER DEFAULT 5,
  unit_price      DECIMAL(10,2) NOT NULL,
  supplier        TEXT,
  location        TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUPPORT TICKETS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  booking_id  UUID REFERENCES bookings(id),
  subject     TEXT NOT NULL,
  description TEXT NOT NULL,
  status      ticket_status DEFAULT 'open',
  priority    TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUPPORT MESSAGES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id),
  message     TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── LEADERBOARD ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mechanic_id     UUID UNIQUE NOT NULL REFERENCES mechanics(id),
  week_jobs       INTEGER DEFAULT 0,
  week_earnings   DECIMAL(12,2) DEFAULT 0,
  week_rating     DECIMAL(3,2) DEFAULT 0,
  total_jobs      INTEGER DEFAULT 0,
  total_earnings  DECIMAL(12,2) DEFAULT 0,
  avg_rating      DECIMAL(3,2) DEFAULT 0,
  points          INTEGER DEFAULT 0,
  rank            INTEGER,
  badges          TEXT[] DEFAULT '{}',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA — Service categories & packages
-- ============================================================
INSERT INTO service_categories (id, name, slug, description, icon_url, sort_order) VALUES
  (uuid_generate_v4(), 'General Service',    'general-service',    'Routine bike maintenance',     NULL, 1),
  (uuid_generate_v4(), 'Engine & Oil',       'engine-oil',         'Engine & oil related services', NULL, 2),
  (uuid_generate_v4(), 'Tyres & Brakes',     'tyres-brakes',       'Tyre change and brake service', NULL, 3),
  (uuid_generate_v4(), 'Electrical',         'electrical',         'Battery, wiring, lights',       NULL, 4),
  (uuid_generate_v4(), 'Body & Accessories', 'body-accessories',   'Cleaning, painting, mods',      NULL, 5)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM service_categories WHERE slug = 'general-service' LIMIT 1)
INSERT INTO service_packages (id, category_id, name, slug, level, base_price, duration_mins, includes)
SELECT
  uuid_generate_v4(), cat.id, pkg.name, pkg.slug, pkg.level::service_level, pkg.price, pkg.dur, pkg.inc
FROM cat, (VALUES
  ('Basic Service',    'basic-service',    'basic',    599,  45, ARRAY['Oil check','Chain lube','Tyre pressure','Brake check']),
  ('Standard Service', 'standard-service', 'standard', 999,  75, ARRAY['All Basic','Engine tuning','Air filter clean','Spark plug check']),
  ('Full Service',     'full-service',     'full',     1499, 120, ARRAY['All Standard','Oil change','Complete inspection','Wash & clean'])
) AS pkg(name, slug, level, price, dur, inc)
ON CONFLICT DO NOTHING;

INSERT INTO service_packages (id, category_id, name, slug, level, base_price, duration_mins, includes)
SELECT uuid_generate_v4(), sc.id, 'Oil Change', 'oil-change', 'basic', 399, 30, ARRAY['Engine oil drain','New oil fill','Filter check']
FROM service_categories sc WHERE sc.slug = 'engine-oil'
ON CONFLICT DO NOTHING;

INSERT INTO service_packages (id, category_id, name, slug, level, base_price, duration_mins, includes)
SELECT uuid_generate_v4(), sc.id, 'Tyre Change', 'tyre-change', 'basic', 299, 30, ARRAY['Tyre removal','New tyre fit','Balancing','Valve check']
FROM service_categories sc WHERE sc.slug = 'tyres-brakes'
ON CONFLICT DO NOTHING;

INSERT INTO service_packages (id, category_id, name, slug, level, base_price, duration_mins, includes)
SELECT uuid_generate_v4(), sc.id, 'Battery Check', 'battery-check', 'basic', 199, 20, ARRAY['Battery test','Terminals clean','Charge check']
FROM service_categories sc WHERE sc.slug = 'electrical'
ON CONFLICT DO NOTHING;

-- ── SAMPLE COUPON ─────────────────────────────────────────
INSERT INTO coupons (code, description, discount_type, discount_value, max_discount, min_order_value, max_uses, valid_from, valid_until)
VALUES ('MOTO100', 'Flat ₹100 off on first booking', 'fixed', 100, 100, 399, 1000, NOW(), NOW() + INTERVAL '90 days')
ON CONFLICT DO NOTHING;

INSERT INTO coupons (code, description, discount_type, discount_value, max_discount, min_order_value, max_uses, valid_from, valid_until)
VALUES ('WELCOME20', '20% off welcome offer', 'percentage', 20, 200, 599, 500, NOW(), NOW() + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_used      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory             ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard           ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- customers: own record only
CREATE POLICY "customers_own"     ON customers FOR ALL USING (user_id = auth.uid());

-- vehicles: own vehicles only
CREATE POLICY "vehicles_own"      ON vehicles FOR ALL
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- mechanics: own record + others can read approved mechanics
CREATE POLICY "mechanics_read"    ON mechanics FOR SELECT USING (is_approved = TRUE OR user_id = auth.uid());
CREATE POLICY "mechanics_own"     ON mechanics FOR ALL   USING (user_id = auth.uid());

-- bookings: customer sees own bookings; mechanic sees assigned bookings
CREATE POLICY "bookings_customer" ON bookings FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "bookings_mechanic" ON bookings FOR SELECT
  USING (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));
CREATE POLICY "bookings_insert"   ON bookings FOR INSERT
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "bookings_update_customer" ON bookings FOR UPDATE
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "bookings_update_mechanic" ON bookings FOR UPDATE
  USING (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));

-- payments: own only
CREATE POLICY "payments_own"      ON payments FOR ALL
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- notifications: own only
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- service_categories & packages: public read
CREATE POLICY "svc_cat_public"    ON service_categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "svc_pkg_public"    ON service_packages   FOR SELECT USING (is_active = TRUE);

-- coupons: public read active coupons
CREATE POLICY "coupons_public"    ON coupons FOR SELECT USING (is_active = TRUE);

-- reviews: public read + own insert
CREATE POLICY "reviews_public"    ON reviews FOR SELECT USING (is_public = TRUE);
CREATE POLICY "reviews_insert"    ON reviews FOR INSERT
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- leaderboard: public read
CREATE POLICY "leaderboard_public" ON leaderboard FOR SELECT USING (TRUE);

-- support: own tickets
CREATE POLICY "tickets_own"       ON support_tickets  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "messages_own"      ON support_messages FOR ALL
  USING (ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()));

-- inspections: booking-owner or mechanic
CREATE POLICY "inspections_read"  ON inspections FOR SELECT
  USING (
    mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid())
    OR
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update timestamps)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','customers','vehicles','mechanics',
    'bookings','service_packages','payments','invoices','support_tickets','inventory']
  LOOP
    EXECUTE format($f$
      DROP TRIGGER IF EXISTS trg_updated_at ON %I;
      CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    $f$, t, t);
  END LOOP;
END $$;

-- ============================================================
-- Done! All tables, RLS policies, triggers, and seed data created.
-- ============================================================
