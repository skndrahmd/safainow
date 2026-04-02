import { useEffect, useState, useRef } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { usePartnerLocation } from '@/hooks/usePartnerLocation'
import PartnerMarker from '@/components/PartnerMarker'
import { BOOKING_STATUS } from '@safainow/constants'
import { Ionicons } from '@expo/vector-icons'

type Booking = {
  id: string
  status: string
  address: string
  address_lat: number | null
  address_lng: number | null
  accepted_at: string | null
  partners: {
    full_name: string
    phone: string
    profile_picture_url: string | null
  } | null
}

export default function ActiveBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView | null>(null)

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to partner location
  const partnerLocation = usePartnerLocation({
    bookingId: id,
    isActive: !!booking && [
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.ON_ROUTE,
      BOOKING_STATUS.REACHED,
    ].includes(booking.status as typeof BOOKING_STATUS.ACCEPTED | typeof BOOKING_STATUS.ON_ROUTE | typeof BOOKING_STATUS.REACHED),
  })

  useEffect(() => {
    if (session && id) {
      fetchBooking()
    }
  }, [session, id])

  // Fit map to show both locations when partner location updates
  useEffect(() => {
    if (booking?.address_lat && booking?.address_lng && partnerLocation) {
      mapRef.current?.fitToCoordinates(
        [
          { latitude: booking.address_lat, longitude: booking.address_lng },
          { latitude: partnerLocation.latitude, longitude: partnerLocation.longitude },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      )
    }
  }, [partnerLocation, booking?.address_lat, booking?.address_lng])

  async function fetchBooking() {
    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          address,
          address_lat,
          address_lng,
          accepted_at,
          partners (full_name, phone, profile_picture_url)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      setBooking(data as Booking)
    } catch (err) {
      setError('Could not load booking details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (error || !booking) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-red-500 text-center">{error || 'Booking not found'}</Text>
        <TouchableOpacity
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const statusLabels: Record<string, string> = {
    pending: 'Finding a partner...',
    accepted: 'Partner is on the way',
    on_route: 'Partner is on the way',
    reached: 'Partner has arrived',
    work_in_progress: 'Work in progress',
    completed: 'Work completed',
    cash_collected: 'Payment received',
  }

  const latitude = booking.address_lat ?? 24.8607 // Default: Karachi
  const longitude = booking.address_lng ?? 67.0011

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Track Partner</Text>
      </View>

      {/* Map */}
      <View className="flex-1">
        {booking.address_lat && booking.address_lng ? (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {/* Customer location marker */}
            <Marker
              coordinate={{
                latitude: booking.address_lat,
                longitude: booking.address_lng,
              }}
              title="Your location"
              pinColor="red"
            />

            {/* Partner location marker (animated) */}
            {partnerLocation && (
              <PartnerMarker
                mapRef={mapRef}
                latitude={partnerLocation.latitude}
                longitude={partnerLocation.longitude}
                title={booking.partners?.full_name || 'Partner'}
              />
            )}
          </MapView>
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <Text className="text-gray-500">Location not available</Text>
          </View>
        )}
      </View>

      {/* Status card at bottom */}
      <View
        className="bg-white border-t border-gray-200 px-4 py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text className="text-lg font-semibold text-center text-gray-900 mb-2">
          {statusLabels[booking.status] || booking.status}
        </Text>

        {booking.partners && (
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-sm text-gray-600">{booking.partners.full_name}</Text>
            {partnerLocation && (
              <Text className="text-xs text-green-600">• Live tracking active</Text>
            )}
          </View>
        )}
      </View>
    </View>
  )
}