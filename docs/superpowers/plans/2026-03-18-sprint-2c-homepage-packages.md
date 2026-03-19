# Sprint 2C — Homepage & Package Browsing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the customer app homepage that displays all active packages, a package detail page, and a custom package builder screen where the customer picks individual services.

**Architecture:** Pure Supabase reads direct from the component (no API layer needed — packages/services are public-read via RLS anon policy). FlatList for all lists (never ScrollView + map for performance). Four screens, two shared components. CTA buttons show "Coming Soon" alert — booking flow is wired in Sprint 2D.

**Tech Stack:** React Native, Expo Router v4, NativeWind v4, `@supabase/supabase-js`, `@safainow/types`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `apps/customer/app/(app)/(home)/index.tsx` | Homepage — greets user, fetches + renders package list |
| Modify | `apps/customer/app/(app)/(home)/_layout.tsx` | Add header config for child screens |
| Create | `apps/customer/app/(app)/(home)/package/[id].tsx` | Package detail — name, description, service list, price, CTA |
| Create | `apps/customer/app/(app)/(home)/custom.tsx` | Custom builder — service checklist, live total, CTA |
| Create | `apps/customer/components/PackageCard.tsx` | Presentational card: name, type badge, description, price |
| Create | `apps/customer/components/ServiceItem.tsx` | Presentational row: service name, price, checkbox |

---

## Task 1: PackageCard component

**Files:**
- Create: `apps/customer/components/PackageCard.tsx`

### Context
`packages` table columns used here: `id`, `name_en`, `description_en`, `price`, `type` (`'cleaning' | 'standalone' | 'custom'`). This is a pure presentational component — no Supabase calls.

Badge colours: `cleaning` → dark (`bg-gray-900 text-white`), `standalone` → medium (`bg-gray-700 text-white`), `custom` → outlined (`border border-gray-900 text-gray-900`).

- [ ] **Step 1: Create the component**

```tsx
// apps/customer/components/PackageCard.tsx
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type PackageType = 'cleaning' | 'standalone' | 'custom'

interface PackageCardProps {
  id: string
  name: string
  description: string
  price: number
  type: PackageType
  onPress: () => void       // tap card body → booking flow (Sprint 2D)
  onViewDetail: () => void  // tap eye icon → package detail page
}

const TYPE_BADGE: Record<PackageType, { label: string; className: string }> = {
  cleaning: { label: 'Cleaning', className: 'bg-gray-900' },
  standalone: { label: 'Standalone', className: 'bg-gray-600' },
  custom: { label: 'Build Your Own', className: 'bg-gray-400' },
}

export default function PackageCard({ name, description, price, type, onPress, onViewDetail }: PackageCardProps) {
  const badge = TYPE_BADGE[type]

  return (
    <TouchableOpacity
      className="mb-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Badge + eye icon row */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className={`rounded-full px-3 py-1 ${badge.className}`}>
          <Text className="text-xs font-semibold text-white">{badge.label}</Text>
        </View>
        {/* Eye icon — separate touch target, does not bubble to card press */}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); onViewDetail() }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="rounded-full p-1"
        >
          <Ionicons name="eye-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Name */}
      <Text className="mb-1 text-lg font-bold text-gray-900">{name}</Text>

      {/* Description */}
      <Text className="mb-4 text-sm leading-5 text-gray-500" numberOfLines={2}>
        {description}
      </Text>

      {/* Price */}
      <Text className="text-base font-semibold text-gray-900">Rs {price.toLocaleString()}</Text>
    </TouchableOpacity>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/customer/components/PackageCard.tsx
git commit -m "feat(customer): add PackageCard component"
```

---

## Task 2: Homepage screen

**Files:**
- Modify: `apps/customer/app/(app)/(home)/index.tsx`

### Context
Fetch all active packages from Supabase — the `packages` table has a public anon SELECT policy (`is_active = true` filter in RLS). The user's display name comes from `session.user.user_metadata.full_name`. Use `useAuth()` for the session.

Custom Package (type = `'custom'`) tapping goes to `/custom`, all others go to `/package/[id]`.

Loading state: `ActivityIndicator`. Error state: retry button. Empty state: short message.

- [ ] **Step 1: Replace the homepage stub**

```tsx
// apps/customer/app/(app)/(home)/index.tsx
import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import PackageCard from '@/components/PackageCard'
import type { Tables } from '@safainow/types'

type Package = Tables<'packages'>

export default function HomeScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstName = session?.user.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  const fetchPackages = useCallback(async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      setError('Could not load packages. Please try again.')
    } else {
      setPackages(data ?? [])
      setError(null)
    }
  }, [])

  useEffect(() => {
    fetchPackages().finally(() => setLoading(false))
  }, [fetchPackages])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPackages()
    setRefreshing(false)
  }, [fetchPackages])

  // Tapping the card body → booking flow (Coming Soon until Sprint 2D)
  const handlePackagePress = (pkg: Package) => {
    Alert.alert('Coming Soon', 'Booking flow will be available in the next update.')
  }

  // Tapping the eye icon → detail page
  const handleViewDetail = (pkg: Package) => {
    if (pkg.type === 'custom') {
      router.push('/(app)/(home)/custom')
    } else {
      router.push(`/(app)/(home)/package/${pkg.id}`)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-4 text-center text-base text-gray-500">{error}</Text>
        <TouchableOpacity
          className="rounded-xl bg-gray-900 px-6 py-3"
          onPress={() => {
            setLoading(true)
            fetchPackages().finally(() => setLoading(false))
          }}
        >
          <Text className="text-sm font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <FlatList
      data={packages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PackageCard
          id={item.id}
          name={item.name_en}
          description={item.description_en}
          price={item.price}
          type={item.type}
          onPress={() => handlePackagePress(item)}
          onViewDetail={() => handleViewDetail(item)}
        />
      )}
      contentContainerClassName="px-5 pt-6 pb-10"
      ListHeaderComponent={
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">Hello, {firstName} 👋</Text>
          <Text className="mt-1 text-base text-gray-500">What would you like cleaned today?</Text>
        </View>
      }
      ListEmptyComponent={
        <View className="items-center pt-16">
          <Text className="text-base text-gray-400">No packages available right now.</Text>
        </View>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter customer exec tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add 'apps/customer/app/(app)/(home)/index.tsx'
git commit -m "feat(customer): homepage — active packages list with pull-to-refresh"
```

---

## Task 3: Package detail screen

**Files:**
- Create: `apps/customer/app/(app)/(home)/package/[id].tsx`

### Context
The route param is `id` (UUID). Join `packages` with its services: `select('*, package_services(services(*))')`. This returns:

```ts
{
  ...package fields,
  package_services: Array<{
    services: {
      id: string, name_en: string, name_ur: string, price: number, is_active: boolean, ...
    }
  }>
}
```

The "Book This Package" button shows `Alert.alert('Coming Soon', ...)` — booking flow is wired in Sprint 2D.

Use `<Stack.Screen options={{ ... }} />` inside the component to set the header title dynamically (Expo Router pattern).

- [ ] **Step 1: Create the package directory and detail screen**

```tsx
// apps/customer/app/(app)/(home)/package/[id].tsx
import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@safainow/types'

type Service = Tables<'services'>

type PackageWithServices = Tables<'packages'> & {
  package_services: Array<{ services: Service }>
}

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [pkg, setPkg] = useState<PackageWithServices | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPackage() {
      const { data, error } = await supabase
        .from('packages')
        .select('*, package_services(services(*))')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setError('Package not found.')
      } else {
        setPkg(data as PackageWithServices)
      }
      setLoading(false)
    }
    fetchPackage()
  }, [id])

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '' }} />
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </>
    )
  }

  if (error || !pkg) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Package' }} />
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="mb-4 text-center text-base text-gray-500">
            {error ?? 'Something went wrong.'}
          </Text>
          <TouchableOpacity
            className="rounded-xl bg-gray-900 px-6 py-3"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-semibold text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    )
  }

  const services = pkg.package_services.map((ps) => ps.services)

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: pkg.name_en,
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />

      {/* Scrollable content */}
      <ScrollView className="flex-1 bg-white" contentContainerClassName="px-5 pt-6 pb-40">
        {/* Type badge */}
        <View className="mb-4 self-start rounded-full bg-gray-900 px-3 py-1">
          <Text className="text-xs font-semibold capitalize text-white">{pkg.type}</Text>
        </View>

        {/* Name */}
        <Text className="mb-2 text-2xl font-bold text-gray-900">{pkg.name_en}</Text>

        {/* Description */}
        {pkg.description_en ? (
          <Text className="mb-6 text-base leading-6 text-gray-500">{pkg.description_en}</Text>
        ) : null}

        {/* Services included */}
        <Text className="mb-3 text-base font-semibold text-gray-900">Services Included</Text>
        <View className="rounded-2xl border border-gray-100 bg-gray-50">
          {services.map((service, index) => (
            <View
              key={service.id}
              className={`flex-row items-center justify-between px-4 py-4 ${
                index < services.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={18} color="#111827" />
                <Text className="text-base text-gray-900">{service.name_en}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky footer CTA */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">Total price</Text>
          <Text className="text-xl font-bold text-gray-900">Rs {pkg.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          className="items-center rounded-2xl bg-gray-900 py-4"
          onPress={() =>
            Alert.alert('Coming Soon', 'Booking flow will be available in the next update.')
          }
        >
          <Text className="text-base font-semibold text-white">Book This Package</Text>
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
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add 'apps/customer/app/(app)/(home)/package/[id].tsx'
git commit -m "feat(customer): package detail screen with service list"
```

---

## Task 4: ServiceItem component + Custom package builder

**Files:**
- Create: `apps/customer/components/ServiceItem.tsx`
- Create: `apps/customer/app/(app)/(home)/custom.tsx`

### Context
The custom builder fetches all active services (`services` table, anon SELECT policy). The user taps rows to toggle selection. A sticky footer shows the running total and "Book Custom" CTA.

`ServiceItem` is a pure presentational row — checkbox state managed by the parent screen.

- [ ] **Step 1: Create ServiceItem component**

```tsx
// apps/customer/components/ServiceItem.tsx
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ServiceItemProps {
  name: string
  price: number
  selected: boolean
  onToggle: () => void
}

export default function ServiceItem({ name, price, selected, onToggle }: ServiceItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between px-4 py-4"
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View className="flex-1 flex-row items-center gap-3 pr-4">
        <View
          className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
            selected ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'
          }`}
        >
          {selected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
        </View>
        <Text className="flex-1 text-base text-gray-900">{name}</Text>
      </View>
      <Text className="text-sm font-medium text-gray-500">Rs {price.toLocaleString()}</Text>
    </TouchableOpacity>
  )
}
```

- [ ] **Step 2: Create the custom builder screen**

```tsx
// apps/customer/app/(app)/(home)/custom.tsx
import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Stack } from 'expo-router'
import { supabase } from '@/lib/supabase'
import ServiceItem from '@/components/ServiceItem'
import type { Tables } from '@safainow/types'

type Service = Tables<'services'>

export default function CustomPackageScreen() {
  const [services, setServices] = useState<Service[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name_en', { ascending: true })

    if (error) {
      setError('Could not load services. Please try again.')
    } else {
      setServices(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const toggleService = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const total = services
    .filter((s) => selected.has(s.id))
    .reduce((sum, s) => sum + s.price, 0)

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Custom Package' }} />
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Custom Package' }} />
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="mb-4 text-center text-base text-gray-500">{error}</Text>
          <TouchableOpacity
            className="rounded-xl bg-gray-900 px-6 py-3"
            onPress={() => {
              setLoading(true)
              fetchServices()
            }}
          >
            <Text className="text-sm font-semibold text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Custom Package',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
        }}
      />

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View
            className={`${index < services.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <ServiceItem
              name={item.name_en}
              price={item.price}
              selected={selected.has(item.id)}
              onToggle={() => toggleService(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View className="px-5 pb-2 pt-6">
            <Text className="text-base text-gray-500">
              Select the services you need. Price updates as you pick.
            </Text>
          </View>
        }
        contentContainerClassName="pb-40 bg-white"
        className="bg-white"
      />

      {/* Sticky footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm text-gray-500">
            {selected.size} service{selected.size !== 1 ? 's' : ''} selected
          </Text>
          <Text className="text-xl font-bold text-gray-900">Rs {total.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${
            selected.size === 0 ? 'bg-gray-200' : 'bg-gray-900'
          }`}
          disabled={selected.size === 0}
          onPress={() =>
            Alert.alert('Coming Soon', 'Booking flow will be available in the next update.')
          }
        >
          <Text
            className={`text-base font-semibold ${
              selected.size === 0 ? 'text-gray-400' : 'text-white'
            }`}
          >
            Book Custom Package
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
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/customer/components/ServiceItem.tsx 'apps/customer/app/(app)/(home)/custom.tsx'
git commit -m "feat(customer): custom package builder with service picker and live total"
```

---

## Task 5: Update Home layout + todo.md

**Files:**
- Modify: `apps/customer/app/(app)/(home)/_layout.tsx`
- Modify: `tasks/todo.md`

### Context
The `(home)` Stack currently sets `headerShown: false` globally. Child screens (`package/[id]` and `custom`) override this per-screen using `<Stack.Screen options={{ headerShown: true }} />`, which works with Expo Router. No change needed to the layout itself — but we need to verify the screens appear correctly by confirming the Stack doesn't block the per-screen override.

Actually the current `_layout.tsx` already sets `screenOptions={{ headerShown: false }}` — the per-screen `<Stack.Screen>` override in child components works correctly in Expo Router (child overrides parent `screenOptions`). No layout change needed.

- [ ] **Step 1: Final full type-check across all apps**

```bash
pnpm --filter customer exec tsc --noEmit
pnpm --filter admin exec tsc --noEmit
```
Expected: no errors in either

- [ ] **Step 2: Mark Sprint 2C tasks complete in tasks/todo.md**

In `tasks/todo.md`, mark all items under `### 🔲 Customer App — Homepage & Package Browsing` as `[x]` and change the heading to `### ✅`.

- [ ] **Step 3: Final commit**

```bash
git add tasks/todo.md
git commit -m "chore: mark Sprint 2C complete in todo.md"
```

---

## Verification Checklist

After all tasks are done, manually verify on Android/iOS simulator:

- [ ] Home screen shows greeting with user's first name
- [ ] All 5 packages appear (Standard, Special, Advanced, Clothes W&D, Custom)
- [ ] Type badges show correct label for each package
- [ ] Pull-to-refresh works
- [ ] Tapping Standard/Special/Advanced/Clothes navigates to detail page
- [ ] Detail page shows correct services list for each package
- [ ] "Book This Package" shows "Coming Soon" alert
- [ ] Tapping Custom navigates to custom builder
- [ ] Custom builder lists all 15 services
- [ ] Tapping a service toggles checkbox and updates total
- [ ] "Book Custom Package" button is disabled (gray) with 0 selections
- [ ] "Book Custom Package" button is active (black) with ≥1 selection
- [ ] "Book Custom Package" shows "Coming Soon" alert
- [ ] Back navigation works on both detail and custom screens
