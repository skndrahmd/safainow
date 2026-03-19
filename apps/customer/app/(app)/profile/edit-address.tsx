import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { ADDRESS_LABEL } from '@safainow/constants'

const LABELS = [
  { key: ADDRESS_LABEL.HOME, label: 'Home', icon: 'home-outline' },
  { key: ADDRESS_LABEL.WORK, label: 'Work', icon: 'briefcase-outline' },
  { key: ADDRESS_LABEL.PARENTS_HOUSE, label: "Parents'", icon: 'people-outline' },
  { key: ADDRESS_LABEL.OTHER, label: 'Other', icon: 'location-outline' },
] as const

export default function EditAddressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [text, setText] = useState('')
  const [label, setLabel] = useState<string>(ADDRESS_LABEL.HOME)
  const [customLabel, setCustomLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('customer_addresses')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          Alert.alert('Error', 'Address not found.')
          router.back()
          return
        }
        setText(data.address_text)
        setLabel(data.label)
        setCustomLabel(data.custom_label ?? '')
        setLoading(false)
      })
  }, [id])

  const canSave = text.trim().length >= 5

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    const { error } = await supabase
      .from('customer_addresses')
      .update({
        address_text: text.trim(),
        label: label as 'home' | 'work' | 'parents_house' | 'other',
        custom_label: label === ADDRESS_LABEL.OTHER ? customLabel.trim() || null : null,
      })
      .eq('id', id)
    setSaving(false)
    if (error) {
      Alert.alert('Error', 'Could not update address.')
    } else {
      router.back()
    }
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
        <Text className="text-lg font-bold text-gray-900">Edit Address</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
        <Text className="mb-2 text-sm font-semibold text-gray-700">Full Address</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="House no, street, area, Karachi"
          placeholderTextColor="#9ca3af"
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text className="mb-2 mt-6 text-sm font-semibold text-gray-700">Label</Text>
        <View className="flex-row gap-2">
          {LABELS.map((l) => (
            <TouchableOpacity
              key={l.key}
              onPress={() => {
                setLabel(l.key)
                if (l.key !== ADDRESS_LABEL.OTHER) setCustomLabel('')
              }}
              className={`flex-1 items-center rounded-xl border py-3 ${
                label === l.key ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <Ionicons
                name={l.icon as 'home-outline'}
                size={18}
                color={label === l.key ? '#ffffff' : '#6b7280'}
              />
              <Text
                className={`mt-1 text-xs font-medium ${
                  label === l.key ? 'text-white' : 'text-gray-500'
                }`}
              >
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom label input */}
        {label === ADDRESS_LABEL.OTHER && (
          <TextInput
            value={customLabel}
            onChangeText={setCustomLabel}
            placeholder="e.g. Gym, Office, etc."
            placeholderTextColor="#9ca3af"
            className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
          />
        )}

        <View className="h-32" />
      </ScrollView>

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
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
