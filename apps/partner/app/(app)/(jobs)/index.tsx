import { useEffect, useState } from 'react'
import { View, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import UrduText from '@/components/UrduText'

const API_URL = process.env.EXPO_PUBLIC_API_URL!

type ActiveBooking = {
  id: string
  status: string
  address: string
  total_price: number
  accepted_at: string | null
  customer_name: string
  customer_phone: string | null
  packages: { name_ur: string; price: number }[]
}

export default function JobsScreen() {
  const { session } = useAuth()
  const insets = useSafeAreaInsets()
  const [booking, setBooking] = useState<ActiveBooking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActiveJob() {
      if (!session) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/bookings/partner/active`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setBooking({
              id: data.id,
              status: data.status,
              address: data.address,
              total_price: Number(data.total_price),
              accepted_at: data.accepted_at,
              customer_name: data.customer_name ?? '',
              customer_phone: data.customer_phone,
              packages: (data.packages ?? []).map((p: { name_ur: string; price: number }) => ({
                name_ur: p.name_ur,
                price: p.price,
              })),
            })
          }
        }
      } catch {
        // Network error, keep booking as null
      } finally {
        setLoading(false)
      }
    }
    fetchActiveJob()
  }, [session])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (!booking) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <UrduText className="text-xl text-gray-400" style={{ fontSize: 20 }}>
          کوئی فعال کام نہیں
        </UrduText>
      </View>
    )
  }

  const partnerEarnings = Math.round(booking.total_price * 0.75)

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-1 px-6">
        <UrduText className="text-2xl font-bold text-center text-gray-900 mb-6" style={{ fontSize: 24 }}>
          فعال کام
        </UrduText>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <UrduText className="text-xs text-gray-500 mb-1 text-right" style={{ fontSize: 12 }}>
            حالت
          </UrduText>
          <UrduText className="text-base text-blue-600 text-right" style={{ fontSize: 16 }}>
            {statusToUrdu(booking.status)}
          </UrduText>
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <UrduText className="text-xs text-gray-500 mb-1 text-right" style={{ fontSize: 12 }}>
            گاہک
          </UrduText>
          <UrduText className="text-base text-gray-900 text-right" style={{ fontSize: 16 }}>
            {booking.customer_name}
          </UrduText>
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <UrduText className="text-xs text-gray-500 mb-1 text-right" style={{ fontSize: 12 }}>
            پتہ
          </UrduText>
          <UrduText className="text-base text-gray-900 text-right" style={{ fontSize: 16 }}>
            {booking.address}
          </UrduText>
        </View>

        <View className="bg-blue-50 rounded-xl p-4 mb-4">
          <UrduText className="text-xs text-gray-500 mb-2 text-right" style={{ fontSize: 12 }}>
            خدمات
          </UrduText>
          {booking.packages.map((pkg, i) => (
            <View key={i} className="flex-row justify-between items-center mb-1">
              <UrduText className="text-sm text-gray-500" style={{ fontSize: 14 }}>
                Rs {pkg.price}
              </UrduText>
              <UrduText className="text-sm text-gray-900" style={{ fontSize: 14 }}>
                {pkg.name_ur}
              </UrduText>
            </View>
          ))}
        </View>

        <View className="bg-green-50 rounded-xl p-4">
          <View className="flex-row justify-between items-center">
            <UrduText className="text-lg font-bold text-green-600" style={{ fontSize: 18 }}>
              Rs {partnerEarnings}
            </UrduText>
            <UrduText className="text-base text-gray-700" style={{ fontSize: 16 }}>
              آپ کی کمائی
            </UrduText>
          </View>
        </View>
      </View>

      <View className="px-6">
        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 items-center"
          onPress={() => router.push('/(app)/(jobs)/active')}
        >
          <UrduText className="text-white text-xl font-bold" style={{ fontSize: 20 }}>
            تفصیلات دیکھیں
          </UrduText>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function statusToUrdu(status: string): string {
  const map: Record<string, string> = {
    accepted: 'قبول شدہ',
    on_route: 'راستے میں',
    reached: 'پہنچ گیا',
    work_in_progress: 'کام جاری',
    completed: 'مکمل',
    cash_collected: 'کیش وصول',
  }
  return map[status] ?? status
}