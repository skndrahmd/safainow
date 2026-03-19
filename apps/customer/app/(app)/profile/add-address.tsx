import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ADDRESS_LABEL } from '@safainow/constants'

const LABELS = [
  { key: ADDRESS_LABEL.HOME, label: 'Home', icon: 'home-outline' },
  { key: ADDRESS_LABEL.WORK, label: 'Work', icon: 'briefcase-outline' },
  { key: ADDRESS_LABEL.PARENTS_HOUSE, label: "Parents'", icon: 'people-outline' },
  { key: ADDRESS_LABEL.OTHER, label: 'Other', icon: 'location-outline' },
] as const

export default function AddAddressScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()

  const [text, setText] = useState('')
  const [label, setLabel] = useState<string>(ADDRESS_LABEL.HOME)
  const [customLabel, setCustomLabel] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const getGPS = async () => {
    setGpsLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to auto-fill coordinates.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude })
    } catch {
      Alert.alert('Error', 'Could not get your location. Please try again.')
    } finally {
      setGpsLoading(false)
    }
  }

  const canSave = text.trim().length >= 5 || coords !== null

  const handleSave = async () => {
    if (!session?.user.id) return
    setSaving(true)
    const addressText =
      text.trim().length >= 5
        ? text.trim()
        : `GPS Location (${coords!.lat.toFixed(4)}, ${coords!.lng.toFixed(4)})`
    const { error } = await supabase.from('customer_addresses').insert({
      customer_id: session.user.id,
      address_text: addressText,
      lat: coords?.lat ?? 0,
      lng: coords?.lng ?? 0,
      label: label as 'home' | 'work' | 'parents_house' | 'other',
      custom_label: label === ADDRESS_LABEL.OTHER ? customLabel.trim() || null : null,
    })
    setSaving(false)
    if (error) {
      Alert.alert('Error', 'Could not save address. Please try again.')
    } else {
      router.back()
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-5 pb-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Add Address</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
        {/* Address text */}
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

        {/* GPS */}
        <TouchableOpacity
          onPress={getGPS}
          disabled={gpsLoading}
          className="mt-3 flex-row items-center gap-2"
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <Ionicons name="locate" size={18} color="#111827" />
          )}
          <Text className="text-sm font-medium text-gray-900">
            {coords
              ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
              : 'Use current location (GPS)'}
          </Text>
        </TouchableOpacity>

        {/* Label picker */}
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
              Save Address
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
