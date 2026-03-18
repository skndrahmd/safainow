import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useBookingFlow } from '@/context/booking-flow'
import { useAuth } from '@/lib/auth'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function SummaryScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const flow = useBookingFlow()
  const [submitting, setSubmitting] = useState(false)

  const handleBook = async () => {
    setSubmitting(true)
    try {
      const payload = {
        package_ids: flow.selectedPackages.map((p) => p.id),
        custom_service_ids: flow.customServices.map((s) => s.id),
        address_text: flow.addressText,
        address_latitude: flow.addressLatitude ?? 0,
        address_longitude: flow.addressLongitude ?? 0,
        address_label: flow.addressLabel,
        saved_address_id: null,
        booking_type: flow.bookingType,
        scheduled_at: flow.scheduledAt,
      }

      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error((err as { message?: string }).message ?? 'Booking failed')
      }

      flow.reset()
      router.dismissAll()
      Alert.alert('Booked!', 'Your request is being sent to nearby partners.')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not place booking. Please try again.'
      Alert.alert('Error', message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : null)

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Order Summary',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />
      <ScrollView className="flex-1 bg-white px-5 pt-6" contentContainerClassName="pb-40">
        {/* Packages */}
        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Packages
        </Text>
        {flow.selectedPackages.map((pkg) => (
          <View key={pkg.id} className="mb-2 flex-row items-center justify-between">
            <Text className="text-base text-gray-900">{pkg.name}</Text>
            <Text className="text-base font-semibold text-gray-900">
              Rs {pkg.price.toLocaleString()}
            </Text>
          </View>
        ))}

        {/* Custom services */}
        {flow.customServices.length > 0 && (
          <>
            <Text className="mb-3 mt-5 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Custom Services
            </Text>
            {flow.customServices.map((svc) => (
              <View key={svc.id} className="mb-2 flex-row items-center justify-between">
                <Text className="text-base text-gray-900">{svc.name}</Text>
                <Text className="text-base font-semibold text-gray-900">
                  Rs {svc.price.toLocaleString()}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Divider + Total */}
        <View className="my-4 border-t border-gray-100" />
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">Total</Text>
          <Text className="text-xl font-bold text-gray-900">
            Rs {flow.totalPrice.toLocaleString()}
          </Text>
        </View>

        {/* Address */}
        <Text className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Address
        </Text>
        <View className="flex-row items-start gap-2">
          <Ionicons name="location-outline" size={18} color="#6b7280" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-base text-gray-700">{flow.addressText}</Text>
        </View>

        {/* Schedule */}
        <Text className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Schedule
        </Text>
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={18} color="#6b7280" />
          <Text className="text-base text-gray-700">
            {flow.bookingType === 'instant'
              ? 'Book Now (instant)'
              : formatDate(flow.scheduledAt) ?? 'Scheduled'}
          </Text>
        </View>

        {/* Payment note */}
        <View className="mt-6 rounded-xl bg-gray-50 px-4 py-3">
          <Text className="text-sm text-gray-500">
            Payment is cash-on-delivery. You pay the partner directly after the job is done.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <TouchableOpacity
          className="items-center rounded-2xl bg-gray-900 py-4"
          onPress={handleBook}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">Book Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  )
}
