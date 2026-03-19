# SafaiNow — Task Tracker

> Granular checklist of every MVP feature. Every screen, action, API endpoint, and
> DB requirement has its own line. Sprints follow docs/07-mvp-build-order.md exactly.

---

## Sprint 1 — Foundation ✅

### ✅ Monorepo Scaffold
- [x] Turborepo + pnpm workspace initialised
- [x] `apps/customer` — Expo SDK 55, React Native 0.83.2
- [x] `apps/partner` — Expo SDK 55, React Native 0.83.2
- [x] `apps/admin` — Next.js 16, React 19.2.3, Onest font (light/medium)
- [x] `apps/api` — Fastify v5, TypeScript
- [x] `packages/types` — DB types generated from Supabase
- [x] `packages/validators` — scaffolded (content still empty → Sprint 2)
- [x] `packages/utils` — scaffolded (content still empty)
- [x] `packages/constants` — scaffolded (content still empty → Sprint 2)
- [x] All apps pass `tsc --noEmit`

### ✅ Supabase Schema
- [x] PostGIS extension enabled
- [x] Enums: `booking_status`, `package_type`, `commission_status`, `customer_feedback`, `address_label`
- [x] Tables: customers, partners, services, packages, package_services
- [x] Tables: bookings, booking_packages, booking_custom_services
- [x] Tables: booking_timeline, job_offers, commission_ledger, customer_addresses
- [x] Indexes + updated_at triggers on all tables
- [x] TypeScript types generated into `packages/types`
- [x] Supabase clients configured in all 4 apps
- [x] Env files populated

### ✅ UI Libraries
- [x] shadcn/ui (Nova preset, Radix, Tailwind v4) — admin
- [x] NativeWind v4 + Tailwind v3 — customer + partner (downgraded from v5 preview due to lightningcss pnpm conflicts)

### ✅ Admin Auth
- [x] Supabase Auth middleware (protect all /dashboard/* routes)
- [x] Login page (email + password)
- [x] Redirect to /dashboard after login; redirect to /login if unauthenticated

### ✅ Admin — Partner Management
- [x] Partner list page with status badges
- [x] Create partner (name, phone, CNIC, profile picture upload, CNIC picture upload)
- [x] Auto-generate 6-digit passcode → bcrypt hash stored; plain shown once in modal
- [x] Edit partner profile details
- [x] Toggle active / suspended (is_active)
- [x] Delete partner permanently
- [x] Eye icon → partner detail page
- [x] Partner detail page: profile info + uploaded images visible
- [x] Supabase Storage bucket `partner-assets` (public, authenticated upload)
- [x] RLS on partners table (authenticated full access)
- [x] Reset passcode — generate new 6-digit code, show once in modal, bcrypt-hash + save
- [x] Partner detail: job history table (bookings where partner_id = this partner)
- [x] Partner detail: earnings summary (total earned, commission paid)
- [x] Partner detail: thumbs up count, thumbs down count, positive feedback rate %
- [x] Partner detail: cancellation rate

### ✅ Admin — Services Management
- [x] Services list (name EN, name UR, price, status)
- [x] Add service (name EN, name UR, price)
- [x] Edit service inline (name, price)
- [x] Toggle active / disabled
- [x] Delete service (cascades from package_services automatically)

### ✅ Admin — Package Management
- [x] Packages list with type badge + status
- [x] Create package (name EN/UR, description EN/UR, type, services multi-select, flat price)
- [x] Edit package
- [x] Toggle active / disabled
- [x] Delete package
- [x] Custom-package guard (only one allowed)

### ✅ Admin — Seed Data
- [x] Seed migration: 15 individual services with prices
- [x] Seed migration: 5 packages (Standard, Special, Advanced, Clothes W&D, Custom) with service links
- [x] Push seed migration to Supabase

---

## Sprint 2 — Customer App (Core Booking Loop)

### ✅ Shared Infrastructure
- [x] `packages/constants/src/index.ts` — COMMISSION_RATE (0.25), PARTNER_AMOUNT_RATE (0.75), CANCELLATION_WINDOW_MS (15 * 60 * 1000), BOOKING_RADIUS_METRES
- [x] `packages/validators/src/index.ts` — BookingCreateSchema (Zod): package_ids, custom_service_ids, address fields, booking_type, scheduled_at
- [x] DB migration: customer auto-creation trigger (insert into customers on auth.users insert)
- [x] DB migration: RLS policies — packages/services allow anon SELECT; customers allow own SELECT/UPDATE; customer_addresses allow own CRUD; bookings allow own SELECT; booking_packages/booking_custom_services/booking_timeline allow own SELECT

### ✅ Customer App — Navigation Setup
- [x] Install and configure Expo Router v4 (change `main` to `expo-router/entry`, add scheme + plugin to app.json)
- [x] Add `@/*` path alias to tsconfig.json
- [x] Root layout `app/_layout.tsx`: import global.css, wrap AuthProvider, session guard (redirect to login if no session)
- [x] Auth stack layout `app/(auth)/_layout.tsx`
- [x] App tabs layout `app/(app)/_layout.tsx` — bottom tabs: Home, Bookings, Profile

### ✅ Customer App — Auth
- [x] `lib/auth.tsx` — AuthContext: session, loading, signOut; useAuth hook
- [x] Login screen `app/(auth)/sign-in.tsx` — email + password form, "Sign in with Google" button, link to signup
- [x] Signup screen `app/(auth)/sign-up.tsx` — full name, email, password, confirm password
- [x] "Check your email" screen shown after sign-up (confirmedEmail state)
- [x] `emailRedirectTo` points to admin app's `/auth/customer-confirmed` page (not deep link — browsers can't handle custom URL schemes)
- [x] Email confirmation landing page `apps/admin/src/app/auth/customer-confirmed/page.tsx` — shows confirmation + deep-link button to open app
- [x] Auto sign-out when customer row is deleted (Realtime DELETE subscription in auth.tsx)
- [x] DB migration: Realtime enabled on customers table (`supabase_realtime` publication + `REPLICA IDENTITY DEFAULT`)
- [x] DB migration: fix handle_new_user trigger (removed non-existent email column from INSERT)
- [x] Google OAuth via expo-web-browser + expo-auth-session → supabase.auth.signInWithOAuth
- [x] Session persistence on app restart (Supabase client handles via expo-secure-store)

### ✅ Customer App — Homepage & Package Browsing
- [x] Home stack layout `app/(app)/(home)/_layout.tsx`
- [x] Homepage `app/(app)/(home)/index.tsx` — greets user by name, FlatList of active packages, pull-to-refresh, loading/error/empty states
- [x] `components/PackageCard.tsx` — type badge, name, description, price; eye icon → detail page; card tap → Coming Soon (wired in 2D)
- [x] Package detail `app/(app)/(home)/package/[id].tsx` — name, description, services with checkmarks, sticky price footer, "Book This Package" CTA
- [x] Custom package builder `app/(app)/(home)/custom.tsx` — 15 service checklist, live running total, CTA disabled until ≥1 selected
- [x] `components/ServiceItem.tsx` — service row with circular checkbox + price

### ✅ Customer App — Booking Flow (2D-frontend)
- [x] `context/booking-flow.tsx` — BookingFlowContext: selected packages, custom services, total price, address (text + GPS coords + label), booking type, scheduled_at; reset()
- [x] Booking flow stack `app/booking/_layout.tsx` — modal Stack wrapping BookingFlowProvider
- [x] Step 1 — Package selection `app/booking/index.tsx`:
  - [x] Show all active packages as selectable cards
  - [x] Combination rules enforced: only one cleaning; standalone can combine with cleaning; custom clears all others
  - [x] "Next: Address" CTA disabled until ≥1 package selected
- [x] Step 2 — Address `app/booking/address.tsx`:
  - [x] Manual text input for full address (min 5 chars to proceed)
  - [x] GPS button → expo-location getCurrentPositionAsync → stores lat/lng
  - [x] Optional label picker (Home / Work / Parents' / Other)
  - [x] "Next: Schedule" CTA
- [x] Step 3 — Schedule `app/booking/schedule.tsx`:
  - [x] "Book Now" (instant) vs "Schedule for Later" selection
  - [x] Date-time picker via @react-native-community/datetimepicker (iOS spinner / Android split date+time)
  - [x] "Review Order" CTA
- [x] Step 4 — Order summary `app/booking/summary.tsx`:
  - [x] Selected packages + custom services + price breakdown
  - [x] Address + booking type/date shown
  - [x] Cash payment note
  - [x] "Book Now" button → POST /bookings (API_URL from EXPO_PUBLIC_API_URL) → dismissAll + success alert
  - [x] Error handling: shows API error in Alert

### ✅ Customer App — Cart UX & Polish (2D-frontend-polish)
- [x] Home screen = cart: + button adds to cart, eye icon views detail, card body not tappable
- [x] Custom package bypasses cart → goes directly from builder to address
- [x] Package deselection: tappable green checkmark removes package from cart (`removePackage` in context)
- [x] Cart strip at bottom of home screen: shows count + total, chevron arrow, taps → address page directly
- [x] Cart strip hidden when custom package is selected
- [x] Custom package card shows "Variable cost" instead of "Rs 0"
- [x] Safe area handling: `SafeAreaProvider` at root, `useSafeAreaInsets()` on home screen, `SafeAreaView` on auth screens
- [x] Android DateTimePicker fix: split `mode="datetime"` into separate date → time pickers (fixes "dismiss of undefined" crash)

### ✅ Customer App — Post-Booking
- [x] Post-booking / matching status screen `app/booking/matching.tsx`:
  - [x] "Finding a partner…" spinner while status = pending
  - [x] "Cancel" button (free cancellation before acceptance)
  - [x] Supabase Realtime subscription on booking status changes
  - [x] Once accepted: alert + navigate to home (active booking screen is Sprint 3)
- [ ] Active booking screen `app/(app)/bookings/active/[id].tsx` (stub for Sprint 2, full in Sprint 3):
  - [ ] Show booking status badge
  - [ ] Show partner info (once accepted): name, phone (tap-to-call), photo
  - [ ] Cancel button visible for 15 min after acceptance (Sprint 3)

### ✅ Customer App — Booking History
- [x] Booking history list `app/(app)/bookings/index.tsx` — FlatList with status badges, date, packages, price, pull-to-refresh, empty state
- [x] `components/BookingCard.tsx` — reusable card with colored status badge, package names, total, date
- [x] Bookings stack layout `app/(app)/bookings/_layout.tsx` — Stack for list → detail navigation
- [x] Booking detail `app/(app)/bookings/[id].tsx` — packages, custom services, total, address, schedule, timeline timestamps
- [x] Re-book button on completed/cancelled bookings — pre-fills booking flow context with same packages, navigates to address

### 🔲 Customer App — Address Book
- [ ] Address book screen `app/(app)/profile/addresses.tsx` — list saved addresses with default badge
- [ ] Add address form (accessible from address book and from booking flow step 2)
- [ ] Edit address (address text, label)
- [ ] Delete address (with confirmation)
- [ ] Set as default toggle

### 🔲 Customer App — Profile & Settings
- [ ] Profile screen `app/(app)/profile/index.tsx`:
  - [ ] Show name, email, phone, profile picture
  - [ ] Link to: Edit Profile, Address Book, Change Password, Notification Settings, Delete Account
- [ ] Edit profile `app/(app)/profile/edit.tsx` — change display name, phone, profile picture (image picker + upload to Supabase Storage)
- [ ] Change email `app/(app)/profile/change-email.tsx` — supabase.auth.updateUser({ email })
- [ ] Change / set password `app/(app)/profile/change-password.tsx` — for email users: old + new; for Google-only users: set new password (dual login)
- [ ] Push notification toggle (store preference; actual FCM wiring in Sprint 3)
- [ ] Log out — supabase.auth.signOut → redirect to login
- [ ] Delete account — confirmation dialog → delete customer row + supabase.auth.admin.deleteUser (via API)

### ✅ API — Booking Creation
- [x] Fastify auth plugin `apps/api/src/plugins/auth.ts` — verify Supabase JWT via JWKS endpoint (asymmetric keys, no static secret needed)
- [x] `POST /bookings` `apps/api/src/routes/bookings/index.ts`:
  - [x] Validate body with BookingCreateSchema (Zod)
  - [x] Validate package combination rules (server-side)
  - [x] Fetch packages + services, check all are active
  - [x] Calculate total_price (sum of package prices + custom service prices)
  - [x] Insert booking row (status: pending, address snapshot, total_price)
  - [x] Insert booking_packages rows (price_at_booking snapshot)
  - [x] Insert booking_custom_services rows if custom package (price_at_booking snapshot)
  - [x] Insert booking_timeline row (status: pending, actor_type: customer)
  - [x] Commission ledger deferred to partner acceptance (requires partner_id)
  - [x] Return { booking, packages, custom_services }
- [x] `DELETE /bookings/:id/cancel` — cancel before acceptance (only if status = pending, actor = customer)
- [x] Dependencies: `@fastify/jwt` + `get-jwks` (ES256 JWKS), `@safainow/validators`, `@safainow/constants`

---

## Sprint 3 — Matching & Live Job

### 🔲 Partner App — Foundation
- [ ] Configure Expo Router v4 in partner app
- [ ] `I18nManager.forceRTL(true)` on app start
- [ ] Load Noto Nastaliq Urdu font (`expo-font` or bundled asset)
- [ ] Root layout: AuthProvider + session guard → login if no session
- [ ] Auth stack + main stack layouts

### 🔲 Partner App — Auth
- [ ] `lib/auth.tsx` — AuthContext for partner (phone + passcode login)
- [ ] Login screen `app/(auth)/login.tsx` — phone number input + 6-digit passcode (Urdu UI)
- [ ] API: `POST /partners/login` — look up partner by phone, bcrypt.compare(passcode, hash), return Supabase custom JWT (or use signInWithPassword with phone hack)

### 🔲 Partner App — Incoming Job
- [ ] Register FCM device token on login → store in partners table
- [ ] Handle incoming FCM push notification (job offer) — show JobOfferScreen
- [ ] Job offer screen `app/job-offer/[booking_id].tsx` — customer area, packages, total price; Accept / Ignore buttons (full Urdu)
- [ ] API: `POST /bookings/:id/accept` — atomic UPDATE WHERE status=pending RETURNING *; on success: set status=accepted + on_route + log timeline; send dismissal to other notified partners
- [ ] If another partner accepted first: dismissal push → navigate back to home

### 🔲 Partner App — Active Job
- [ ] Active job screen `app/(app)/job/active.tsx`:
  - [ ] Customer name, address, phone (tap-to-call via `Linking.openURL('tel:...')`)
  - [ ] Live customer location on Google Maps (customer address lat/lng)
  - [ ] Job stage action button: correct button shown per current status
  - [ ] "پہنچ گیا" (Reached) → API PATCH /bookings/:id/reached → status=reached + work_in_progress auto
  - [ ] "کام مکمل" (Completed) → API PATCH /bookings/:id/completed → status=completed
  - [ ] "کیش وصول" (Cash Collected) → API PATCH /bookings/:id/cash-collected → status=cash_collected + update commission_ledger
  - [ ] Cancel button (visible within 15 min of accepted_at) → API DELETE /bookings/:id/cancel (partner)
  - [ ] Countdown timer showing time remaining in cancellation window

### 🔲 Matching Engine (API)
- [ ] `GET /partners/nearby` — PostGIS ST_DWithin query: active + available partners within radius
- [ ] On booking creation: query nearby partners, create job_offers rows, send FCM push to all
- [ ] FCM v1 push: `apps/api/src/lib/fcm.ts` — send via Google FCM HTTP v1 API (service account auth)
- [ ] Dismissal push: after job accepted, push to all other job_offers for same booking
- [ ] Timeout: if no partner accepts within N minutes, notify customer (DB-tracked timeout)
- [ ] On partner cancellation: reset booking to pending, re-run matching excluding cancelling partner

### 🔲 Live Location (Supabase Realtime)
- [ ] Partner app: publish GPS location every 5 seconds via Supabase channel while job is active
- [ ] Customer app: subscribe to partner location channel once booking accepted; show on Google Maps
- [ ] Store last known location in `partners.location` (PostGIS point) on each update

### 🔲 Tap-to-Call
- [ ] Customer app: tap partner phone → `Linking.openURL('tel:+92...')`
- [ ] Partner app: tap customer phone → `Linking.openURL('tel:+92...')`

### 🔲 Cancellation Window
- [ ] Customer app: cancel button on active booking only visible while `Date.now() - accepted_at < 15min`
- [ ] Customer app: countdown timer showing remaining cancellation window
- [ ] Partner app: cancel button on active job only visible within 15min window
- [ ] Partner app: countdown timer in Urdu
- [ ] API `DELETE /bookings/:id/cancel` — validates window, sets status, logs timeline, notifies other party

### 🔲 Customer Feedback
- [ ] Customer app: after booking status becomes `cash_collected`, show feedback prompt (thumbs up / thumbs down / skip)
- [ ] API `POST /bookings/:id/feedback` — store `customer_feedback` on booking row (positive | negative)

### 🔲 Partner App — Job History & Earnings
- [ ] Job history screen `app/(app)/history/index.tsx` — list past completed jobs (date, packages, price)
- [ ] Earnings screen `app/(app)/earnings/index.tsx` — total earned, commission owed per job

---

## Sprint 4 — Admin Dashboard & Financials

### 🔲 Admin — Dashboard Home
- [ ] Live active jobs feed (Supabase Realtime subscription on bookings where status not in terminal states)
- [ ] Summary card: jobs completed today
- [ ] Summary card: new customers registered this week
- [ ] Summary card: new partners registered this week
- [ ] Summary card: total commission collected vs outstanding
- [ ] Top performing partners table (ordered by completed job count)

### 🔲 Admin — Booking Management
- [ ] Bookings list page `/dashboard/bookings`:
  - [ ] Table: booking ID, customer, partner, packages, total price, commission, status, created_at
  - [ ] Live status badge updates via Supabase Realtime (no page refresh)
  - [ ] Filter by status, date range
- [ ] Booking detail page `/dashboard/bookings/[id]`:
  - [ ] All booking info: customer, partner, packages + services, address, total price
  - [ ] Commission amount (25%)
  - [ ] Customer feedback (thumbs up / down / none)
  - [ ] Full timestamp log per stage (from booking_timeline)
  - [ ] Travel time, job duration, total time (calculated from timestamps)
  - [ ] Cancellation info (who, when, reason) if applicable
  - [ ] "Cancel Booking" button — opens dialog with mandatory reason field → API call

### 🔲 Admin — Partner Management (Remaining)
- [ ] Reset passcode — generates new 6-digit code, bcrypt-hash + save, show plain once in modal
- [ ] Suspend / reactivate partner (is_active toggle with confirmation)
- [ ] Partner detail `/dashboard/partners/[id]` enhancements:
  - [ ] Job history table (all bookings for this partner)
  - [ ] Earnings summary (total earned across all jobs, commission paid, outstanding)
  - [ ] Feedback: thumbs up count, thumbs down count, positive rate %
  - [ ] Cancellation rate (partner-cancelled / total accepted)

### 🔲 Admin — Customer Management
- [ ] Customer list page `/dashboard/customers` — name, email, phone, joined date, total bookings
- [ ] Customer detail page `/dashboard/customers/[id]`:
  - [ ] Profile info
  - [ ] Full booking history table
  - [ ] Total spent
- [ ] Suspend / reactivate customer account (store `is_active` on customers table — add migration if needed)

### 🔲 Admin — Commission & Financials
- [ ] Commission ledger page `/dashboard/commission`:
  - [ ] Per-partner table: partner name, job date, job value, commission amount (25%), status (owed/collected), collected date
  - [ ] "Mark as Collected" per individual job row
  - [ ] "Mark All Collected" bulk action per partner
- [ ] Summary cards: total owed (all partners), collected this month, collected all time, outstanding
- [ ] Export full ledger as CSV (download via browser)

### 🔲 Admin — Reports
- [ ] Reports page `/dashboard/reports`:
  - [ ] Bookings per day / week / month (chart using shadcn chart or recharts + data table)
  - [ ] Top partners by jobs completed
  - [ ] Top customers by total bookings
  - [ ] Cancellation rates: overall, per partner, per customer
  - [ ] Revenue and commission summary
  - [ ] Export all reports as CSV

---

## Sprint 5 — Scheduled & Recurring Bookings

### 🔲 Scheduled Bookings
- [ ] Customer app: "Scheduled" booking type → date + time picker → store `scheduled_at` on booking
- [ ] API: accept `scheduled_at` in POST /bookings; match immediately but only notify partners at `scheduled_at` time
- [ ] Admin: show `scheduled_at` on booking detail and list

### 🔲 Recurring Bookings
- [ ] Install BullMQ + Redis (only sprint where this is allowed)
- [ ] Customer app: "Recurring" booking type → select frequency (weekly, biweekly, monthly)
- [ ] Store recurring schedule in a new `recurring_bookings` table (migration)
- [ ] BullMQ worker: at each recurrence time, create a new booking and trigger matching
- [ ] Admin: list + manage recurring schedules; cancel recurring series

---

## Cross-Cutting (any sprint)

- [ ] Push migration to Supabase after each new migration file (`supabase db push`)
- [ ] Regenerate `packages/types` after each schema change (`supabase gen types typescript`)
- [ ] All apps pass `tsc --noEmit` before each commit
- [ ] `tasks/lessons.md` updated after every correction
