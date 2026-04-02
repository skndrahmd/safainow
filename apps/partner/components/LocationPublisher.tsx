import { useLocationTracking } from '@/hooks/useLocationTracking'

interface LocationPublisherProps {
  /** Whether there's an active job */
  isActive: boolean
  /** The booking ID to broadcast location for */
  bookingId: string | null
}

/**
 * Component that starts location tracking when there's an active job.
 * Renders nothing — it's a pure side-effect component.
 */
export default function LocationPublisher({ isActive, bookingId }: LocationPublisherProps) {
  useLocationTracking({
    isActive: isActive && !!bookingId,
    bookingId,
    interval: 5000, // 5 seconds
    persistToDb: true,
  })

  return null
}