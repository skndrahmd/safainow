import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export default function DeleteAccountScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()

  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  const canDelete = confirmation === 'DELETE'

  const handleDelete = async () => {
    if (!canDelete || !session?.access_token) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_URL}/customers/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Could not delete account.')
      }
      await supabase.auth.signOut()
    } catch (err: any) {
      setDeleting(false)
      Alert.alert('Error', err.message ?? 'Could not delete account.')
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-5 pb-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Delete Account</Text>
      </View>

      <View className="flex-1 px-5 pt-6">
        <View className="rounded-2xl bg-red-50 p-4">
          <Text className="text-base font-semibold text-red-600">Warning</Text>
          <Text className="mt-2 text-sm leading-5 text-red-600">
            This action is permanent and cannot be undone. All your data including
            bookings, addresses, and profile information will be permanently deleted.
          </Text>
        </View>

        <Text className="mb-2 mt-8 text-sm font-semibold text-gray-700">
          Type DELETE to confirm
        </Text>
        <TextInput
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder="DELETE"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
        />
      </View>

      {/* Delete footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${canDelete ? 'bg-red-600' : 'bg-gray-200'}`}
          disabled={!canDelete || deleting}
          onPress={handleDelete}
        >
          {deleting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text
              className={`text-base font-semibold ${canDelete ? 'text-white' : 'text-gray-400'}`}
            >
              Delete My Account
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
