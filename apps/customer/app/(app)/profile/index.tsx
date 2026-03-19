import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@safainow/types'

type CustomerRow = Database['public']['Tables']['customers']['Row']

const MENU_ITEMS: readonly { label: string; icon: string; route: string; danger?: boolean }[] = [
  { label: 'Edit Profile', icon: 'create-outline', route: '/profile/edit' },
  { label: 'Address Book', icon: 'location-outline', route: '/profile/addresses' },
  { label: 'Change Password', icon: 'lock-closed-outline', route: '/profile/change-password' },
  { label: 'Delete Account', icon: 'trash-outline', route: '/profile/delete-account', danger: true },
]

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const [customer, setCustomer] = useState<CustomerRow | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!session?.user.id) return
      supabase
        .from('customers')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setCustomer(data)
        })
    }, [session?.user.id])
  )

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <Text className="px-5 text-2xl font-bold text-gray-900">Profile</Text>

      {/* Avatar + info */}
      <TouchableOpacity
        onPress={() => router.push('/profile/edit')}
        className="mt-6 items-center"
      >
        {customer?.profile_picture_url ? (
          <Image
            source={{ uri: customer.profile_picture_url }}
            className="h-20 w-20 rounded-full"
          />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="person" size={36} color="#9ca3af" />
          </View>
        )}
        <Text className="mt-3 text-lg font-semibold text-gray-900">
          {customer?.full_name ?? 'Loading...'}
        </Text>
        <Text className="mt-0.5 text-sm text-gray-500">
          {session?.user.email ?? ''}
        </Text>
        {customer?.phone && (
          <Text className="mt-0.5 text-sm text-gray-500">{customer.phone}</Text>
        )}
      </TouchableOpacity>

      {/* Menu */}
      <View className="mt-8 px-5">
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as '/profile/edit')}
            className="flex-row items-center justify-between border-b border-gray-100 py-4"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons
                name={item.icon as 'create-outline'}
                size={22}
                color={item.danger ? '#ef4444' : '#111827'}
              />
              <Text
                className={`text-base ${item.danger ? 'text-red-500' : 'text-gray-900'}`}
              >
                {item.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <View className="mt-auto px-5 pb-10">
        <TouchableOpacity
          className="items-center rounded-2xl bg-gray-900 py-4"
          onPress={() => supabase.auth.signOut()}
        >
          <Text className="text-base font-semibold text-white">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
