import { useCallback, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import AddressRow from '@/components/AddressRow'
import type { Database } from '@safainow/types'

type AddressRecord = Database['public']['Tables']['customer_addresses']['Row']

export default function AddressesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const [addresses, setAddresses] = useState<AddressRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchAddresses = useCallback(async () => {
    if (!session?.user.id) return
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) console.error('Failed to fetch addresses:', error)
    else setAddresses(data ?? [])
  }, [session?.user.id])

  useFocusEffect(
    useCallback(() => {
      fetchAddresses().finally(() => setLoading(false))
    }, [fetchAddresses])
  )

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('customer_addresses').delete().eq('id', id)
          if (error) Alert.alert('Error', 'Could not delete address.')
          else setAddresses((prev) => prev.filter((a) => a.id !== id))
        },
      },
    ])
  }

  const handleSetDefault = async (id: string) => {
    if (!session?.user.id || togglingId) return
    setTogglingId(id)
    // Clear existing default
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', session.user.id)
      .eq('is_default', true)
    // Set new default
    const { error } = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', id)
    if (error) Alert.alert('Error', 'Could not set default address.')
    else await fetchAddresses()
    setTogglingId(null)
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
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-5 pb-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-gray-900">Address Book</Text>
        <TouchableOpacity onPress={() => router.push('/profile/add-address')} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={26} color="#111827" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Ionicons name="location-outline" size={48} color="#d1d5db" />
            <Text className="mt-3 text-base text-gray-400">No saved addresses</Text>
            <Text className="mt-1 text-sm text-gray-300">
              Tap + to add your first address
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <AddressRow
            id={item.id}
            addressText={item.address_text}
            label={item.label}
            customLabel={item.custom_label}
            isDefault={item.is_default}
            defaultLoading={togglingId === item.id}
            onSetDefault={() => handleSetDefault(item.id)}
            onEdit={() =>
              router.push({ pathname: '/profile/edit-address', params: { id: item.id } })
            }
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />
    </View>
  )
}
