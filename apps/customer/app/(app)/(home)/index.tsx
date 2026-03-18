import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import PackageCard from '@/components/PackageCard'
import type { Tables } from '@safainow/types'

type Package = Tables<'packages'>

export default function HomeScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstName = session?.user.user_metadata?.full_name?.split(' ')[0] ?? 'there'

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

  // Tapping the card body or + button → booking flow (Coming Soon until Sprint 2D)
  const handlePackagePress = (_pkg: Package) => {
    Alert.alert('Coming Soon', 'Booking flow will be available in the next update.')
  }

  // Tapping the eye icon → detail page
  const handleViewDetail = (pkg: Package) => {
    if (pkg.type === 'custom') {
      router.push('/(app)/(home)/custom')
    } else {
      router.push(`/(app)/(home)/package/${pkg.id}`)
    }
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
          onPress={() => handlePackagePress(item)}
          onViewDetail={() => handleViewDetail(item)}
          onQuickAdd={() => handlePackagePress(item)}
        />
      )}
      contentContainerClassName="px-5 pt-6 pb-10"
      ListHeaderComponent={
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">Hello, {firstName} 👋</Text>
          <Text className="mt-1 text-base text-gray-500">What would you like cleaned today?</Text>
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
