-- ============================================================
-- SafaiNow Initial Schema
-- ============================================================

-- Extensions
create extension if not exists postgis with schema extensions;

-- ============================================================
-- ENUMS
-- ============================================================

create type booking_status as enum (
  'pending',
  'accepted',
  'on_route',
  'reached',
  'work_in_progress',
  'completed',
  'cash_collected',
  'cancelled_by_customer',
  'cancelled_by_partner',
  'cancelled_by_admin'
);

create type package_type as enum (
  'cleaning',
  'standalone',
  'custom'
);

create type commission_status as enum (
  'owed',
  'collected'
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

create table customers (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PARTNERS
-- ============================================================

create table partners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  passcode_hash text not null,
  is_active boolean not null default true,
  is_available boolean not null default false,
  location extensions.geography(point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index partners_location_idx on partners using gist (location);

-- ============================================================
-- SERVICES
-- ============================================================

create table services (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ur text not null,
  price numeric(10, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PACKAGES
-- ============================================================

create table packages (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ur text not null,
  type package_type not null,
  price numeric(10, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- BOOKINGS
-- ============================================================

create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete restrict,
  partner_id uuid references partners (id) on delete restrict,
  status booking_status not null default 'pending',
  address text not null,
  address_lat numeric(10, 7),
  address_lng numeric(10, 7),
  total_price numeric(10, 2) not null,
  scheduled_at timestamptz,
  accepted_at timestamptz,
  reached_at timestamptz,
  completed_at timestamptz,
  cash_collected_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_customer_id_idx on bookings (customer_id);
create index bookings_partner_id_idx on bookings (partner_id);
create index bookings_status_idx on bookings (status);

-- ============================================================
-- BOOKING PACKAGES
-- ============================================================

create table booking_packages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  package_id uuid not null references packages (id) on delete restrict,
  package_name_en text not null,
  package_name_ur text not null,
  package_type package_type not null,
  price_at_booking numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index booking_packages_booking_id_idx on booking_packages (booking_id);

-- ============================================================
-- BOOKING CUSTOM SERVICES
-- (only used when booking contains a custom package)
-- ============================================================

create table booking_custom_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  service_id uuid not null references services (id) on delete restrict,
  service_name_en text not null,
  service_name_ur text not null,
  price_at_booking numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index booking_custom_services_booking_id_idx on booking_custom_services (booking_id);

-- ============================================================
-- BOOKING TIMELINE
-- Immutable log of every status change
-- ============================================================

create table booking_timeline (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  status booking_status not null,
  actor_type text not null check (actor_type in ('customer', 'partner', 'admin', 'system')),
  actor_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index booking_timeline_booking_id_idx on booking_timeline (booking_id);

-- ============================================================
-- JOB OFFERS
-- Tracks which partners were notified for a booking
-- ============================================================

create table job_offers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  partner_id uuid not null references partners (id) on delete cascade,
  offered_at timestamptz not null default now(),
  responded_at timestamptz,
  accepted boolean,
  unique (booking_id, partner_id)
);

create index job_offers_booking_id_idx on job_offers (booking_id);

-- ============================================================
-- COMMISSION LEDGER
-- ============================================================

create table commission_ledger (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete restrict,
  partner_id uuid not null references partners (id) on delete restrict,
  total_amount numeric(10, 2) not null,
  commission_amount numeric(10, 2) not null,
  partner_amount numeric(10, 2) not null,
  status commission_status not null default 'owed',
  collected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index commission_ledger_partner_id_idx on commission_ledger (partner_id);
create index commission_ledger_status_idx on commission_ledger (status);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger customers_updated_at before update on customers
  for each row execute function update_updated_at();

create trigger partners_updated_at before update on partners
  for each row execute function update_updated_at();

create trigger services_updated_at before update on services
  for each row execute function update_updated_at();

create trigger packages_updated_at before update on packages
  for each row execute function update_updated_at();

create trigger bookings_updated_at before update on bookings
  for each row execute function update_updated_at();

create trigger commission_ledger_updated_at before update on commission_ledger
  for each row execute function update_updated_at();
