import { useEffect, useState } from 'react'
import { View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import UrduText from '@/components/UrduText'

const API_URL = process.env.EXPO_PUBLIC_API_URL!

type BookingDetail = {
  id: string
  address_text: string
  total_price: number
  packages: { name_ur: string; price: number }[]
}

export default function JobOfferScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const { session } = useAuth()
  const insets = useSafeAreaInsets()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    async function fetchBooking() {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, address, total_price, booking_packages(price_at_booking, packages(name_ur))')
        .eq('id', bookingId)
        .single()

      if (error || !data) {
        router.replace('/(app)/(jobs)')
        return
      }

      setBooking({
        id: data.id,
        address_text: data.address,
        total_price: Number(data.total_price),
        packages: (data.booking_packages as unknown[]).map((bp: unknown) => ({
          name_ur: ((bp as { packages?: { name_ur?: string } }).packages as { name_ur?: string })?.name_ur ?? '',
          price: (bp as { price_at_booking?: number }).price_at_booking ?? 0,
        })),
      })
      setLoading(false)
    }
    if (bookingId) fetchBooking()
  }, [bookingId])

  async function handleAccept() {
    if (!session) return
    setAccepting(true)
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        router.replace('/(app)/(jobs)')
      } else if (res.status === 409) {
        Alert.alert('', 'یہ بکنگ کسی اور نے لے لی')
        router.replace('/(app)/(jobs)')
      } else {
        Alert.alert('خرابی', 'کوشش ناکام رہی')
      }
    } catch {
      Alert.alert('خرابی', 'نیٹ ورک میں مسئلہ ہے')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (!booking) return null

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-1 px-6">
        <UrduText className="text-2xl font-bold text-center text-gray-900 mb-6" style={{ fontSize: 24 }}>
          نئی بکنگ
        </UrduText>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <UrduText className="text-xs text-gray-500 mb-1 text-right" style={{ fontSize: 12 }}>پتہ</UrduText>
          <UrduText className="text-base text-gray-900 text-right" style={{ fontSize: 16 }}>
            {booking.address_text}
          </UrduText>
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <UrduText className="text-xs text-gray-500 mb-2 text-right" style={{ fontSize: 12 }}>خدمات</UrduText>
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

        <View className="bg-blue-50 rounded-xl p-4">
          <View className="flex-row justify-between items-center">
            <UrduText className="text-lg font-bold text-blue-600" style={{ fontSize: 18 }}>
              Rs {Math.round(booking.total_price * 0.75)}
            </UrduText>
            <UrduText className="text-base text-gray-700" style={{ fontSize: 16 }}>آپ کی کمائی</UrduText>
          </View>
        </View>
      </View>

      <View className="px-6 gap-3">
        <TouchableOpacity
          className="bg-green-600 rounded-xl py-4 items-center"
          onPress={handleAccept}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color="white" />
          ) : (
            <UrduText className="text-white text-xl font-bold" style={{ fontSize: 20 }}>
              قبول کریں
            </UrduText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-100 rounded-xl py-4 items-center"
          onPress={() => router.replace('/(app)/(jobs)')}
          disabled={accepting}
        >
          <UrduText className="text-gray-600 text-xl" style={{ fontSize: 20 }}>
            نظر انداز
          </UrduText>
        </TouchableOpacity>
      </View>
    </View>
  )
}