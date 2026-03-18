# Sprint 2D-Frontend: Booking Flow (4-Step Modal) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 4-step booking modal that collects package selection, address, schedule type, and shows an order summary before submitting to the API.

**Architecture:** Shared `BookingFlowContext` holds all state across 4 screens inside a modal Stack (`apps/customer/app/booking/`). Each screen is a focused step. Combination rules are enforced at the selection step. The final step calls `POST /bookings` via a Supabase Edge Function (or Fastify API — whichever is available; Sprint 2D-api wires this up).

**Tech Stack:** Expo Router v4, NativeWind v4, `@safainow/validators` (BookingCreateSchema), `@safainow/constants` (PACKAGE_TYPE), Supabase JS client, expo-location (GPS), React Context.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/customer/context/booking-flow.tsx` | Create | Shared state + actions across all 4 steps |
| `apps/customer/app/booking/_layout.tsx` | Create | Modal Stack wrapper + injects BookingFlowProvider |
| `apps/customer/app/booking/index.tsx` | Create | Step 1 — Package selection with combination rules |
| `apps/customer/app/booking/address.tsx` | Create | Step 2 — Address: manual text or GPS |
| `apps/customer/app/booking/schedule.tsx` | Create | Step 3 — Instant / Scheduled (date-time picker) |
| `apps/customer/app/booking/summary.tsx` | Create | Step 4 — Order review + "Book Now" → POST /bookings |

**Entry points (no changes needed):**
- `apps/customer/app/_layout.tsx` — already registers `booking` as a modal Stack.Screen
- `apps/customer/app/(app)/(home)/index.tsx` — already has `handlePackagePress` that will navigate to `/(app)/../../../booking` (we'll wire the + button and card press)

---

## Task 1: BookingFlowContext

**Files:**
- Create: `apps/customer/context/booking-flow.tsx`

- [ ] **Step 1: Create the context file**

```tsx
// apps/customer/context/booking-flow.tsx
import { createContext, useContext, useState, ReactNode } from 'react'
import type { BookingCreateInput } from '@safainow/validators'

type PackageSnapshot = {
  id: string
  name: string
  price: number
  type: 'cleaning' | 'standalone' | 'custom'
}

type ServiceSnapshot = {
  id: string
  name: string
  price: number
}

type BookingFlowState = {
  // Step 1
  selectedPackages: PackageSnapshot[]
  customServices: ServiceSnapshot[]
  // Step 2
  addressText: string
  addressLatitude: number | null
  addressLongitude: number | null
  addressLabel: BookingCreateInput['address_label']
  // Step 3
  bookingType: 'instant' | 'scheduled'
  scheduledAt: string | null
}

type BookingFlowContextValue = BookingFlowState & {
  setSelectedPackages: (pkgs: PackageSnapshot[]) => void
  setCustomServices: (services: ServiceSnapshot[]) => void
  setAddress: (params: {
    text: string
    latitude: number
    longitude: number
    label: BookingCreateInput['address_label']
  }) => void
  setBookingType: (type: 'instant' | 'scheduled') => void
  setScheduledAt: (iso: string | null) => void
  reset: () => void
  totalPrice: number
}

const INITIAL: BookingFlowState = {
  selectedPackages: [],
  customServices: [],
  addressText: '',
  addressLatitude: null,
  addressLongitude: null,
  addressLabel: null,
  bookingType: 'instant',
  scheduledAt: null,
}

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null)

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingFlowState>(INITIAL)

  const totalPrice =
    state.selectedPackages.reduce((sum, p) => sum + p.price, 0) +
    state.customServices.reduce((sum, s) => sum + s.price, 0)

  const setSelectedPackages = (pkgs: PackageSnapshot[]) =>
    setState((prev) => ({ ...prev, selectedPackages: pkgs }))

  const setCustomServices = (services: ServiceSnapshot[]) =>
    setState((prev) => ({ ...prev, customServices: services }))

  const setAddress = ({
    text,
    latitude,
    longitude,
    label,
  }: {
    text: string
    latitude: number
    longitude: number
    label: BookingCreateInput['address_label']
  }) =>
    setState((prev) => ({
      ...prev,
      addressText: text,
      addressLatitude: latitude,
      addressLongitude: longitude,
      addressLabel: label,
    }))

  const setBookingType = (type: 'instant' | 'scheduled') =>
    setState((prev) => ({ ...prev, bookingType: type }))

  const setScheduledAt = (iso: string | null) =>
    setState((prev) => ({ ...prev, scheduledAt: iso }))

  const reset = () => setState(INITIAL)

  return (
    <BookingFlowContext.Provider
      value={{
        ...state,
        totalPrice,
        setSelectedPackages,
        setCustomServices,
        setAddress,
        setBookingType,
        setScheduledAt,
        reset,
      }}
    >
      {children}
    </BookingFlowContext.Provider>
  )
}

export function useBookingFlow() {
  const ctx = useContext(BookingFlowContext)
  if (!ctx) throw new Error('useBookingFlow must be used inside BookingFlowProvider')
  return ctx
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```

Expected: 0 errors (file is pure TS, no routes referenced yet)

---

## Task 2: Booking Modal Layout

**Files:**
- Create: `apps/customer/app/booking/_layout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
// apps/customer/app/booking/_layout.tsx
import { Stack } from 'expo-router'
import { BookingFlowProvider } from '@/context/booking-flow'

export default function BookingLayout() {
  return (
    <BookingFlowProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BookingFlowProvider>
  )
}
```

Note: `headerShown: false` because each step screen renders its own `<Stack.Screen>` with a custom header.

- [ ] **Step 2: Type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```

---

## Task 3: Step 1 — Package Selection

**Files:**
- Create: `apps/customer/app/booking/index.tsx`

Business rules enforced here:
- Only one `cleaning` package allowed
- One `standalone` can be added alongside a cleaning package
- `custom` is fully standalone — selecting it clears everything else
- At least one package must be selected to proceed

- [ ] **Step 1: Create the screen**

```tsx
// apps/customer/app/booking/index.tsx
import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useBookingFlow } from '@/context/booking-flow'
import { PACKAGE_TYPE } from '@safainow/constants'
import type { Tables } from '@safainow/types'

type Package = Tables<'packages'>

export default function PackageSelectionScreen() {
  const router = useRouter()
  const { selectedPackages, setSelectedPackages, setCustomServices } = useBookingFlow()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPackages = useCallback(async () => {
    const { data } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    setPackages(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const isSelected = (id: string) => selectedPackages.some((p) => p.id === id)

  const toggle = (pkg: Package) => {
    const currentIds = selectedPackages.map((p) => p.id)

    if (currentIds.includes(pkg.id)) {
      // Deselect
      setSelectedPackages(selectedPackages.filter((p) => p.id !== pkg.id))
      if (pkg.type === 'custom') setCustomServices([])
      return
    }

    if (pkg.type === PACKAGE_TYPE.CUSTOM) {
      // Custom clears everything else
      setSelectedPackages([{ id: pkg.id, name: pkg.name_en, price: pkg.price, type: 'custom' }])
      setCustomServices([])
      return
    }

    if (pkg.type === PACKAGE_TYPE.CLEANING) {
      // Replace any existing cleaning package; keep standalone
      const next = selectedPackages
        .filter((p) => p.type !== 'cleaning' && p.type !== 'custom')
        .concat({ id: pkg.id, name: pkg.name_en, price: pkg.price, type: 'cleaning' })
      setSelectedPackages(next)
      return
    }

    if (pkg.type === PACKAGE_TYPE.STANDALONE) {
      // Remove any custom; allow standalone alongside cleaning
      const withoutCustom = selectedPackages.filter((p) => p.type !== 'custom')
      setSelectedPackages([
        ...withoutCustom,
        { id: pkg.id, name: pkg.name_en, price: pkg.price, type: 'standalone' },
      ])
      return
    }
  }

  const canProceed = selectedPackages.length > 0

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ headerShown: true, title: 'Select Package' }} />
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Select Package',
          headerBackTitle: 'Cancel',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />
      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pt-4 pb-40 bg-white"
        className="bg-white"
        ListHeaderComponent={
          <Text className="mb-4 text-sm text-gray-500">
            Pick one cleaning package, optionally add Clothes Washing & Drying, or build your own.
          </Text>
        }
        renderItem={({ item }) => {
          const selected = isSelected(item.id)
          return (
            <TouchableOpacity
              onPress={() => toggle(item)}
              activeOpacity={0.7}
              className={`mb-3 rounded-2xl border p-4 ${
                selected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-semibold text-gray-900">{item.name_en}</Text>
                  <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={2}>
                    {item.description_en}
                  </Text>
                  <Text className="mt-2 text-sm font-semibold text-gray-900">
                    Rs {item.price.toLocaleString()}
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'
                  }`}
                >
                  {selected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* Sticky footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${canProceed ? 'bg-gray-900' : 'bg-gray-200'}`}
          disabled={!canProceed}
          onPress={() => router.push('/booking/address')}
        >
          <Text
            className={`text-base font-semibold ${canProceed ? 'text-white' : 'text-gray-400'}`}
          >
            Next: Address
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```

---

## Task 4: Step 2 — Address

**Files:**
- Create: `apps/customer/app/booking/address.tsx`

Supports two input modes:
1. **Manual text** — user types an address
2. **GPS** — `expo-location` `getCurrentPositionAsync`, reverse-geocode with Google Maps Geocoding API (or use a simple lat/lng display if reverse geocoding is out of scope — simpler for Sprint 2D)

For Sprint 2D we use GPS lat/lng + manual text entry (address_text is what the user types; coordinates come from GPS if they grant permission, otherwise 0,0).

- [ ] **Step 1: Install expo-location if missing**

Check `apps/customer/package.json` for `expo-location`. If absent:
```bash
pnpm --filter customer add expo-location
```

Then add to `apps/customer/app.json` plugins if not present:
```json
{ "plugins": ["expo-location"] }
```

- [ ] **Step 2: Create the screen**

```tsx
// apps/customer/app/booking/address.tsx
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
            {coords ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Use current location (GPS)'}
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
                name={l.icon as any}
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
```

- [ ] **Step 3: Type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```

---

## Task 5: Step 3 — Schedule

**Files:**
- Create: `apps/customer/app/booking/schedule.tsx`

Two options: Instant (book now) or Scheduled (date+time picker). For the date-time picker we use React Native's built-in `DateTimePicker` from `@react-native-community/datetimepicker` (already available via Expo).

- [ ] **Step 1: Check if @react-native-community/datetimepicker is available**

It ships with Expo SDK 55. No install needed.

- [ ] **Step 2: Create the screen**

```tsx
// apps/customer/app/booking/schedule.tsx
import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useBookingFlow } from '@/context/booking-flow'

export default function ScheduleScreen() {
  const router = useRouter()
  const { bookingType, scheduledAt, setBookingType, setScheduledAt } = useBookingFlow()

  const [showPicker, setShowPicker] = useState(false)
  const [pickedDate, setPickedDate] = useState<Date>(
    scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 60 * 60 * 1000)
  )

  const handleTypeSelect = (type: 'instant' | 'scheduled') => {
    setBookingType(type)
    if (type === 'instant') setScheduledAt(null)
  }

  const handleDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false)
    if (date) {
      setPickedDate(date)
      setScheduledAt(date.toISOString())
    }
  }

  const canProceed =
    bookingType === 'instant' || (bookingType === 'scheduled' && scheduledAt !== null)

  const handleNext = () => {
    router.push('/booking/summary')
  }

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
                  onPress={() => setShowPicker(true)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <Text className="text-base text-gray-900">
                    {scheduledAt
                      ? new Date(scheduledAt).toLocaleString()
                      : 'Tap to pick date & time'}
                  </Text>
                </TouchableOpacity>
                {showPicker && (
                  <DateTimePicker
                    value={pickedDate}
                    mode="datetime"
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
          onPress={handleNext}
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
```

- [ ] **Step 3: Type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```

---

## Task 6: Step 4 — Order Summary + Book Now

**Files:**
- Create: `apps/customer/app/booking/summary.tsx`

At this step we assemble the `BookingCreateInput` payload, call `POST /bookings` (via the Fastify API — base URL from `EXPO_PUBLIC_API_URL`), handle success/error, and reset the flow.

If the API is not yet live (Sprint 2D-api is separate), we show an "Coming Soon" alert instead.

- [ ] **Step 1: Create the screen**

```tsx
// apps/customer/app/booking/summary.tsx
import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useBookingFlow } from '@/context/booking-flow'
import { useAuth } from '@/lib/auth'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function SummaryScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const flow = useBookingFlow()
  const [submitting, setSubmitting] = useState(false)

  const handleBook = async () => {
    setSubmitting(true)
    try {
      const payload = {
        package_ids: flow.selectedPackages.map((p) => p.id),
        custom_service_ids: flow.customServices.map((s) => s.id),
        address_text: flow.addressText,
        address_latitude: flow.addressLatitude ?? 0,
        address_longitude: flow.addressLongitude ?? 0,
        address_label: flow.addressLabel,
        saved_address_id: null,
        booking_type: flow.bookingType,
        scheduled_at: flow.scheduledAt,
      }

      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(err.message ?? 'Booking failed')
      }

      flow.reset()
      // Navigate back to home and show success (matching status screen — Sprint 2E)
      router.dismissAll()
      Alert.alert('Booked!', 'Your request is being sent to nearby partners.')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not place booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : null

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Order Summary',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />
      <ScrollView className="flex-1 bg-white px-5 pt-6" contentContainerClassName="pb-40">
        {/* Packages */}
        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Packages
        </Text>
        {flow.selectedPackages.map((pkg) => (
          <View key={pkg.id} className="mb-2 flex-row items-center justify-between">
            <Text className="text-base text-gray-900">{pkg.name}</Text>
            <Text className="text-base font-semibold text-gray-900">
              Rs {pkg.price.toLocaleString()}
            </Text>
          </View>
        ))}

        {/* Custom services */}
        {flow.customServices.length > 0 && (
          <>
            <Text className="mb-3 mt-5 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Custom Services
            </Text>
            {flow.customServices.map((svc) => (
              <View key={svc.id} className="mb-2 flex-row items-center justify-between">
                <Text className="text-base text-gray-900">{svc.name}</Text>
                <Text className="text-base font-semibold text-gray-900">
                  Rs {svc.price.toLocaleString()}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Divider + Total */}
        <View className="my-4 border-t border-gray-100" />
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">Total</Text>
          <Text className="text-xl font-bold text-gray-900">
            Rs {flow.totalPrice.toLocaleString()}
          </Text>
        </View>

        {/* Address */}
        <Text className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Address
        </Text>
        <View className="flex-row items-start gap-2">
          <Ionicons name="location-outline" size={18} color="#6b7280" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-base text-gray-700">{flow.addressText}</Text>
        </View>

        {/* Schedule */}
        <Text className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Schedule
        </Text>
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={18} color="#6b7280" />
          <Text className="text-base text-gray-700">
            {flow.bookingType === 'instant'
              ? 'Book Now (instant)'
              : formatDate(flow.scheduledAt) ?? 'Scheduled'}
          </Text>
        </View>

        {/* Payment note */}
        <View className="mt-6 rounded-xl bg-gray-50 px-4 py-3">
          <Text className="text-sm text-gray-500">
            Payment is cash-on-delivery. You pay the partner directly after the job is done.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <TouchableOpacity
          className="items-center rounded-2xl bg-gray-900 py-4"
          onPress={handleBook}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">Book Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  )
}
```

- [ ] **Step 2: Add EXPO_PUBLIC_API_URL to customer .env**

In `apps/customer/.env`, add:
```
EXPO_PUBLIC_API_URL=http://localhost:4000
```

- [ ] **Step 3: Type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```

---

## Task 7: Wire Entry Points

**Files:**
- Modify: `apps/customer/app/(app)/(home)/index.tsx`

Change `handlePackagePress` to open the booking modal instead of showing "Coming Soon":

```tsx
const handlePackagePress = (pkg: Package) => {
  router.push('/booking')
}

const handleQuickAdd = (pkg: Package) => {
  router.push('/booking')
}
```

- [ ] **Step 1: Update handlePackagePress and onQuickAdd in index.tsx**

In [apps/customer/app/(app)/(home)/index.tsx](apps/customer/app/(app)/(home)/index.tsx), replace:
```tsx
const handlePackagePress = (_pkg: Package) => {
  Alert.alert('Coming Soon', 'Booking flow will be available in the next update.')
}
```
with:
```tsx
const handlePackagePress = (_pkg: Package) => {
  router.push('/booking')
}
```

And replace the `onQuickAdd` handler reference:
```tsx
onQuickAdd={() => handlePackagePress(item)}
```
(This is already wired — no change needed since it calls handlePackagePress.)

Also remove the `Alert` import if it's no longer used after this change.

- [ ] **Step 2: Type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```

---

## Task 8: Final Verification

- [ ] **Step 1: Full type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Update tasks/todo.md**

Mark Sprint 2D-frontend complete.

- [ ] **Step 3: Commit**

```bash
git add apps/customer/context/booking-flow.tsx \
        apps/customer/app/booking/_layout.tsx \
        apps/customer/app/booking/index.tsx \
        apps/customer/app/booking/address.tsx \
        apps/customer/app/booking/schedule.tsx \
        apps/customer/app/booking/summary.tsx \
        apps/customer/app/(app)/(home)/index.tsx \
        apps/customer/.env \
        tasks/todo.md
git commit -m "feat(customer): Sprint 2D-frontend — 4-step booking flow modal"
```
