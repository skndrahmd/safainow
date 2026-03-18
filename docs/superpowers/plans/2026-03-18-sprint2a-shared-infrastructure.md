# Sprint 2A: Shared Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the empty shared packages (constants, validators) and write the DB migrations that all Sprint 2 customer app features depend on.

**Architecture:** Pure TypeScript constants and Zod schemas live in `packages/constants` and `packages/validators` — zero React dependencies. DB migrations add a trigger to auto-create a `customers` row on Supabase Auth sign-up, plus RLS policies that gate customer-facing tables to authenticated owners.

**Tech Stack:** TypeScript, Zod ^3.24.0, Supabase SQL migrations (PL/pgSQL)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `packages/constants/src/index.ts` | Modify (empty → fill) | Business constants used across API + apps |
| `packages/validators/src/index.ts` | Modify (empty → fill) | Zod schema for booking creation |
| `supabase/migrations/20260318000002_customer_trigger.sql` | Create | Auto-create customers row on auth.users insert |
| `supabase/migrations/20260318000003_customer_rls.sql` | Create | RLS policies for all customer-facing tables |

---

## Chunk 1: Shared Package Content

### Task 1: Populate packages/constants

**Files:**
- Modify: `packages/constants/src/index.ts`

- [ ] **Step 1: Write the constants**

```typescript
// packages/constants/src/index.ts

/** SafaiNow takes 25% commission on every completed booking */
export const COMMISSION_RATE = 0.25

/** Partner keeps 75% of the booking total */
export const PARTNER_AMOUNT_RATE = 0.75

/** 15-minute cancellation window in milliseconds (both customer and partner) */
export const CANCELLATION_WINDOW_MS = 15 * 60 * 1000

/** Radius (metres) used in the PostGIS partner-matching query */
export const BOOKING_RADIUS_METRES = 10_000

/** Booking statuses — matches the booking_status enum in the DB */
export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  ON_ROUTE: 'on_route',
  REACHED: 'reached',
  WORK_IN_PROGRESS: 'work_in_progress',
  COMPLETED: 'completed',
  CASH_COLLECTED: 'cash_collected',
  CANCELLED_BY_CUSTOMER: 'cancelled_by_customer',
  CANCELLED_BY_PARTNER: 'cancelled_by_partner',
  CANCELLED_BY_ADMIN: 'cancelled_by_admin',
} as const

/** Package types — matches the package_type enum in the DB */
export const PACKAGE_TYPE = {
  CLEANING: 'cleaning',
  STANDALONE: 'standalone',
  CUSTOM: 'custom',
} as const

/** Address labels — matches the address_label enum in the DB */
export const ADDRESS_LABEL = {
  HOME: 'home',
  WORK: 'work',
  PARENTS_HOUSE: 'parents_house',
  OTHER: 'other',
} as const
```

- [ ] **Step 2: Verify it type-checks**

```bash
pnpm --filter @safainow/constants exec tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add packages/constants/src/index.ts
git commit -m "feat(constants): populate business constants — rates, window, statuses, types"
```

---

### Task 2: Populate packages/validators

**Files:**
- Modify: `packages/validators/src/index.ts`

- [ ] **Step 1: Write the Zod schema**

```typescript
// packages/validators/src/index.ts
import { z } from 'zod'

/**
 * Schema for POST /bookings request body.
 * Validated on both the API (authoritative) and used for type inference in the customer app.
 */
export const BookingCreateSchema = z.object({
  /** IDs of selected packages (1–2 max: one cleaning + one standalone, OR one custom) */
  package_ids: z.array(z.string().uuid()).min(1, 'Select at least one package'),

  /**
   * IDs of selected services — only populated when a custom package is included.
   * Must be empty when no custom package is selected.
   */
  custom_service_ids: z.array(z.string().uuid()).default([]),

  /** Human-readable address string shown to the partner */
  address_text: z.string().min(5, 'Address is required'),

  /** GPS latitude of the booking location */
  address_latitude: z.number().min(-90).max(90),

  /** GPS longitude of the booking location */
  address_longitude: z.number().min(-180).max(180),

  /** Optional label (home / work / parents_house / other) */
  address_label: z
    .enum(['home', 'work', 'parents_house', 'other'])
    .nullable()
    .default(null),

  /** ID of a saved customer_address row — null for ad-hoc addresses */
  saved_address_id: z.string().uuid().nullable().default(null),

  /** instant = book now; scheduled = book for a future time */
  booking_type: z.enum(['instant', 'scheduled']),

  /**
   * Required when booking_type = 'scheduled'.
   * ISO 8601 timestamp string — must be in the future.
   */
  scheduled_at: z.string().datetime().nullable().default(null),
}).superRefine((data, ctx) => {
  if (data.booking_type === 'scheduled' && !data.scheduled_at) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'scheduled_at is required for scheduled bookings',
      path: ['scheduled_at'],
    })
  }
  if (data.booking_type === 'instant' && data.scheduled_at) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'scheduled_at must be null for instant bookings',
      path: ['scheduled_at'],
    })
  }
})

export type BookingCreateInput = z.infer<typeof BookingCreateSchema>
```

- [ ] **Step 2: Verify it type-checks**

```bash
pnpm --filter @safainow/validators exec tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add packages/validators/src/index.ts
git commit -m "feat(validators): add BookingCreateSchema (Zod) for POST /bookings"
```

---

## Chunk 2: Database Migrations

### Task 3: Customer auto-creation trigger

When a user signs up via Supabase Auth, a row must automatically appear in the `customers` table so every feature that joins to `customers` works without an extra API call.

**Files:**
- Create: `supabase/migrations/20260318000002_customer_trigger.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260318000002_customer_trigger.sql
-- ============================================================
-- Auto-create a customers row when a new auth.users row is inserted.
-- Runs as SECURITY DEFINER so it can write to public.customers
-- regardless of the caller's role.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger first so re-running the migration is safe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

- [ ] **Step 2: Push migration to Supabase**

```bash
cd /Users/sikanderahmed/Documents/dev_projects/safainow
pnpm supabase db push
```

Expected: migration applied with no errors. If it says "remote migration history not found", run `pnpm supabase db push --include-all`.

- [ ] **Step 3: Verify in Supabase dashboard**

Go to Database > Functions → confirm `handle_new_user` exists.
Go to Database > Triggers → confirm `on_auth_user_created` exists on `auth.users`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260318000002_customer_trigger.sql
git commit -m "feat(db): auto-create customers row on auth.users insert via trigger"
```

---

### Task 4: RLS policies for customer-facing tables

**Files:**
- Create: `supabase/migrations/20260318000003_customer_rls.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260318000003_customer_rls.sql
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
```

- [ ] **Step 2: Push migration**

```bash
pnpm supabase db push
```

Expected: no errors.

- [ ] **Step 3: Verify policies in Supabase dashboard**

Go to Authentication > Policies. Confirm policies are listed for: `customers`, `customer_addresses`, `bookings`, `booking_packages`, `booking_custom_services`, `booking_timeline`, `services`, `packages`, `package_services`.

- [ ] **Step 4: Regenerate TypeScript types** (schema hasn't changed but good habit after any migration)

```bash
pnpm supabase gen types typescript --linked > packages/types/src/database.types.ts
```

- [ ] **Step 5: Verify types still compile**

```bash
pnpm --filter @safainow/types exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260318000003_customer_rls.sql packages/types/src/database.types.ts
git commit -m "feat(db): customer-facing RLS policies + anon read for packages/services catalogue"
```

---

## Verification Checklist

Before marking Sprint 2A complete:

- [ ] `pnpm --filter @safainow/constants exec tsc --noEmit` → clean
- [ ] `pnpm --filter @safainow/validators exec tsc --noEmit` → clean
- [ ] Both migrations pushed (`pnpm supabase db push` shows nothing to push)
- [ ] Trigger visible in Supabase dashboard (Database > Triggers)
- [ ] RLS policies visible in Supabase dashboard (Authentication > Policies)
- [ ] `packages/types/src/database.types.ts` up to date
