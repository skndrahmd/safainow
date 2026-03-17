-- ============================================================
-- Schema Corrections — fields missing from initial migration
-- ============================================================

-- Customer feedback enum
create type customer_feedback as enum ('positive', 'negative');

-- Add missing fields to partners
alter table partners
  add column cnic_number text,
  add column profile_picture_url text,
  add column cnic_picture_url text;

-- Add customer feedback to bookings
alter table bookings
  add column customer_feedback customer_feedback;
