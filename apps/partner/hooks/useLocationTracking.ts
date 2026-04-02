import { useEffect, useRef, useCallback } from 'react'
import * as Location from 'expo-location'
import { supabase } from '@/lib/supabase'

interface UseLocationTrackingOptions {
  /** Whether tracking is active */
  isActive: boolean
  /** Booking ID to use as channel identifier */
  bookingId: string | null
  /** Interval in milliseconds between updates (default: 5000) */
  interval?: number
  /** Whether to also persist to database (default: true) */
  persistToDb?: boolean
}

interface LocationCoords {
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: number
}

/**
 * Tracks partner location and broadcasts via Supabase Realtime.
 * Also persists last known location to partners table for recovery.
 */
export function useLocationTracking({
  isActive,
  bookingId,
  interval = 5000,
  persistToDb = true,
}: UseLocationTrackingOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null)
  const lastLocationRef = useRef<LocationCoords | null>(null)
  const lastPersistRef = useRef<number>(0)

  // Helper: Calculate distance in kilometers using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  // Helper: Persist location to database
  const persistLocation = useCallback(async (latitude: number, longitude: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Update partner's last_location using PostGIS
      await supabase.rpc('update_partner_location', {
        p_user_id: user.id,
        p_latitude: latitude,
        p_longitude: longitude,
      })
    } catch (error) {
      console.error('Failed to persist location:', error)
    }
  }, [])

  useEffect(() => {
    if (!isActive || !bookingId) {
      // Clean up when not active
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove()
        locationSubscriptionRef.current = null
      }
      return
    }

    let isMounted = true

    // Request permissions and start tracking
    async function startTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          console.warn('Location permission not granted')
          return
        }

        // Create broadcast channel for this booking
        const channel = supabase.channel(`location:${bookingId}`)
        channelRef.current = channel
        await channel.subscribe()

        // Watch position and broadcast
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Update every 10 meters
            timeInterval: interval,
          },
          async (location) => {
            if (!isMounted) return

            const { latitude, longitude, accuracy } = location.coords

            // Broadcast to channel
            await channel.send({
              type: 'broadcast',
              event: 'position_update',
              payload: {
                latitude,
                longitude,
                accuracy,
                timestamp: location.timestamp,
              },
            })

            // Persist to database (debounced to reduce writes)
            if (persistToDb) {
              const now = Date.now()
              const shouldPersist =
                !lastLocationRef.current ||
                calculateDistance(
                  lastLocationRef.current.latitude,
                  lastLocationRef.current.longitude,
                  latitude,
                  longitude
                ) > 0.05 || // 50m threshold
                now - lastPersistRef.current > 30000 // 30s timeout

              if (shouldPersist) {
                await persistLocation(latitude, longitude)
                lastPersistRef.current = now
              }
            }

            lastLocationRef.current = {
              latitude,
              longitude,
              accuracy,
              timestamp: location.timestamp,
            }
          }
        )

        locationSubscriptionRef.current = subscription
      } catch (error) {
        console.error('Failed to start location tracking:', error)
      }
    }

    startTracking()

    return () => {
      isMounted = false
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove()
      }
    }
  }, [isActive, bookingId, interval, persistToDb, calculateDistance, persistLocation])

  return null
}