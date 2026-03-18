import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useBookingFlow } from '@/context/booking-flow'
import type { Tables } from '@safainow/types'

type Service = Tables<'services'>

type PackageWithServices = Tables<'packages'> & {
  package_services: Array<{ services: Service }>
}

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { addPackage } = useBookingFlow()
  const [pkg, setPkg] = useState<PackageWithServices | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPackage() {
      const { data, error } = await supabase
        .from('packages')
        .select('*, package_services(services(*))')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setError('Package not found.')
      } else {
        setPkg(data as PackageWithServices)
      }
      setLoading(false)
    }
    fetchPackage()
  }, [id])

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '' }} />
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </>
    )
  }

  if (error || !pkg) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Package' }} />
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="mb-4 text-center text-base text-gray-500">
            {error ?? 'Something went wrong.'}
          </Text>
          <TouchableOpacity
            className="rounded-xl bg-gray-900 px-6 py-3"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-semibold text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    )
  }

  const services = pkg.package_services.map((ps) => ps.services)

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: pkg.name_en,
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />

      {/* Scrollable content */}
      <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pt-6 pb-40">
        {/* Type badge */}
        <View className="mb-4 self-start rounded-full bg-gray-900 px-3 py-1">
          <Text className="text-xs font-semibold capitalize text-white">{pkg.type}</Text>
        </View>

        {/* Name */}
        <Text className="mb-2 text-2xl font-bold text-gray-900">{pkg.name_en}</Text>

        {/* Description */}
        {pkg.description_en ? (
          <Text className="mb-6 text-base leading-6 text-gray-500">{pkg.description_en}</Text>
        ) : null}

        {/* Services included */}
        <Text className="mb-3 text-base font-semibold text-gray-900">Services Included</Text>
        <View className="rounded-2xl border border-gray-100 bg-gray-50">
          {services.map((service, index) => (
            <View
              key={service.id}
              className={`flex-row items-center px-4 py-4 ${
                index < services.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <Ionicons name="checkmark-circle" size={18} color="#111827" />
              <Text className="ml-3 text-base text-gray-900">{service.name_en}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky footer CTA */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">Total price</Text>
          <Text className="text-xl font-bold text-gray-900">Rs {pkg.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          className="items-center rounded-2xl bg-gray-900 py-4"
          onPress={() => {
            addPackage({ id: pkg.id, name: pkg.name_en, price: pkg.price, type: pkg.type })
            router.push('/booking/address')
          }}
        >
          <Text className="text-base font-semibold text-white">Book This Package</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
