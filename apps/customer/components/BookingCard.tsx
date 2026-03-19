import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Database } from '@safainow/types'

type BookingStatus = Database['public']['Enums']['booking_status']

type BookingPackage = {
  id: string
  package_name_en: string
  price_at_booking: number
}

interface BookingCardProps {
  id: string
  status: BookingStatus
  totalPrice: number
  createdAt: string
  packages: BookingPackage[]
  onPress: () => void
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
  accepted: { label: 'Partner Assigned', bg: 'bg-blue-100', text: 'text-blue-700' },
  on_route: { label: 'Partner Assigned', bg: 'bg-blue-100', text: 'text-blue-700' },
  reached: { label: 'In Progress', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  work_in_progress: { label: 'In Progress', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700' },
  cash_collected: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled_by_customer: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
  cancelled_by_partner: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
  cancelled_by_admin: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
}

export default function BookingCard({
  status,
  totalPrice,
  createdAt,
  packages,
  onPress,
}: BookingCardProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-3 rounded-2xl border border-gray-100 bg-white p-4"
    >
      <View className="flex-row items-center justify-between">
        <View className={`rounded-full px-3 py-1 ${config.bg}`}>
          <Text className={`text-xs font-semibold ${config.text}`}>{config.label}</Text>
        </View>
        <Text className="text-sm text-gray-400">
          {new Date(createdAt).toLocaleDateString('en-PK', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>

      <Text className="mt-3 text-base font-medium text-gray-900" numberOfLines={1}>
        {packages.map((p) => p.package_name_en).join(' + ')}
      </Text>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-base font-bold text-gray-900">
          Rs {totalPrice.toLocaleString()}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  )
}
