# SafaiNow — User Flows

## Customer Flow (English App)

### Authentication
- Sign up or login via email and password
- Sign up or login via Google OAuth
- Google users can set a password to enable dual login (Google + email/password)
- Change email address anytime from settings

### Homepage
- Browse all active packages
- Tap any package to view its detail page (name, description, full service list, flat price)
- Tap Custom Package to view all 15 individual services with individual prices

### Booking Flow

**Step 1 — Select Package(s)**
- Only one cleaning package allowed (Standard, Special or Advanced Deep Cleaning)
- Clothes Washing & Drying can be added alongside any cleaning package
- Custom Package is fully standalone — no combinations allowed
- If Custom Package selected, customer picks individual services with a live running total

**Step 2 — Select Address**
- Choose a saved address from the address book
- Add a new address on the spot
- Use live GPS location

**Step 3 — Choose Booking Type**
- Instant — book for right now
- Scheduled — pick a future date and time
- Recurring — set a repeating schedule (flat price per visit, no discount for MVP)

**Step 4 — Review & Confirm**
- Review order summary: packages selected, services included, total price
- Tap Book Now

### Post-Booking
- Live matching status shown while waiting for a partner to accept
- Once accepted: see partner name, number, CNIC, photo and live location on map
- Tap partner phone number to open dialer and call directly
- Track partner live location on map until they arrive
- Live job status updates as partner progresses through all stages
- Cancel freely before a partner accepts
- Cancel within 15 minutes of acceptance — after that the cancel button is locked
- After job completion, prompted with thumbs up or thumbs down (skippable, one tap)

### Booking History
- View all past and upcoming bookings
- View full detail per booking: packages, services, price, partner, status, timestamps
- Re-book a previous booking with one tap

### Address Book
- View all saved addresses
- Add a new address via search, map pin or live GPS
- Label each address (Home, Work, Parents House or custom label)
- Edit or delete any saved address
- Set a default address (auto-selected at booking time)

### Profile & Settings
- Change display name
- Change phone number
- Change profile picture
- Change email address
- Change password (Google-only users can set a password here for dual login)
- Toggle push notifications on or off
- Log out
- Delete account (with confirmation prompt)

---

## Partner Flow (Urdu App — Full RTL Layout)

> The Partner App is fully in Urdu with RTL layout. All buttons, labels, notifications, error messages and job details are in Urdu. Partners cannot self-register.

### Authentication
- Login via phone number and admin-generated 6-digit passcode
- No self-signup — partner accounts are created only by Admin
- Admin can reset passcode anytime; new passcode shown to admin once

### Incoming Job Notifications
- Receive push notification when a nearby job is available
- View job details before deciding: customer area, packages booked, total job price
- Accept or ignore the job
- If another partner accepts first, notified immediately and job is dismissed

### Active Job Screen
- View customer name, number, address and live location on map
- Tap customer phone number to open dialer and call directly
- Cancel job within 15 minutes of acceptance — after that cancellation is locked
- Progress through job stages using action buttons:

| Button (Urdu) | Action | System Effect |
|---|---|---|
| پہنچ گیا | Mark as Reached | Logs arrival timestamp, starts Work in Progress |
| کام مکمل | Mark Job Completed | Logs completion timestamp, prompts customer feedback |
| کیش وصول | Confirm Cash Collected | Logs cash collection timestamp, updates commission ledger |

### Job History
- View all past completed jobs
- View earnings and commission owed per job

---

## Admin Flow (Next.js Dashboard)

### Dashboard Home
- Live overview of all active jobs with current status
- Total jobs completed today
- New customers registered this week
- New partners registered this week
- Top performing partners by jobs completed
- Total commission collected vs total commission outstanding

### Booking Management
- Every booking visible the moment it is created
- Live status badge updating as partner progresses
- Full timestamps per stage: accepted, on route, reached, work in progress, completed, cash collected
- Travel time, job duration and total time per booking
- Full booking detail: customer, partner, packages, services, total price, commission amount
- Customer feedback (thumbs up or thumbs down) per booking
- Cancellation log: who cancelled, when, reason
- Admin can cancel any job at any stage with a mandatory reason

### Partner Management
- Create partner: name, phone, CNIC number, profile picture, CNIC picture
- System auto-generates 6-digit passcode on creation — shown once to admin
- Reset passcode anytime — new passcode shown once
- Edit partner profile details
- Suspend or reactivate a partner
- Delete a partner permanently
- View full job history per partner
- View thumbs up count, thumbs down count and positive feedback rate % per partner
- View cancellation rate per partner

### Customer Management
- View all registered customers
- View full booking history per customer
- Suspend or reactivate a customer account

### Individual Services Management (The Basket)
- Add a new individual service (name, price)
- Edit service name or price
- Disable or delete a service
- Disabled/deleted services automatically removed from all packages and custom package options

### Package Management
- Create a new package (name, description, type, services from basket, flat price)
- Edit package name, description and flat price
- Add or remove services from a package (basket only)
- Assign package type: cleaning, standalone or custom
- Enable or disable a package (hides from customer app without deleting)
- Delete a package permanently

### Commission & Financials
- View commission ledger per partner: owed, collected, outstanding
- Manually mark commission as collected per partner
- Total commission receivable across all partners
- Total commission collected this month and all time
- Outstanding balance per partner
- Export financial reports as CSV

### Reports
- Bookings per day, week and month
- Top partners by jobs completed
- Top customers by total bookings
- Cancellation rates: overall, per partner and per customer
- Revenue and commission summary
