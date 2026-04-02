import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface PartnerLocation {
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: number
}

interface UsePartnerLocationOptions {
  /** Booking ID to subscribe to */
  bookingId: string | null
  /** Whether subscription is active */
  isActive: boolean
}

/**
 * Subscribes to partner location updates via Supabase Realtime Broadcast.
 * Returns the latest partner location and auto-updates the marker.
 */
export function usePartnerLocation({ bookingId, isActive }: UsePartnerLocationOptions) {
  const [partnerLocation, setPartnerLocation] = useState<PartnerLocation | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!isActive || !bookingId) {
      // Clean up when not active
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      setPartnerLocation(null)
      return
    }

    // Subscribe to location channel
    const channel = supabase.channel(`location:${bookingId}`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'position_update' }, (payload) => {
        setPartnerLocation({
          latitude: payload.payload.latitude,
          longitude: payload.payload.longitude,
          accuracy: payload.payload.accuracy,
          timestamp: payload.payload.timestamp,
        })
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [isActive, bookingId])

  return partnerLocation
}