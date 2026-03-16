# SafaiNow — Job Lifecycle & Matching Logic

## Job Lifecycle

### Status Enum

```typescript
type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'on_route'
  | 'reached'
  | 'work_in_progress'
  | 'completed'
  | 'cash_collected'
  | 'cancelled_by_customer'
  | 'cancelled_by_partner'
  | 'cancelled_by_admin'
```

### Stage Progression

| Stage | Triggered By | Notes |
|---|---|---|
| `pending` | Customer taps Book Now | Job enters matching queue |
| `accepted` | Partner accepts notification | First to accept wins |
| `on_route` | System (auto) | Logged immediately on acceptance |
| `reached` | Partner taps "پہنچ گیا" | Arrival logged |
| `work_in_progress` | System (auto) | Logged immediately on reached |
| `completed` | Partner taps "کام مکمل" | Customer prompted for feedback |
| `cash_collected` | Partner taps "کیش وصول" | Commission ledger updated |
| `cancelled_by_customer` | Customer cancels | Within window only |
| `cancelled_by_partner` | Partner cancels | Within window only, job re-enters pool |
| `cancelled_by_admin` | Admin cancels | Any stage, mandatory reason required |

### Booking Timeline Log

Every status change is written as an immutable record to `booking_timeline`:
```
booking_timeline {
  id
  booking_id
  status
  timestamp
  notes (for cancellation reason)
}
```

## Time Metrics

| Metric | From | To |
|---|---|---|
| Travel Time | `accepted` timestamp | `reached` timestamp |
| Job Duration | `reached` timestamp | `completed` timestamp |
| Total Time | Booking `created_at` | `cash_collected` timestamp |

## Cancellation Rules

### Before Acceptance
- Customer can cancel freely at any time
- No penalty, no window restriction

### After Acceptance (15-Minute Window)
- Both customer AND partner have exactly 15 minutes from `accepted_at` to cancel
- Both apps show a countdown timer
- After 15 minutes the cancel button disappears on both apps
- Admin can still cancel at any stage regardless of the window

### On Partner Cancellation
1. Job status resets to `pending`
2. `cancelled_by_partner` logged in `booking_timeline`
3. Matching engine re-runs, excluding the cancelling partner
4. Next closest available partners are notified
5. Admin sees the re-match attempt in real time

### On Customer Cancellation
1. Job status set to `cancelled_by_customer`
2. Logged in `booking_timeline` with timestamp
3. Partner notified via push notification
4. Job is closed

### On Admin Cancellation
1. Job status set to `cancelled_by_admin`
2. Reason is mandatory — stored in `booking_timeline`
3. Both customer and partner notified

## Partner Matching Logic

### How It Works
1. Customer taps Book Now
2. System queries all active, available partners within geo-radius using PostGIS
3. Push notifications sent simultaneously to all nearby partners
4. First partner to tap Accept is assigned the job atomically
5. All other notified partners receive a dismissal notification
6. If no partner accepts within a set timeout, customer is notified
7. On partner cancellation, re-matching runs excluding the cancelling partner

### Race Condition Handling (No Queue Needed)
Handled at the database level using a single atomic SQL transaction:

```sql
UPDATE bookings
SET
  partner_id = $partnerId,
  status = 'accepted',
  accepted_at = NOW()
WHERE
  id = $bookingId
  AND status = 'pending'
RETURNING *;
```

- If the query returns a row → partner successfully claimed the job
- If the query returns nothing → another partner got there first, send dismissal

No BullMQ or Redis needed for MVP. This handles the race condition cleanly.

### Geo Query (PostGIS)
```sql
SELECT p.id, p.name,
  ST_Distance(p.location, ST_MakePoint($lng, $lat)::geography) AS distance
FROM partners p
WHERE
  p.status = 'active'
  AND p.is_available = true
  AND ST_DWithin(p.location, ST_MakePoint($lng, $lat)::geography, $radiusMeters)
ORDER BY distance ASC;
```

## Customer Feedback

- Triggered after partner taps "کیش وصول" (cash collected)
- Customer sees thumbs up or thumbs down prompt
- Completely optional — skippable with one tap
- No written review, no star rating
- Stored as `customer_feedback` on the booking: `positive | negative | null`
- Admin sees per-partner: thumbs up count, thumbs down count, positive feedback rate %
