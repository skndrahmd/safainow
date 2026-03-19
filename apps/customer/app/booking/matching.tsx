import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { BOOKING_STATUS } from '@safainow/constants'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.100.79:3001'

export default function MatchingScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const [status, setStatus] = useState<string>(BOOKING_STATUS.PENDING)
  const [cancelling, setCancelling] = useState(false)

  // Subscribe to booking status changes via Supabase Realtime
  useEffect(() => {
    if (!bookingId) return

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status
          setStatus(newStatus)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  // React to status changes
  useEffect(() => {
    if (status === BOOKING_STATUS.ACCEPTED || status === BOOKING_STATUS.ON_ROUTE) {
      // Partner accepted — go to home for now (active booking screen is Sprint 3)
      Alert.alert(
        'Partner Found!',
        'A partner has accepted your booking and is on the way.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.dismissAll()
            },
          },
        ],
      )
    }

    if (
      status === BOOKING_STATUS.CANCELLED_BY_ADMIN ||
      status === BOOKING_STATUS.CANCELLED_BY_PARTNER
    ) {
      Alert.alert('Booking Cancelled', 'Your booking was cancelled. Please try again.', [
        {
          text: 'OK',
          onPress: () => {
            router.dismissAll()
          },
        },
      ])
    }
  }, [status])

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true)
          try {
            const res = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${session?.access_token ?? ''}`,
              },
            })

            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: 'Unknown error' }))
              throw new Error((err as { message?: string }).message ?? 'Cancel failed')
            }

            router.dismissAll()
          } catch (e: unknown) {
            const message =
              e instanceof Error ? e.message : 'Could not cancel booking. Please try again.'
            Alert.alert('Error', message)
          } finally {
            setCancelling(false)
          }
        },
      },
    ])
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerBackVisible: false,
          gestureEnabled: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <View className="flex-1 items-center justify-center bg-white px-8">
        <View className="mb-8 h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="search-outline" size={36} color="#111827" />
        </View>

        <Text className="mb-2 text-center text-xl font-bold text-gray-900">
          Finding a Partner...
        </Text>
        <Text className="mb-8 text-center text-base text-gray-500">
          We're looking for a cleaning partner near you. This usually takes a minute or two.
        </Text>

        <ActivityIndicator size="large" color="#111827" />

        <TouchableOpacity
          onPress={handleCancel}
          disabled={cancelling}
          className="mt-12 rounded-2xl border border-gray-200 px-8 py-3"
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Text className="text-base font-medium text-gray-500">Cancel Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  )
}
