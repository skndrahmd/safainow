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
import { supabase } from '@/lib/supabase'

export default function ChangePasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const tooShort = password.length > 0 && password.length < 6
  const mismatch = confirm.length > 0 && password !== confirm
  const canSave = password.length >= 6 && password === confirm

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Your password has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-5 pb-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Change Password</Text>
      </View>

      <View className="flex-1 px-5 pt-4">
        {/* New Password */}
        <Text className="mb-2 text-sm font-semibold text-gray-700">New Password</Text>
        <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-4">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Min 6 characters"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            className="flex-1 py-3 text-base text-gray-900"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        {tooShort && (
          <Text className="mt-1 text-xs text-red-500">Password must be at least 6 characters</Text>
        )}

        {/* Confirm Password */}
        <Text className="mb-2 mt-5 text-sm font-semibold text-gray-700">Confirm Password</Text>
        <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-4">
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showConfirm}
            className="flex-1 py-3 text-base text-gray-900"
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={8}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        {mismatch && (
          <Text className="mt-1 text-xs text-red-500">Passwords do not match</Text>
        )}
      </View>

      {/* Save footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${canSave ? 'bg-gray-900' : 'bg-gray-200'}`}
          disabled={!canSave || saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text
              className={`text-base font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}
            >
              Update Password
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
