-- ============================================================
-- Row-Level Security for all tables the customer app reads/writes.
-- Rule: customers own their own data. Public read for catalogue tables.
-- ============================================================

-- ── Enable RLS on all affected tables ──────────────────────

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_custom_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_timeline ENABLE ROW LEVEL SECURITY;

-- services and packages already have RLS enabled from Sprint 1 admin policies.
-- We need to add anon read policies so unauthenticated users can browse the catalogue.

-- ── services: public read ───────────────────────────────────

DROP POLICY IF EXISTS "anon can read active services" ON public.services;
CREATE POLICY "anon can read active services"
  ON public.services
  FOR SELECT
  USING (is_active = true);

-- ── packages: public read ───────────────────────────────────

DROP POLICY IF EXISTS "anon can read active packages" ON public.packages;
CREATE POLICY "anon can read active packages"
  ON public.packages
  FOR SELECT
  USING (is_active = true);

-- ── package_services: public read ──────────────────────────

ALTER TABLE public.package_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon can read package_services" ON public.package_services;
CREATE POLICY "anon can read package_services"
  ON public.package_services
  FOR SELECT
  USING (true);

-- ── customers: own row only ─────────────────────────────────

DROP POLICY IF EXISTS "customers: read own row" ON public.customers;
CREATE POLICY "customers: read own row"
  ON public.customers
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "customers: update own row" ON public.customers;
CREATE POLICY "customers: update own row"
  ON public.customers
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── customer_addresses: own rows only ──────────────────────

DROP POLICY IF EXISTS "addresses: select own" ON public.customer_addresses;
CREATE POLICY "addresses: select own"
  ON public.customer_addresses
  FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "addresses: insert own" ON public.customer_addresses;
CREATE POLICY "addresses: insert own"
  ON public.customer_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "addresses: update own" ON public.customer_addresses;
CREATE POLICY "addresses: update own"
  ON public.customer_addresses
  FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "addresses: delete own" ON public.customer_addresses;
CREATE POLICY "addresses: delete own"
  ON public.customer_addresses
  FOR DELETE
  USING (auth.uid() = customer_id);

-- ── bookings: own rows only ─────────────────────────────────

DROP POLICY IF EXISTS "bookings: select own" ON public.bookings;
CREATE POLICY "bookings: select own"
  ON public.bookings
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Bookings are created by the API using the service key (bypasses RLS).
-- Customers can cancel their own pending bookings via the API only.
-- No direct INSERT from client.

-- ── booking_packages: readable if booking is owned ──────────

DROP POLICY IF EXISTS "booking_packages: select own booking" ON public.booking_packages;
CREATE POLICY "booking_packages: select own booking"
  ON public.booking_packages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_packages.booking_id
        AND bookings.customer_id = auth.uid()
    )
  );

-- ── booking_custom_services: readable if booking is owned ──

DROP POLICY IF EXISTS "booking_custom_services: select own booking" ON public.booking_custom_services;
CREATE POLICY "booking_custom_services: select own booking"
  ON public.booking_custom_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_custom_services.booking_id
        AND bookings.customer_id = auth.uid()
    )
  );

-- ── booking_timeline: readable if booking is owned ──────────

DROP POLICY IF EXISTS "booking_timeline: select own booking" ON public.booking_timeline;
CREATE POLICY "booking_timeline: select own booking"
  ON public.booking_timeline
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_timeline.booking_id
        AND bookings.customer_id = auth.uid()
    )
  );
