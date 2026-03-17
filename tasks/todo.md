# SafaiNow — Task Tracker

## Sprint 1 — Foundation

### ✅ Monorepo Scaffold
- [x] Turborepo + pnpm workspace initialized
- [x] `apps/customer` — Expo SDK 55, React Native 0.83.2
- [x] `apps/partner` — Expo SDK 55, React Native 0.83.2
- [x] `apps/admin` — Next.js 16, React 19.2.3
- [x] `apps/api` — Fastify v5, TypeScript
- [x] `packages/types` — DB types generated from Supabase
- [x] `packages/validators` — empty, ready for Zod schemas
- [x] `packages/utils` — empty, ready for utilities
- [x] `packages/constants` — empty, ready for constants
- [x] All apps pass `tsc --noEmit`

### ✅ Supabase
- [x] Project linked
- [x] Initial schema migration written and pushed
  - customers, partners, services, packages
  - bookings, booking_packages, booking_custom_services
  - booking_timeline, job_offers, commission_ledger
  - PostGIS enabled, enums, indexes, updated_at triggers
- [x] TypeScript types generated into `packages/types`
- [x] Supabase clients set up in all 4 apps
  - admin: browser + server client (`@supabase/ssr`)
  - customer/partner: `createClient` with expo-sqlite localStorage
  - api: `createClient` with secret key
- [x] Env files populated with real keys

### ✅ UI Libraries
- [x] shadcn/ui (Nova preset, Radix, Tailwind v4) — admin
- [x] NativeWind v5 + Tailwind v4 — customer + partner
  - metro.config.js, postcss.config.mjs, global.css, nativewind-env.d.ts

### 🔲 Admin Auth
- [ ] Supabase Auth middleware (protect routes)
- [ ] Login page (email + password)
- [ ] Redirect to dashboard after login
- [ ] Redirect to login if unauthenticated

### 🔲 Partner CRUD (Admin)
- [ ] Partner list page
- [ ] Create partner (generate passcode, bcrypt hash)
- [ ] Edit partner
- [ ] Toggle active/inactive

### 🔲 Services & Packages CRUD (Admin)
- [ ] Services list + create/edit/toggle
- [ ] Packages list + create/edit/toggle
- [ ] Package combination rules enforced on backend

---

## Sprint 2 — Customer App
- [ ] Customer auth (email/password + Google OAuth)
- [ ] Homepage
- [ ] Booking flow
- [ ] Package combination rules (frontend)
- [ ] Address book

## Sprint 3 — Partner Matching & Jobs
- [ ] Partner matching (PostGIS radius query)
- [ ] Push notifications (FCM v1)
- [ ] Atomic job claiming
- [ ] Live location updates
- [ ] Cancellation window (15 min)

## Sprint 4 — Admin Dashboard
- [ ] Real-time job feed (Supabase Realtime)
- [ ] Commission ledger
- [ ] Reports + CSV export
- [ ] Feedback (thumbs up/down)

## Sprint 5 — Recurring Bookings
- [ ] Scheduled bookings
- [ ] BullMQ + Redis setup
