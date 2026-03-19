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
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useBookingFlow } from '@/context/booking-flow'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ADDRESS_LABEL } from '@safainow/constants'
import type { Database } from '@safainow/types'

type SavedAddress = Database['public']['Tables']['customer_addresses']['Row']

const LABELS = [
  { key: ADDRESS_LABEL.HOME, label: 'Home', icon: 'home-outline' },
  { key: ADDRESS_LABEL.WORK, label: 'Work', icon: 'briefcase-outline' },
  { key: ADDRESS_LABEL.PARENTS_HOUSE, label: "Parents'", icon: 'people-outline' },
  { key: ADDRESS_LABEL.OTHER, label: 'Other', icon: 'location-outline' },
] as const

const LABEL_ICON: Record<string, string> = {
  [ADDRESS_LABEL.HOME]: 'home',
  [ADDRESS_LABEL.WORK]: 'briefcase',
  [ADDRESS_LABEL.PARENTS_HOUSE]: 'people',
  [ADDRESS_LABEL.OTHER]: 'location',
}

export default function AddressScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const { addressText, addressLabel, setAddress } = useBookingFlow()

  const [text, setText] = useState(addressText)
  const [label, setLabel] = useState(addressLabel)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [saveAddress, setSaveAddress] = useState(false)
  const [customLabel, setCustomLabel] = useState('')

  // Fetch saved addresses
  useEffect(() => {
    if (!session?.user.id) return
    supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSavedAddresses(data)
      })
  }, [session?.user.id])

  const selectSavedAddress = (addr: SavedAddress) => {
    setSelectedSavedId(addr.id)
    setText(addr.address_text)
    setCoords({ lat: addr.lat, lng: addr.lng })
    setLabel(addr.label)
    setSaveAddress(false)
  }

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
      setSelectedSavedId(null)
    } catch {
      Alert.alert('Error', 'Could not get your location. Please try again.')
    } finally {
      setGpsLoading(false)
    }
  }

  const canProceed = text.trim().length >= 5

  const handleNext = () => {
    // Fire-and-forget save to address book
    if (saveAddress && !selectedSavedId && session?.user.id) {
      supabase.from('customer_addresses').insert({
        customer_id: session.user.id,
        address_text: text.trim(),
        lat: coords?.lat ?? 0,
        lng: coords?.lng ?? 0,
        label: (label ?? 'home') as 'home' | 'work' | 'parents_house' | 'other',
        custom_label: label === ADDRESS_LABEL.OTHER ? customLabel.trim() || null : null,
      })
    }

    setAddress({
      text: text.trim(),
      latitude: coords?.lat ?? 0,
      longitude: coords?.lng ?? 0,
      label,
    })
    router.push('/booking/schedule')
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Your Address',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />
      <ScrollView className="flex-1 bg-white px-5 pt-6" keyboardShouldPersistTaps="handled">
        {/* Saved addresses */}
        {savedAddresses.length > 0 && (
          <>
            <Text className="mb-2 text-sm font-semibold text-gray-700">Saved Addresses</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
              {savedAddresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  onPress={() => selectSavedAddress(addr)}
                  className={`mr-2 min-w-[140px] rounded-xl border px-3 py-2.5 ${
                    selectedSavedId === addr.id
                      ? 'border-gray-900 bg-gray-900'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons
                      name={(LABEL_ICON[addr.label] ?? 'location') as 'home'}
                      size={14}
                      color={selectedSavedId === addr.id ? '#ffffff' : '#374151'}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        selectedSavedId === addr.id ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {addr.custom_label || addr.label.charAt(0).toUpperCase() + addr.label.slice(1).replace('_', ' ')}
                    </Text>
                    {addr.is_default && (
                      <View className="rounded-full bg-green-500 px-1">
                        <Text className="text-[8px] font-bold text-white">Default</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className={`mt-1 text-[11px] ${
                      selectedSavedId === addr.id ? 'text-gray-300' : 'text-gray-500'
                    }`}
                    numberOfLines={1}
                  >
                    {addr.address_text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Address text input */}
        <Text className="mb-2 text-sm font-semibold text-gray-700">Full Address</Text>
        <TextInput
          value={text}
          onChangeText={(val) => {
            setText(val)
            setSelectedSavedId(null)
          }}
          placeholder="House no, street, area, Karachi"
          placeholderTextColor="#9ca3af"
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* GPS button */}
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
        <Text className="mb-2 mt-6 text-sm font-semibold text-gray-700">Save As (optional)</Text>
        <View className="flex-row gap-2">
          {LABELS.map((l) => (
            <TouchableOpacity
              key={l.key}
              onPress={() => {
                const next = label === l.key ? null : l.key
                setLabel(next)
                if (next !== ADDRESS_LABEL.OTHER) setCustomLabel('')
              }}
              className={`flex-1 items-center rounded-xl border py-3 ${
                label === l.key ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <Ionicons
                name={l.icon as 'home-outline' | 'briefcase-outline' | 'people-outline' | 'location-outline'}
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

        {/* Save this address toggle */}
        {!selectedSavedId && (
          <TouchableOpacity
            onPress={() => setSaveAddress((prev) => !prev)}
            className="mt-5 flex-row items-center gap-2"
          >
            <Ionicons
              name={saveAddress ? 'checkbox' : 'square-outline'}
              size={22}
              color={saveAddress ? '#111827' : '#9ca3af'}
            />
            <Text className="text-sm font-medium text-gray-700">Save this address</Text>
          </TouchableOpacity>
        )}

        {/* Spacer for sticky footer */}
        <View className="h-32" />
      </ScrollView>

      {/* Sticky footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${canProceed ? 'bg-gray-900' : 'bg-gray-200'}`}
          disabled={!canProceed}
          onPress={handleNext}
        >
          <Text
            className={`text-base font-semibold ${canProceed ? 'text-white' : 'text-gray-400'}`}
          >
            Next: Schedule
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
