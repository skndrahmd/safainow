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
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useBookingFlow } from '@/context/booking-flow'
import { ADDRESS_LABEL } from '@safainow/constants'

const LABELS = [
  { key: ADDRESS_LABEL.HOME, label: 'Home', icon: 'home-outline' },
  { key: ADDRESS_LABEL.WORK, label: 'Work', icon: 'briefcase-outline' },
  { key: ADDRESS_LABEL.PARENTS_HOUSE, label: "Parents'", icon: 'people-outline' },
  { key: ADDRESS_LABEL.OTHER, label: 'Other', icon: 'location-outline' },
] as const

export default function AddressScreen() {
  const router = useRouter()
  const { addressText, addressLabel, setAddress } = useBookingFlow()

  const [text, setText] = useState(addressText)
  const [label, setLabel] = useState(addressLabel)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

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

  const canProceed = text.trim().length >= 5

  const handleNext = () => {
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
        {/* Address text input */}
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
              onPress={() => setLabel(label === l.key ? null : l.key)}
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
