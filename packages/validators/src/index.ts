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
