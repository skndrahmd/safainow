import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import BookingCard from '@/components/BookingCard'
import type { Database } from '@safainow/types'

type BookingRow = Database['public']['Tables']['bookings']['Row']
type BookingPackageRow = Database['public']['Tables']['booking_packages']['Row']

type BookingWithPackages = BookingRow & {
  booking_packages: BookingPackageRow[]
}

export default function BookingsListScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const [bookings, setBookings] = useState<BookingWithPackages[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchBookings = useCallback(async () => {
    if (!session?.user.id) return

    const { data, error } = await supabase
      .from('bookings')
      .select('*, booking_packages(*)')
      .eq('customer_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch bookings:', error)
    } else {
      setBookings((data as BookingWithPackages[]) ?? [])
    }
  }, [session?.user.id])

  useEffect(() => {
    fetchBookings().finally(() => setLoading(false))
  }, [fetchBookings])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBookings()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 40,
          paddingHorizontal: 20,
        }}
        ListHeaderComponent={
          <Text className="mb-4 text-2xl font-bold text-gray-900">My Bookings</Text>
        }
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-base text-gray-400">No bookings yet</Text>
            <Text className="mt-1 text-sm text-gray-300">
              Your booking history will appear here
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BookingCard
            id={item.id}
            status={item.status}
            totalPrice={item.total_price}
            createdAt={item.created_at}
            packages={item.booking_packages}
            onPress={() => router.push(`/bookings/${item.id}`)}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  )
}
