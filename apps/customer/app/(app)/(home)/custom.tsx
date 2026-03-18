import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Stack } from 'expo-router'
import { supabase } from '@/lib/supabase'
import ServiceItem from '@/components/ServiceItem'
import type { Tables } from '@safainow/types'

type Service = Tables<'services'>

export default function CustomPackageScreen() {
  const [services, setServices] = useState<Service[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name_en', { ascending: true })

    if (error) {
      setError('Could not load services. Please try again.')
    } else {
      setServices(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const toggleService = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const total = services
    .filter((s) => selected.has(s.id))
    .reduce((sum, s) => sum + s.price, 0)

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Custom Package' }} />
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Custom Package' }} />
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="mb-4 text-center text-base text-gray-500">{error}</Text>
          <TouchableOpacity
            className="rounded-xl bg-gray-900 px-6 py-3"
            onPress={() => {
              setLoading(true)
              fetchServices()
            }}
          >
            <Text className="text-sm font-semibold text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Custom Package',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View className={index < services.length - 1 ? 'border-b border-gray-100' : ''}>
            <ServiceItem
              name={item.name_en}
              price={item.price}
              selected={selected.has(item.id)}
              onToggle={() => toggleService(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View className="px-5 pb-2 pt-6">
            <Text className="text-base text-gray-500">
              Select the services you need. Price updates as you pick.
            </Text>
          </View>
        }
        contentContainerClassName="pb-40 bg-white"
        className="bg-white"
      />

      {/* Sticky footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">
            {selected.size} service{selected.size !== 1 ? 's' : ''} selected
          </Text>
          <Text className="text-xl font-bold text-gray-900">Rs {total.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${
            selected.size === 0 ? 'bg-gray-200' : 'bg-gray-900'
          }`}
          disabled={selected.size === 0}
          onPress={() =>
            Alert.alert('Coming Soon', 'Booking flow will be available in the next update.')
          }
        >
          <Text
            className={`text-base font-semibold ${
              selected.size === 0 ? 'text-gray-400' : 'text-white'
            }`}
          >
            Book Custom Package
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
