import { useState } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useBookingFlow } from '@/context/booking-flow'

export default function ScheduleScreen() {
  const router = useRouter()
  const { bookingType, scheduledAt, setBookingType, setScheduledAt } = useBookingFlow()

  const [androidPickerMode, setAndroidPickerMode] = useState<'date' | 'time' | null>(null)
  const [pickedDate, setPickedDate] = useState<Date>(
    scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 60 * 60 * 1000),
  )

  const handleTypeSelect = (type: 'instant' | 'scheduled') => {
    setBookingType(type)
    if (type === 'instant') setScheduledAt(null)
  }

  const handleDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      if (androidPickerMode === 'date' && date) {
        // Date selected — now show time picker
        setPickedDate(date)
        setAndroidPickerMode('time')
        return
      }
      // Time selected (or dismissed) — finalize
      setAndroidPickerMode(null)
    }
    if (date) {
      setPickedDate(date)
      setScheduledAt(date.toISOString())
    }
  }

  const canProceed =
    bookingType === 'instant' || (bookingType === 'scheduled' && scheduledAt !== null)

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'When?',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />
      <View className="flex-1 bg-white px-5 pt-6">
        {/* Option: Instant */}
        <TouchableOpacity
          onPress={() => handleTypeSelect('instant')}
          className={`mb-3 rounded-2xl border p-5 ${
            bookingType === 'instant' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white'
          }`}
        >
          <Text className="text-base font-semibold text-gray-900">Book Now</Text>
          <Text className="mt-1 text-sm text-gray-500">
            We'll find a partner as soon as you confirm.
          </Text>
        </TouchableOpacity>

        {/* Option: Scheduled */}
        <TouchableOpacity
          onPress={() => handleTypeSelect('scheduled')}
          className={`rounded-2xl border p-5 ${
            bookingType === 'scheduled' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white'
          }`}
        >
          <Text className="text-base font-semibold text-gray-900">Schedule for Later</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Pick a date and time for your cleaning.
          </Text>
        </TouchableOpacity>

        {/* Date-time picker when scheduled */}
        {bookingType === 'scheduled' && (
          <View className="mt-6">
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={pickedDate}
                mode="datetime"
                display="spinner"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setAndroidPickerMode('date')}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <Text className="text-base text-gray-900">
                    {scheduledAt
                      ? new Date(scheduledAt).toLocaleString()
                      : 'Tap to pick date & time'}
                  </Text>
                </TouchableOpacity>
                {androidPickerMode !== null && (
                  <DateTimePicker
                    value={pickedDate}
                    mode={androidPickerMode}
                    display="default"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                  />
                )}
              </>
            )}
          </View>
        )}
      </View>

      {/* Sticky footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${canProceed ? 'bg-gray-900' : 'bg-gray-200'}`}
          disabled={!canProceed}
          onPress={() => router.push('/booking/summary')}
        >
          <Text
            className={`text-base font-semibold ${canProceed ? 'text-white' : 'text-gray-400'}`}
          >
            Review Order
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
