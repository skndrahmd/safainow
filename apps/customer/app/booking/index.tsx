import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useBookingFlow } from '@/context/booking-flow'
import { PACKAGE_TYPE } from '@safainow/constants'
import type { Tables } from '@safainow/types'

type Package = Tables<'packages'>

export default function PackageSelectionScreen() {
  const router = useRouter()
  const { selectedPackages, setSelectedPackages, setCustomServices } = useBookingFlow()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPackages = useCallback(async () => {
    const { data } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    setPackages(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const isSelected = (id: string) => selectedPackages.some((p) => p.id === id)

  const toggle = (pkg: Package) => {
    const currentIds = selectedPackages.map((p) => p.id)

    if (currentIds.includes(pkg.id)) {
      // Deselect
      setSelectedPackages(selectedPackages.filter((p) => p.id !== pkg.id))
      if (pkg.type === 'custom') setCustomServices([])
      return
    }

    if (pkg.type === PACKAGE_TYPE.CUSTOM) {
      // Custom clears everything else
      setSelectedPackages([{ id: pkg.id, name: pkg.name_en, price: pkg.price, type: 'custom' }])
      setCustomServices([])
      return
    }

    if (pkg.type === PACKAGE_TYPE.CLEANING) {
      // Replace any existing cleaning package; keep standalone
      const next = selectedPackages
        .filter((p) => p.type !== 'cleaning' && p.type !== 'custom')
        .concat({ id: pkg.id, name: pkg.name_en, price: pkg.price, type: 'cleaning' })
      setSelectedPackages(next)
      return
    }

    if (pkg.type === PACKAGE_TYPE.STANDALONE) {
      // Remove any custom; allow standalone alongside cleaning
      const withoutCustom = selectedPackages.filter((p) => p.type !== 'custom')
      setSelectedPackages([
        ...withoutCustom,
        { id: pkg.id, name: pkg.name_en, price: pkg.price, type: 'standalone' },
      ])
      return
    }
  }

  const canProceed = selectedPackages.length > 0

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ headerShown: true, title: 'Your Cart' }} />
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Your Cart',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />
      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pt-4 pb-40 bg-white"
        className="bg-white"
        ListHeaderComponent={
          <Text className="mb-4 text-sm text-gray-500">
            Review your selection. Tap a package to add or remove it.
          </Text>
        }
        renderItem={({ item }) => {
          const selected = isSelected(item.id)
          return (
            <TouchableOpacity
              onPress={() => toggle(item)}
              activeOpacity={0.7}
              className={`mb-3 rounded-2xl border p-4 ${
                selected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-semibold text-gray-900">{item.name_en}</Text>
                  <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={2}>
                    {item.description_en}
                  </Text>
                  <Text className="mt-2 text-sm font-semibold text-gray-900">
                    Rs {item.price.toLocaleString()}
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'
                  }`}
                >
                  {selected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* Sticky footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${canProceed ? 'bg-gray-900' : 'bg-gray-200'}`}
          disabled={!canProceed}
          onPress={() => router.push('/booking/address')}
        >
          <Text
            className={`text-base font-semibold ${canProceed ? 'text-white' : 'text-gray-400'}`}
          >
            Proceed to Address
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
