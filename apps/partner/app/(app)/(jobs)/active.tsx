import { useEffect, useState } from 'react'
import { View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Linking from 'expo-linking'
import { useAuth } from '@/lib/auth'
import UrduText from '@/components/UrduText'
import CountdownTimer from '@/components/CountdownTimer'
import LocationPublisher from '@/components/LocationPublisher'
import { BOOKING_STATUS, CANCELLATION_WINDOW_MS } from '@safainow/constants'

const API_URL = process.env.EXPO_PUBLIC_API_URL!

type ActiveBooking = {
  id: string
  status: string
  address: string
  address_lat: number | null
  address_lng: number | null
  total_price: number
  accepted_at: string | null
  customer_name: string
  customer_phone: string | null
  packages: { name_ur: string; price: number }[]
}

export default function ActiveJobScreen() {
  const { session } = useAuth()
  const insets = useSafeAreaInsets()
  const [booking, setBooking] = useState<ActiveBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

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
              address_lat: data.address_lat,
              address_lng: data.address_lng,
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
        // Network error
      } finally {
        setLoading(false)
      }
    }
    fetchActiveJob()
  }, [session])

  async function handleStatusUpdate(endpoint: string, successMsg: string) {
    if (!booking || !session) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/bookings/${booking.id}/${endpoint}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        Alert.alert('', successMsg)
        // Refetch to update status
        const refetch = await fetch(`${API_URL}/bookings/partner/active`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (refetch.ok) {
          const data = await refetch.json()
          if (data) {
            setBooking({
              id: data.id,
              status: data.status,
              address: data.address,
              address_lat: data.address_lat,
              address_lng: data.address_lng,
              total_price: Number(data.total_price),
              accepted_at: data.accepted_at,
              customer_name: data.customer_name ?? '',
              customer_phone: data.customer_phone,
              packages: (data.packages ?? []).map((p: { name_ur: string; price: number }) => ({
                name_ur: p.name_ur,
                price: p.price,
              })),
            })
          } else {
            router.replace('/(app)/(jobs)')
          }
        }
      } else {
        Alert.alert('خرابی', 'کوشش ناکام رہی')
      }
    } catch {
      Alert.alert('خرابی', 'نیٹ ورک میں مسئلہ ہے')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!booking || !session) return
    Alert.alert(
      'منسوخی',
      'کیا آپ واقعی یہ کام منسوخ کرنا چاہتے ہیں؟',
      [
        { text: 'نہیں', style: 'cancel' },
        {
          text: 'ہاں',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true)
            try {
              const res = await fetch(`${API_URL}/bookings/${booking.id}/cancel-partner`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` },
              })
              if (res.ok) {
                router.replace('/(app)/(jobs)')
              } else {
                Alert.alert('خرابی', 'منسوخی ممکن نہیں')
              }
            } catch {
              Alert.alert('خرابی', 'نیٹ ورک میں مسئلہ ہے')
            } finally {
              setActionLoading(false)
            }
          },
        },
      ],
    )
  }

  function handleCall() {
    if (booking?.customer_phone) {
      Linking.openURL(`tel:${booking.customer_phone}`)
    }
  }

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
  const canCancel = booking.accepted_at && isWithinCancellationWindow(booking.accepted_at)
  const latitude = booking.address_lat ?? 24.8607 // Default: Karachi
  const longitude = booking.address_lng ?? 67.0011

  // Track location while job is active (accepted → cash_collected)
  const isTrackingActive = booking && [
    BOOKING_STATUS.ACCEPTED,
    BOOKING_STATUS.ON_ROUTE,
    BOOKING_STATUS.REACHED,
    BOOKING_STATUS.WORK_IN_PROGRESS,
  ].includes(booking.status as any)

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Location tracking - broadcasts GPS while job is active */}
      <LocationPublisher isActive={isTrackingActive} bookingId={booking?.id ?? null} />
      <ScrollView className="flex-1">
        {/* Map */}
        <View className="h-48">
          <MapView
            provider={PROVIDER_GOOGLE}
            className="w-full h-full"
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{ latitude, longitude }}
              title={booking.customer_name}
              description={booking.address}
            />
          </MapView>
        </View>

        <View className="px-4 py-4">
          {/* Customer Info */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <TouchableOpacity
                className="bg-green-600 rounded-lg px-4 py-2 flex-row items-center"
                onPress={handleCall}
                disabled={!booking.customer_phone}
              >
                <UrduText className="text-white text-sm font-bold" style={{ fontSize: 14 }}>
                  کال
                </UrduText>
              </TouchableOpacity>
              <UrduText className="text-base text-gray-900 text-right" style={{ fontSize: 16 }}>
                {booking.customer_name}
              </UrduText>
            </View>
            <UrduText className="text-xs text-gray-500 text-right" style={{ fontSize: 12 }}>
              گاہک
            </UrduText>
          </View>

          {/* Address */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <UrduText className="text-xs text-gray-500 mb-1 text-right" style={{ fontSize: 12 }}>
              پتہ
            </UrduText>
            <UrduText className="text-base text-gray-900 text-right" style={{ fontSize: 16 }}>
              {booking.address}
            </UrduText>
          </View>

          {/* Packages */}
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

          {/* Earnings */}
          <View className="bg-green-50 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center">
              <UrduText className="text-lg font-bold text-green-600" style={{ fontSize: 18 }}>
                Rs {partnerEarnings}
              </UrduText>
              <UrduText className="text-base text-gray-700" style={{ fontSize: 16 }}>
                آپ کی کمائی
              </UrduText>
            </View>
          </View>

          {/* Countdown Timer for cancellation window */}
          {canCancel && (
            <View className="mb-4">
              <CountdownTimer
                startedAt={booking.accepted_at!}
                durationMs={CANCELLATION_WINDOW_MS}
                onExpire={() => {}}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="px-4 gap-3">
        {booking && renderActionButton(booking)}

        {canCancel && (
          <TouchableOpacity
            className="bg-red-100 rounded-xl py-3 items-center"
            onPress={handleCancel}
            disabled={actionLoading}
          >
            <UrduText className="text-red-600 text-lg" style={{ fontSize: 18 }}>
              منسوخ کریں
            </UrduText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  function renderActionButton(b: ActiveBooking) {
    const { status } = b

    if (status === BOOKING_STATUS.ON_ROUTE) {
      return (
        <TouchableOpacity
          className="bg-green-600 rounded-xl py-4 items-center"
          onPress={() => handleStatusUpdate('reached', 'آپ پہنچ گئے')}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <UrduText className="text-white text-xl font-bold" style={{ fontSize: 20 }}>
              پہنچ گیا
            </UrduText>
          )}
        </TouchableOpacity>
      )
    }

    if (status === BOOKING_STATUS.WORK_IN_PROGRESS) {
      return (
        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 items-center"
          onPress={() => handleStatusUpdate('completed', 'کام مکمل')}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <UrduText className="text-white text-xl font-bold" style={{ fontSize: 20 }}>
              کام مکمل
            </UrduText>
          )}
        </TouchableOpacity>
      )
    }

    if (status === BOOKING_STATUS.COMPLETED) {
      return (
        <TouchableOpacity
          className="bg-green-600 rounded-xl py-4 items-center"
          onPress={() => handleStatusUpdate('cash-collected', 'کیش وصول')}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <UrduText className="text-white text-xl font-bold" style={{ fontSize: 20 }}>
              کیش وصول
            </UrduText>
          )}
        </TouchableOpacity>
      )
    }

    // For accepted, reached, or other statuses, show a status message
    return (
      <View className="bg-gray-100 rounded-xl py-4 items-center">
        <UrduText className="text-gray-600 text-lg" style={{ fontSize: 18 }}>
          {statusToUrdu(status)}
        </UrduText>
      </View>
    )
  }
}

function isWithinCancellationWindow(acceptedAt: string): boolean {
  const acceptedTime = new Date(acceptedAt).getTime()
  const now = Date.now()
  return now - acceptedTime < CANCELLATION_WINDOW_MS
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