import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useBookingFlow } from '@/context/booking-flow'
import type { Database } from '@safainow/types'

type BookingRow = Database['public']['Tables']['bookings']['Row']
type BookingPackageRow = Database['public']['Tables']['booking_packages']['Row']
type BookingCustomServiceRow = Database['public']['Tables']['booking_custom_services']['Row']

type BookingDetail = BookingRow & {
  booking_packages: BookingPackageRow[]
  booking_custom_services: BookingCustomServiceRow[]
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
  accepted: { label: 'Partner Assigned', bg: 'bg-blue-100', text: 'text-blue-700' },
  on_route: { label: 'Partner On Route', bg: 'bg-blue-100', text: 'text-blue-700' },
  reached: { label: 'Partner Reached', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  work_in_progress: { label: 'In Progress', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700' },
  cash_collected: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled_by_customer: { label: 'Cancelled by You', bg: 'bg-red-100', text: 'text-red-700' },
  cancelled_by_partner: { label: 'Cancelled by Partner', bg: 'bg-red-100', text: 'text-red-700' },
  cancelled_by_admin: { label: 'Cancelled by Admin', bg: 'bg-red-100', text: 'text-red-700' },
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const flow = useBookingFlow()
  const insets = useSafeAreaInsets()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !session?.user.id) return

    supabase
      .from('bookings')
      .select('*, booking_packages(*), booking_custom_services(*)')
      .eq('id', id)
      .eq('customer_id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Failed to fetch booking:', error)
        else setBooking(data as BookingDetail)
        setLoading(false)
      })
  }, [id, session?.user.id])

  const canRebook =
    booking?.status === 'completed' ||
    booking?.status === 'cash_collected' ||
    booking?.status === 'cancelled_by_customer' ||
    booking?.status === 'cancelled_by_partner' ||
    booking?.status === 'cancelled_by_admin'

  const handleRebook = () => {
    if (!booking) return

    const snapshots = booking.booking_packages.map((pkg) => ({
      id: pkg.package_id,
      name: pkg.package_name_en,
      price: pkg.price_at_booking,
      type: pkg.package_type,
    }))

    flow.setSelectedPackages(snapshots)
    router.push('/booking/address')
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }

  if (!booking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-gray-400">Booking not found</Text>
      </View>
    )
  }

  const config = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending

  return (
    <View className="flex-1 bg-white">
      {/* Manual header with safe area */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-5 pb-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Booking Detail</Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-40">
        {/* Status badge */}
        <View className={`self-start rounded-full px-4 py-1.5 ${config.bg}`}>
          <Text className={`text-sm font-semibold ${config.text}`}>{config.label}</Text>
        </View>

        {/* Packages */}
        <Text className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Packages
        </Text>
        {booking.booking_packages.map((pkg) => (
          <View key={pkg.id} className="mb-2 flex-row items-center justify-between">
            <Text className="text-base text-gray-900">{pkg.package_name_en}</Text>
            {pkg.package_type !== 'custom' && (
              <Text className="text-base font-semibold text-gray-900">
                Rs {pkg.price_at_booking.toLocaleString()}
              </Text>
            )}
          </View>
        ))}

        {/* Custom services */}
        {booking.booking_custom_services.length > 0 && (
          <>
            <Text className="mb-3 mt-5 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Custom Services
            </Text>
            {booking.booking_custom_services.map((svc) => (
              <View key={svc.id} className="mb-2 flex-row items-center justify-between">
                <Text className="text-base text-gray-900">{svc.service_name_en}</Text>
                <Text className="text-base font-semibold text-gray-900">
                  Rs {svc.price_at_booking.toLocaleString()}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Total */}
        <View className="my-4 border-t border-gray-100" />
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">Total</Text>
          <Text className="text-xl font-bold text-gray-900">
            Rs {booking.total_price.toLocaleString()}
          </Text>
        </View>

        {/* Address */}
        <Text className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Address
        </Text>
        <View className="flex-row items-start gap-2">
          <Ionicons name="location-outline" size={18} color="#6b7280" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-base text-gray-700">{booking.address}</Text>
        </View>

        {/* Schedule */}
        <Text className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Schedule
        </Text>
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={18} color="#6b7280" />
          <Text className="text-base text-gray-700">
            {booking.scheduled_at
              ? formatDate(booking.scheduled_at)
              : 'Instant booking'}
          </Text>
        </View>

        {/* Timeline */}
        <Text className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Timeline
        </Text>
        <View className="gap-2">
          <TimelineRow label="Booked" time={booking.created_at} />
          {booking.accepted_at && <TimelineRow label="Accepted" time={booking.accepted_at} />}
          {booking.reached_at && <TimelineRow label="Partner Reached" time={booking.reached_at} />}
          {booking.completed_at && <TimelineRow label="Completed" time={booking.completed_at} />}
          {booking.cash_collected_at && (
            <TimelineRow label="Cash Collected" time={booking.cash_collected_at} />
          )}
          {booking.cancelled_at && <TimelineRow label="Cancelled" time={booking.cancelled_at} />}
        </View>
      </ScrollView>

      {/* Re-book footer */}
      {canRebook && (
        <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
          <TouchableOpacity
            className="items-center rounded-2xl bg-gray-900 py-4"
            onPress={handleRebook}
          >
            <Text className="text-base font-semibold text-white">Book Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

function TimelineRow({ label, time }: { label: string; time: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-sm text-gray-400">
        {new Date(time).toLocaleDateString('en-PK', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  )
}
