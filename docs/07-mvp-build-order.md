# SafaiNow — MVP Build Order & Scope

## MVP Sprint Plan

### Sprint 1 — Foundation
- Supabase project setup (schema, RLS policies, PostGIS extension)
- Turborepo + pnpm monorepo scaffolding
- Shared packages setup (types, validators, utils, constants)
- Admin panel authentication
- Partner creation flow with auto-generated passcode (shown once)
- Individual services CRUD in admin panel
- Package CRUD in admin panel

### Sprint 2 — Core Booking Loop
- Customer app authentication (email/password + Google OAuth)
- Homepage with package list and detail pages
- Custom package service selection with live running total
- Package combination rule enforcement (UI + API)
- Address selection (saved, new, live GPS)
- Booking type selection (instant, scheduled, recurring)
- Order summary screen
- Book Now triggers matching engine

### Sprint 3 — Matching & Live Job
- PostGIS geo-radius partner query
- Simultaneous push notifications to nearby partners
- Atomic job claiming (race condition handled at DB level)
- Post-acceptance info exchange (both apps)
- Live location tracking via Supabase Realtime
- Tap-to-call for both apps
- Partner job stage buttons (full Urdu UI)
- 15-minute cancellation window with countdown timer

### Sprint 4 — Admin Visibility & Financials
- Real-time booking feed on admin dashboard
- Full timestamp tracking and time metrics per job
- Cancellation logging (who, when, reason)
- Commission ledger and mark as collected
- Partner feedback rate display
- Customer and partner management modules
- CSV export for financials
- Customer thumbs up/down feedback prompt

### Sprint 5 — Scheduled & Recurring
- Scheduled booking flow in customer app
- Recurring booking setup (BullMQ + Redis added here)
- Admin visibility on scheduled and recurring jobs

---

## Out of Scope for MVP

| Feature | Reason Deferred |
|---|---|
| Star ratings and written reviews | Thumbs up/down sufficient for MVP quality monitoring |
| In-app chat | Tap-to-call covers communication needs |
| Recurring booking discounts | Requires pricing strategy validation, deferred to v1.1 |
| SMS / WhatsApp notifications | Push notifications sufficient for MVP |
| Referral or promo codes | Growth feature, not needed to validate core loop |
| Online payments | Cash-only model simplifies MVP significantly |
| BullMQ + Redis | Only needed for recurring bookings (Sprint 5) |

---

## Key Technical Decisions

### No Payment Gateway
Cash only for MVP. Removes Stripe, JazzCash and all payment infrastructure entirely.

### No Partner Self-Registration
Partners are created exclusively by Admin. No signup flow needed on partner app.

### Race Condition Without a Queue
Handled with a single atomic SQL `UPDATE ... WHERE status = 'pending' RETURNING *` transaction. No Redis needed for MVP.

### Price Snapshotting
`price_at_booking` is stored on every `booking_packages` and `booking_custom_services` record at the time of booking creation. This ensures historical pricing is preserved even when admin updates rates later.

### Passcode Security
Partner passcodes are stored as bcrypt hashes. Admin sees the plain passcode once on creation/reset only. No recovery flow on the partner app — admin resets if forgotten.
