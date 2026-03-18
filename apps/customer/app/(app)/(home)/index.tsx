import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useBookingFlow } from '@/context/booking-flow'
import PackageCard from '@/components/PackageCard'
import type { Tables } from '@safainow/types'

type Package = Tables<'packages'>

export default function HomeScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const { addPackage, selectedPackages } = useBookingFlow()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstName = session?.user.user_metadata?.full_name?.split(' ')[0] ?? 'there'
  const hasCustom = selectedPackages.some((p) => p.type === 'custom')
  const cartCount = hasCustom ? 0 : selectedPackages.length

  const fetchPackages = useCallback(async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      setError('Could not load packages. Please try again.')
    } else {
      setPackages(data ?? [])
      setError(null)
    }
  }, [])

  useEffect(() => {
    fetchPackages().finally(() => setLoading(false))
  }, [fetchPackages])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPackages()
    setRefreshing(false)
  }, [fetchPackages])

  // Eye/chevron icon → open detail page or custom builder
  const handleViewDetail = (pkg: Package) => {
    if (pkg.type === 'custom') {
      router.push('/(app)/(home)/custom')
    } else {
      router.push(`/(app)/(home)/package/${pkg.id}`)
    }
  }

  // + button → add to cart, stay on home
  const handleQuickAdd = (pkg: Package) => {
    addPackage({ id: pkg.id, name: pkg.name_en, price: pkg.price, type: pkg.type })
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-4 text-center text-base text-gray-500">{error}</Text>
        <TouchableOpacity
          className="rounded-xl bg-gray-900 px-6 py-3"
          onPress={() => {
            setLoading(true)
            fetchPackages().finally(() => setLoading(false))
          }}
        >
          <Text className="text-sm font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <FlatList
      data={packages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PackageCard
          id={item.id}
          name={item.name_en}
          description={item.description_en}
          price={item.price}
          type={item.type}
          onViewDetail={() => handleViewDetail(item)}
          onQuickAdd={() => handleQuickAdd(item)}
        />
      )}
      contentContainerClassName="px-5 pt-6 pb-10"
      ListHeaderComponent={
        <View className="mb-6 flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">Hello, {firstName} 👋</Text>
            <Text className="mt-1 text-base text-gray-500">
              What would you like cleaned today?
            </Text>
          </View>

          {/* Cart badge — visible when items in cart */}
          {cartCount > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/booking')}
              className="relative ml-3 mt-1 h-10 w-10 items-center justify-center rounded-full bg-gray-900"
            >
              <Ionicons name="cart-outline" size={20} color="#ffffff" />
              <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-red-500">
                <Text className="text-[10px] font-bold text-white">{cartCount}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      }
      ListEmptyComponent={
        <View className="items-center pt-16">
          <Text className="text-base text-gray-400">No packages available right now.</Text>
        </View>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  )
}
