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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useBookingFlow } from '@/context/booking-flow'
import PackageCard from '@/components/PackageCard'
import type { Tables } from '@safainow/types'

type Package = Tables<'packages'>

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const { addPackage, removePackage, selectedPackages, totalPrice } = useBookingFlow()
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
      .order('sort_order', { ascending: true })

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
      <View
        className="flex-1 items-center justify-center bg-white px-6"
        style={{ paddingTop: insets.top }}
      >
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
    <View className="flex-1 bg-white">
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
            inCart={selectedPackages.some((p) => p.id === item.id)}
            onViewDetail={() => handleViewDetail(item)}
            onQuickAdd={() => handleQuickAdd(item)}
            onRemove={() => removePackage(item.id)}
          />
        )}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: cartCount > 0 ? 96 : 40,
          paddingHorizontal: 20,
        }}
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Hello, {firstName} 👋</Text>
            <Text className="mt-1 text-base text-gray-500">
              What would you like cleaned today?
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center pt-16">
            <Text className="text-base text-gray-400">No packages available right now.</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {cartCount > 0 && (
        <TouchableOpacity
          onPress={() => router.push('/booking/address')}
          activeOpacity={0.85}
          className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between bg-gray-900 px-5 py-3.5"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="cart-outline" size={20} color="#ffffff" />
            <Text className="text-sm font-semibold text-white">
              {cartCount} {cartCount === 1 ? 'package' : 'packages'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-bold text-white">
              Rs {totalPrice.toLocaleString()}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
}
