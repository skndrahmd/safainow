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
