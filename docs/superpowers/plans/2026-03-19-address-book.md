# Address Book Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Let customers save, manage, and reuse addresses from both the profile tab and the booking flow.

**Architecture:** Profile tab gets a Stack layout for navigation (list/add/edit). Address CRUD uses Supabase `customer_addresses` table (RLS: own CRUD). The booking flow address step gains a "Saved Addresses" picker that pre-fills the form. All screens use `useSafeAreaInsets()` for safe area handling (L030).

**Tech Stack:** Expo Router v4, React Native, NativeWind v4, Supabase JS client, expo-location

---

## File Structure

| # | File | Action | Responsibility |
|---|------|--------|----------------|
| 1 | `apps/customer/app/(app)/profile/_layout.tsx` | Create | Stack layout for profile tab (index, addresses, add-address, edit-address) |
| 2 | `apps/customer/app/(app)/profile/index.tsx` | Modify | Add "Address Book" row that navigates to addresses screen |
| 3 | `apps/customer/app/(app)/profile/addresses.tsx` | Create | List saved addresses, default badge, delete, navigate to add/edit |
| 4 | `apps/customer/app/(app)/profile/add-address.tsx` | Create | Add address form (text, GPS, label) — saves to `customer_addresses` |
| 5 | `apps/customer/app/(app)/profile/edit-address.tsx` | Create | Edit address form (text, label) — updates `customer_addresses` |
| 6 | `apps/customer/components/AddressRow.tsx` | Create | Reusable row component for address list items |
| 7 | `apps/customer/app/booking/address.tsx` | Modify | Add saved address picker at the top of the existing form |

---

## Chunk 1: Profile Stack Layout + Address List

### Task 1: Profile Stack Layout

**Files:**
- Create: `apps/customer/app/(app)/profile/_layout.tsx`

- [x] **Step 1: Create the profile stack layout**

```tsx
import { Stack } from 'expo-router'

export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

This mirrors the pattern used in `apps/customer/app/(app)/bookings/_layout.tsx`.

- [x] **Step 2: Verify no type errors**

Run: `pnpm --filter customer exec tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: Commit**

```bash
git add apps/customer/app/\(app\)/profile/_layout.tsx
git commit -m "feat(customer): add profile stack layout for address book navigation"
```

---

### Task 2: Update Profile Screen with Address Book Link

**Files:**
- Modify: `apps/customer/app/(app)/profile/index.tsx`

- [x] **Step 1: Rewrite profile screen with address book navigation row**

Replace the placeholder profile screen with a proper menu. Keep the Sign Out button. Add a row for "Address Book" that navigates to `./addresses`.

```tsx
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <Text className="px-5 text-2xl font-bold text-gray-900">Profile</Text>

      <View className="mt-6 px-5">
        {/* Address Book */}
        <TouchableOpacity
          onPress={() => router.push('/profile/addresses')}
          className="flex-row items-center justify-between border-b border-gray-100 py-4"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="location-outline" size={22} color="#111827" />
            <Text className="text-base text-gray-900">Address Book</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Sign Out at bottom */}
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
```

- [x] **Step 2: Verify no type errors**

Run: `pnpm --filter customer exec tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: Commit**

```bash
git add apps/customer/app/\(app\)/profile/index.tsx
git commit -m "feat(customer): add address book link to profile screen"
```

---

### Task 3: AddressRow Component

**Files:**
- Create: `apps/customer/components/AddressRow.tsx`

- [x] **Step 1: Create the reusable address row component**

Used in both the address list screen and the booking flow picker.

```tsx
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ADDRESS_LABEL } from '@safainow/constants'

const LABEL_ICON: Record<string, string> = {
  [ADDRESS_LABEL.HOME]: 'home-outline',
  [ADDRESS_LABEL.WORK]: 'briefcase-outline',
  [ADDRESS_LABEL.PARENTS_HOUSE]: 'people-outline',
  [ADDRESS_LABEL.OTHER]: 'location-outline',
}

const LABEL_TEXT: Record<string, string> = {
  [ADDRESS_LABEL.HOME]: 'Home',
  [ADDRESS_LABEL.WORK]: 'Work',
  [ADDRESS_LABEL.PARENTS_HOUSE]: "Parents'",
  [ADDRESS_LABEL.OTHER]: 'Other',
}

interface AddressRowProps {
  id: string
  addressText: string
  label: string
  customLabel: string | null
  isDefault: boolean
  onPress?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function AddressRow({
  addressText,
  label,
  customLabel,
  isDefault,
  onPress,
  onEdit,
  onDelete,
}: AddressRowProps) {
  const iconName = LABEL_ICON[label] ?? 'location-outline'
  const labelText = customLabel || LABEL_TEXT[label] || 'Address'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="flex-row items-center border-b border-gray-100 py-4"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
        <Ionicons
          name={iconName as 'home-outline'}
          size={18}
          color="#374151"
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-gray-900">{labelText}</Text>
          {isDefault && (
            <View className="rounded-full bg-green-100 px-2 py-0.5">
              <Text className="text-[10px] font-semibold text-green-700">Default</Text>
            </View>
          )}
        </View>
        <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={1}>
          {addressText}
        </Text>
      </View>

      {onEdit && (
        <TouchableOpacity onPress={onEdit} hitSlop={8} className="ml-2 p-1">
          <Ionicons name="create-outline" size={18} color="#6b7280" />
        </TouchableOpacity>
      )}
      {onDelete && (
        <TouchableOpacity onPress={onDelete} hitSlop={8} className="ml-2 p-1">
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}
```

- [x] **Step 2: Verify no type errors**

Run: `pnpm --filter customer exec tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: Commit**

```bash
git add apps/customer/components/AddressRow.tsx
git commit -m "feat(customer): add reusable AddressRow component"
```

---

### Task 4: Address List Screen

**Files:**
- Create: `apps/customer/app/(app)/profile/addresses.tsx`

- [x] **Step 1: Create the address list screen**

Lists all saved addresses with default badge. Supports delete with confirmation and set-as-default toggle. Uses `useSafeAreaInsets()` for safe area (L030).

```tsx
import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import AddressRow from '@/components/AddressRow'
import type { Database } from '@safainow/types'

type AddressRow_DB = Database['public']['Tables']['customer_addresses']['Row']

export default function AddressesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const [addresses, setAddresses] = useState<AddressRow_DB[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchAddresses().finally(() => setLoading(false))
  }, [fetchAddresses])

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
    if (!session?.user.id) return
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
            onPress={() => handleSetDefault(item.id)}
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
```

- [x] **Step 2: Verify no type errors**

Run: `pnpm --filter customer exec tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: Commit**

```bash
git add apps/customer/app/\(app\)/profile/addresses.tsx
git commit -m "feat(customer): add address list screen with delete and default toggle"
```

---

## Chunk 2: Add/Edit Address Forms + Booking Flow Integration

### Task 5: Add Address Form

**Files:**
- Create: `apps/customer/app/(app)/profile/add-address.tsx`

- [x] **Step 1: Create the add address form**

Reuses the same GPS + label picker UX from the booking flow address step. Saves to `customer_addresses` table.

```tsx
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

  const canSave = text.trim().length >= 5 && coords !== null

  const handleSave = async () => {
    if (!session?.user.id || !coords) return
    setSaving(true)
    const { error } = await supabase.from('customer_addresses').insert({
      customer_id: session.user.id,
      address_text: text.trim(),
      lat: coords.lat,
      lng: coords.lng,
      label: label as 'home' | 'work' | 'parents_house' | 'other',
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
              onPress={() => setLabel(l.key)}
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
```

- [x] **Step 2: Verify no type errors**

Run: `pnpm --filter customer exec tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: Commit**

```bash
git add apps/customer/app/\(app\)/profile/add-address.tsx
git commit -m "feat(customer): add address form with GPS and label picker"
```

---

### Task 6: Edit Address Form

**Files:**
- Create: `apps/customer/app/(app)/profile/edit-address.tsx`

- [x] **Step 1: Create the edit address form**

Loads existing address by `id` param, allows editing text and label. Does NOT allow changing GPS coords (user should delete and re-add if location changed).

```tsx
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
              onPress={() => setLabel(l.key)}
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
```

- [x] **Step 2: Verify no type errors**

Run: `pnpm --filter customer exec tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: Commit**

```bash
git add apps/customer/app/\(app\)/profile/edit-address.tsx
git commit -m "feat(customer): add edit address form"
```

---

### Task 7: Integrate Saved Addresses into Booking Flow

**Files:**
- Modify: `apps/customer/app/booking/address.tsx`

- [x] **Step 1: Add saved address picker to the booking flow address step**

Add a horizontal scrollable row of saved addresses at the top of the existing form. Tapping a saved address pre-fills the text, coords, and label. The user can still manually type or use GPS.

Key changes to `apps/customer/app/booking/address.tsx`:
1. Import `useAuth`, `supabase`, and `AddressRow` types
2. Fetch saved addresses on mount
3. Add a "Saved Addresses" section before the text input
4. Tapping a saved address fills `text`, `coords`, and `label`

```tsx
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
```

- [x] **Step 2: Verify no type errors**

Run: `pnpm --filter customer exec tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: Commit**

```bash
git add apps/customer/app/booking/address.tsx
git commit -m "feat(customer): add saved address picker to booking flow address step"
```

---

### Task 8: Update todo.md and Final Verification

**Files:**
- Modify: `tasks/todo.md`

- [x] **Step 1: Tick off address book items in todo.md**

Mark all items under "Customer App — Address Book" as complete:

```markdown
### ✅ Customer App — Address Book
- [x] Address book screen `app/(app)/profile/addresses.tsx` — list saved addresses with default badge
- [x] Add address form (accessible from address book and from booking flow step 2)
- [x] Edit address (address text, label)
- [x] Delete address (with confirmation)
- [x] Set as default toggle
```

- [x] **Step 2: Run final type check**

Run: `pnpm --filter customer exec tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: Commit**

```bash
git add tasks/todo.md
git commit -m "chore: tick off address book tasks in todo.md"
```

---

## Verification Checklist

1. `pnpm --filter customer exec tsc --noEmit` — 0 errors
2. Profile tab shows "Address Book" row instead of placeholder
3. Address Book screen lists saved addresses with default badge
4. "+" button opens add address form; saving an address returns to list
5. Edit icon opens edit form; saving returns to list with updated data
6. Delete shows confirmation dialog; confirming removes the address
7. Tapping an address row sets it as default (green badge moves)
8. Booking flow address step shows saved addresses as horizontal chips
9. Tapping a saved address chip pre-fills text, GPS, and label
10. Manual entry still works independently of saved addresses
