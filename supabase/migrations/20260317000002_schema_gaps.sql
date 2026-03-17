-- ============================================================
-- Schema Gaps — missing tables and fields identified in audit
-- ============================================================

-- ============================================================
-- 1. Add description fields to packages
-- ============================================================

alter table packages
  add column description_en text not null default '',
  add column description_ur text not null default '';

-- ============================================================
-- 2. Add explicit auto-transition timestamps to bookings
-- ============================================================

alter table bookings
  add column on_route_at timestamptz,
  add column work_in_progress_at timestamptz;

-- ============================================================
-- 3. Packages ↔ Services junction table
-- Links which services belong to each package
-- ============================================================

create table package_services (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references packages (id) on delete cascade,
  service_id uuid not null references services (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (package_id, service_id)
);

create index package_services_package_id_idx on package_services (package_id);
create index package_services_service_id_idx on package_services (service_id);

-- ============================================================
-- 4. Customer address book
-- ============================================================

create type address_label as enum ('home', 'work', 'parents_house', 'other');

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  address_text text not null,
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  label address_label not null default 'home',
  custom_label text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_addresses_customer_id_idx on customer_addresses (customer_id);

create trigger customer_addresses_updated_at before update on customer_addresses
  for each row execute function update_updated_at();
