# Sprint 3A — Partner App Foundation & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the partner app with Expo Router, RTL Urdu layout, Noto Nastaliq Urdu font, and phone+passcode authentication backed by Supabase Auth.

**Architecture:** Partner app uses Expo Router SDK 54 with `I18nManager.forceRTL(true)` enforced before first render. Login calls `POST /partners/login` on the Fastify API, which verifies bcrypt passcode then calls `supabase.auth.signInWithPassword` with a fake email (`{phone}@safainow.local`). Session is stored via expo-secure-store. Admin app is updated to create/update Supabase Auth users alongside partner DB rows.

**Tech Stack:** Expo SDK 54, Expo Router ~6.0.23, NativeWind v4 + Tailwind v3, Supabase Auth, bcryptjs, Fastify v5, Next.js 16

---

## File Map

**Create:**
- `apps/partner/app/_layout.tsx` — root layout: font load, RTL, AuthProvider, session guard
- `apps/partner/app/(auth)/_layout.tsx` — auth stack (no header)
- `apps/partner/app/(auth)/login.tsx` — phone + passcode login screen (Urdu)
- `apps/partner/app/(app)/_layout.tsx` — bottom tabs: Jobs, History, Earnings
- `apps/partner/app/(app)/(jobs)/index.tsx` — stub jobs screen
- `apps/partner/app/(app)/history/index.tsx` — stub history screen
- `apps/partner/app/(app)/earnings/index.tsx` — stub earnings screen
- `apps/partner/lib/supabase.ts` — Supabase client with expo-secure-store adapter
- `apps/partner/lib/supabase-storage.ts` — hybrid SecureStore/AsyncStorage adapter
- `apps/partner/lib/auth.tsx` — AuthContext: session, loading, partner, signOut
- `apps/partner/assets/fonts/NotoNastaliqUrdu-Regular.ttf` — bundled font file
- `apps/api/src/routes/partners/index.ts` — POST /partners/login
- `apps/admin/src/lib/supabase/admin.ts` — service-role Supabase client for auth admin ops
- `supabase/migrations/20260401000000_add_auth_user_id_to_partners.sql`

**Modify:**
- `apps/partner/package.json` — `main` → `expo-router/entry`, add new deps
- `apps/partner/app.json` — add scheme, expo-router plugin, typedRoutes
- `apps/partner/.env` — add `EXPO_PUBLIC_API_URL`
- `apps/api/package.json` — add bcryptjs + @types/bcryptjs
- `apps/admin/src/app/(dashboard)/dashboard/partners/actions.ts` — create/update Supabase Auth user
- `apps/admin/.env.local` — add `SUPABASE_SECRET_KEY`
- `packages/types/` — regenerate after migration
- `tasks/todo.md` — mark Sprint 3A tasks complete

---

## Task 1: DB Migration — add auth_user_id to partners

**Files:**
- Create: `supabase/migrations/20260401000000_add_auth_user_id_to_partners.sql`

- [ ] Create migration file:

```sql
ALTER TABLE public.partners
  ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

- [ ] Push migration to Supabase:

```bash
cd /Users/sikanderahmed/Documents/dev_projects/safainow
supabase db push
```

Expected: `Applying migration 20260401000000_add_auth_user_id_to_partners.sql`

- [ ] Regenerate types:

```bash
supabase gen types typescript --linked > packages/types/src/database.types.ts
```

- [ ] Commit:

```bash
git add supabase/migrations/20260401000000_add_auth_user_id_to_partners.sql packages/types/src/database.types.ts
git commit -m "feat(db): add auth_user_id column to partners table"
```

---

## Task 2: Install partner app packages

**Files:**
- Modify: `apps/partner/package.json`

- [ ] Install SDK-54-compatible packages (run from inside `apps/partner`):

```bash
cd /Users/sikanderahmed/Documents/dev_projects/safainow/apps/partner
npx expo install expo-router expo-constants expo-linking expo-secure-store expo-font expo-splash-screen @expo/vector-icons @react-native-async-storage/async-storage
```

- [ ] Run fix to align versions:

```bash
npx expo install --fix
```

- [ ] Verify key versions in `apps/partner/package.json`:

```bash
grep -E '"expo-router"|"expo-font"|"expo-secure-store"' package.json
```

Expected: expo-router ~6.x.x, expo-font ~13.x.x, expo-secure-store ~15.x.x

- [ ] Commit:

```bash
git add apps/partner/package.json pnpm-lock.yaml
git commit -m "feat(partner): install expo-router and auth packages"
```

---

## Task 3: Download Noto Nastaliq Urdu font

**Files:**
- Create: `apps/partner/assets/fonts/NotoNastaliqUrdu-Regular.ttf`

- [ ] Create fonts directory and download font:

```bash
mkdir -p /Users/sikanderahmed/Documents/dev_projects/safainow/apps/partner/assets/fonts
cd /Users/sikanderahmed/Documents/dev_projects/safainow/apps/partner/assets/fonts
curl -L "https://fonts.gstatic.com/s/notonastaliqurdu/v27/LhWNMUPbN-oZdNFcBy1-DJYsEoTq5pudQ_gSUXTwAldghA.ttf" -o NotoNastaliqUrdu-Regular.ttf
```

- [ ] Verify file exists and has size > 0:

```bash
ls -lh /Users/sikanderahmed/Documents/dev_projects/safainow/apps/partner/assets/fonts/
```

Expected: `NotoNastaliqUrdu-Regular.ttf` with size ~200KB+

- [ ] Commit:

```bash
git add apps/partner/assets/fonts/NotoNastaliqUrdu-Regular.ttf
git commit -m "feat(partner): add Noto Nastaliq Urdu font asset"
```

---

## Task 4: Configure partner app.json and package.json

**Files:**
- Modify: `apps/partner/app.json`
- Modify: `apps/partner/package.json`
- Modify: `apps/partner/.env`

- [ ] Update `apps/partner/package.json` — change `main`:

```json
{
  "name": "partner",
  "version": "1.0.0",
  "main": "expo-router/entry",
  ...
}
```

- [ ] Update `apps/partner/app.json` — add scheme, plugin, typedRoutes:

```json
{
  "expo": {
    "name": "SafaiNow Partner",
    "slug": "partner",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "scheme": "safainow-partner",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "package": "com.anonymous.partner"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

Note: removed `expo-sqlite` plugin — not needed for Sprint 3A.

- [ ] Add `EXPO_PUBLIC_API_URL` to `apps/partner/.env` (use your machine's LAN IP, same as customer):

```
EXPO_PUBLIC_API_URL=http://192.168.100.57:3001
```

- [ ] Commit:

```bash
git add apps/partner/package.json apps/partner/app.json apps/partner/.env
git commit -m "feat(partner): configure expo-router, scheme, and API URL"
```

---

## Task 5: Partner Supabase client + storage adapter

**Files:**
- Create: `apps/partner/lib/supabase-storage.ts`
- Create: `apps/partner/lib/supabase.ts`

- [ ] Create `apps/partner/lib/supabase-storage.ts`:

```typescript
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const SupabaseStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key)
      if (value !== null) return value
    } catch {
      // Fall through to AsyncStorage
    }
    return AsyncStorage.getItem(key)
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= 2000) {
      try {
        await SecureStore.setItemAsync(key, value)
        return
      } catch {
        // Fall through to AsyncStorage
      }
    }
    await AsyncStorage.setItem(key, value)
  },

  async removeItem(key: string): Promise<void> {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(key),
      AsyncStorage.removeItem(key),
    ])
  },
}
```

- [ ] Create `apps/partner/lib/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { AppState } from 'react-native'
import type { Database } from '@safainow/types'
import { SupabaseStorageAdapter } from './supabase-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: SupabaseStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
```

- [ ] Commit:

```bash
git add apps/partner/lib/supabase.ts apps/partner/lib/supabase-storage.ts
git commit -m "feat(partner): add Supabase client with secure storage adapter"
```

---

## Task 6: Partner AuthContext

**Files:**
- Create: `apps/partner/lib/auth.tsx`

- [ ] Create `apps/partner/lib/auth.tsx`:

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Tables } from '@safainow/types'

type Partner = Tables<'partners'>

interface AuthContextValue {
  session: Session | null
  isLoading: boolean
  partner: Partner | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  partner: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [partner, setPartner] = useState<Partner | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch partner profile when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setPartner(null)
      return
    }
    supabase
      .from('partners')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) setPartner(data)
      })
  }, [session?.user?.id])

  async function signOut() {
    await supabase.auth.signOut()
    setPartner(null)
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, partner, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
```

- [ ] Commit:

```bash
git add apps/partner/lib/auth.tsx
git commit -m "feat(partner): add AuthContext with partner profile fetch"
```

---

## Task 7: Root layout — font loading, RTL, session guard

**Files:**
- Create: `apps/partner/app/_layout.tsx`

- [ ] Create `apps/partner/app/_layout.tsx`:

```typescript
import '../global.css'
import { useEffect } from 'react'
import { I18nManager } from 'react-native'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider, useAuth } from '@/lib/auth'

// Force RTL before any component renders
I18nManager.allowRTL(true)
I18nManager.forceRTL(true)

SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  const { session, isLoading } = useAuth()

  if (isLoading) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoNastaliqUrdu: require('../assets/fonts/NotoNastaliqUrdu-Regular.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
```

Note: `expo-splash-screen` ships with `expo` — no separate install needed.

- [ ] Commit:

```bash
git add apps/partner/app/_layout.tsx
git commit -m "feat(partner): root layout with RTL, Urdu font, and session guard"
```

---

## Task 8: Auth layout + Login screen

**Files:**
- Create: `apps/partner/app/(auth)/_layout.tsx`
- Create: `apps/partner/app/(auth)/login.tsx`

- [ ] Create `apps/partner/app/(auth)/_layout.tsx`:

```typescript
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] Create `apps/partner/app/(auth)/login.tsx`:

```typescript
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL!

export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!phone.trim() || passcode.length !== 6) {
      Alert.alert('خرابی', 'فون نمبر اور 6 ہندسوں کا پاس کوڈ درج کریں')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/partners/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), passcode }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          Alert.alert('خرابی', 'آپ کا اکاؤنٹ معطل ہے')
        } else {
          Alert.alert('خرابی', 'فون نمبر یا پاس کوڈ غلط ہے')
        }
        return
      }

      // Set the session in the Supabase client — triggers AuthContext update
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
    } catch {
      Alert.alert('خرابی', 'نیٹ ورک میں مسئلہ ہے')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text
          className="text-3xl font-bold text-center mb-2"
          style={{ fontFamily: 'NotoNastaliqUrdu' }}
        >
          صفائی ناؤ
        </Text>
        <Text
          className="text-lg text-gray-500 text-center mb-10"
          style={{ fontFamily: 'NotoNastaliqUrdu' }}
        >
          پارٹنر لاگ ان
        </Text>

        <Text
          className="text-sm text-gray-600 mb-1 text-right"
          style={{ fontFamily: 'NotoNastaliqUrdu' }}
        >
          فون نمبر
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base text-right"
          placeholder="03001234567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <Text
          className="text-sm text-gray-600 mb-1 text-right"
          style={{ fontFamily: 'NotoNastaliqUrdu' }}
        >
          پاس کوڈ
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-8 text-base text-center tracking-widest"
          placeholder="••••••"
          value={passcode}
          onChangeText={(t) => setPasscode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />

        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className="text-white text-lg font-semibold"
              style={{ fontFamily: 'NotoNastaliqUrdu' }}
            >
              لاگ ان
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
```

- [ ] Commit:

```bash
git add apps/partner/app/(auth)/
git commit -m "feat(partner): auth layout and Urdu login screen"
```

---

## Task 9: App tabs layout + stub screens

**Files:**
- Create: `apps/partner/app/(app)/_layout.tsx`
- Create: `apps/partner/app/(app)/(jobs)/index.tsx`
- Create: `apps/partner/app/(app)/history/index.tsx`
- Create: `apps/partner/app/(app)/earnings/index.tsx`

- [ ] Create `apps/partner/app/(app)/_layout.tsx`:

```typescript
import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function TabLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontFamily: 'NotoNastaliqUrdu', fontSize: 11 }}>
      {label}
    </Text>
  )
}

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="(jobs)"
        options={{ tabBarLabel: () => <TabLabel label="کام" /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ tabBarLabel: () => <TabLabel label="تاریخ" /> }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ tabBarLabel: () => <TabLabel label="کمائی" /> }}
      />
    </Tabs>
  )
}
```

- [ ] Create `apps/partner/app/(app)/(jobs)/index.tsx`:

```typescript
import { View, Text } from 'react-native'

export default function JobsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text
        className="text-xl text-gray-400"
        style={{ fontFamily: 'NotoNastaliqUrdu' }}
      >
        کوئی کام نہیں
      </Text>
    </View>
  )
}
```

- [ ] Create `apps/partner/app/(app)/history/index.tsx`:

```typescript
import { View, Text } from 'react-native'

export default function HistoryScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text
        className="text-xl text-gray-400"
        style={{ fontFamily: 'NotoNastaliqUrdu' }}
      >
        کوئی تاریخ نہیں
      </Text>
    </View>
  )
}
```

- [ ] Create `apps/partner/app/(app)/earnings/index.tsx`:

```typescript
import { View, Text } from 'react-native'

export default function EarningsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text
        className="text-xl text-gray-400"
        style={{ fontFamily: 'NotoNastaliqUrdu' }}
      >
        کوئی کمائی نہیں
      </Text>
    </View>
  )
}
```

- [ ] Commit:

```bash
git add apps/partner/app/(app)/
git commit -m "feat(partner): app tabs layout and stub screens (Jobs, History, Earnings)"
```

---

## Task 10: API — POST /partners/login

**Files:**
- Create: `apps/api/src/routes/partners/index.ts`
- Modify: `apps/api/package.json`

- [ ] Install bcryptjs in API:

```bash
cd /Users/sikanderahmed/Documents/dev_projects/safainow/apps/api
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

- [ ] Create `apps/api/src/routes/partners/index.ts`:

```typescript
import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { supabase } from '../../lib/supabase.js'

const partners: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /partners/login
   * No auth required — this IS the login endpoint.
   * Body: { phone: string, passcode: string }
   */
  fastify.post('/login', async (request, reply) => {
    const { phone, passcode } = request.body as { phone: string; passcode: string }

    if (!phone || !passcode) {
      return reply.badRequest('phone and passcode are required')
    }

    // 1. Look up partner by phone
    const { data: partner, error } = await supabase
      .from('partners')
      .select('id, full_name, phone, passcode_hash, is_active, profile_picture_url')
      .eq('phone', phone.trim())
      .single()

    if (error || !partner) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })
    }

    // 2. Check if suspended
    if (!partner.is_active) {
      return reply.code(403).send({ error: 'ACCOUNT_SUSPENDED' })
    }

    // 3. Verify passcode
    const valid = await bcrypt.compare(passcode, partner.passcode_hash ?? '')
    if (!valid) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })
    }

    // 4. Sign in via Supabase Auth using the phone@safainow.local hack
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${phone.trim()}@safainow.local`,
      password: passcode,
    })

    if (authError || !authData.session) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })
    }

    return reply.send({
      session: authData.session,
      partner: {
        id: partner.id,
        name: partner.full_name,
        phone: partner.phone,
        profile_picture_url: partner.profile_picture_url,
      },
    })
  })
}

export default partners
```

- [ ] Verify the autoload picks up the new route. Check `apps/api/src/app.ts` to confirm `@fastify/autoload` scans the routes directory — it should load `partners/index.ts` automatically as `/partners`.

- [ ] Commit:

```bash
git add apps/api/src/routes/partners/index.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): POST /partners/login with bcrypt verification and Supabase session"
```

---

## Task 11: Admin — service-role Supabase client

**Files:**
- Create: `apps/admin/src/lib/supabase/admin.ts`
- Modify: `apps/admin/.env.local`

- [ ] Add `SUPABASE_SECRET_KEY` to `apps/admin/.env.local`:

```
SUPABASE_SECRET_KEY=<your service role key from Supabase dashboard → Settings → API>
```

- [ ] Create `apps/admin/src/lib/supabase/admin.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@safainow/types'

/**
 * Service-role Supabase client — never expose to the browser.
 * Used only in server actions for admin auth operations (createUser, updateUser).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

- [ ] Commit:

```bash
git add apps/admin/src/lib/supabase/admin.ts
git commit -m "feat(admin): add service-role Supabase admin client"
```

---

## Task 12: Admin — createPartner creates Supabase Auth user

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/dashboard/partners/actions.ts`

- [ ] Update `createPartner` in `actions.ts`. After the successful `.insert()` call, add auth user creation:

Replace the existing `createPartner` function with:

```typescript
export async function createPartner(formData: FormData) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const cnicNumber = (formData.get('cnic_number') as string) || null

  const profileFile = formData.get('profile_picture') as File | null
  const cnicFile = formData.get('cnic_picture') as File | null

  let profilePictureUrl: string | null = null
  let cnicPictureUrl: string | null = null

  try {
    if (profileFile && profileFile.size > 0) {
      profilePictureUrl = await uploadFile(supabase, profileFile, 'profile')
    }
    if (cnicFile && cnicFile.size > 0) {
      cnicPictureUrl = await uploadFile(supabase, cnicFile, 'cnic')
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }

  const passcode = generatePasscode()
  const passcodeHash = await bcrypt.hash(passcode, 12)

  // Create Supabase Auth user first to get auth_user_id
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email: `${phone.trim()}@safainow.local`,
    password: passcode,
    email_confirm: true,
  })

  if (authError) {
    return { error: authError.message }
  }

  const { data, error } = await supabase
    .from('partners')
    .insert({
      full_name: fullName,
      phone,
      passcode_hash: passcodeHash,
      cnic_number: cnicNumber,
      profile_picture_url: profilePictureUrl,
      cnic_picture_url: cnicPictureUrl,
      auth_user_id: authUser.user.id,
    })
    .select('id')
    .single()

  if (error) {
    // Clean up auth user if DB insert fails
    await adminSupabase.auth.admin.deleteUser(authUser.user.id)
    return { error: error.message }
  }

  revalidatePath('/dashboard/partners')
  return { partnerId: data.id, passcode }
}
```

- [ ] Add the import at the top of `actions.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
```

- [ ] Commit:

```bash
git add apps/admin/src/app/(dashboard)/dashboard/partners/actions.ts
git commit -m "feat(admin): createPartner now creates Supabase Auth user for partner login"
```

---

## Task 13: Admin — resetPasscode updates Supabase Auth user

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/dashboard/partners/actions.ts`

- [ ] Update `resetPasscode` in `actions.ts`:

Replace the existing `resetPasscode` function with:

```typescript
export async function resetPasscode(id: string) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const passcode = generatePasscode()
  const passcodeHash = await bcrypt.hash(passcode, 12)

  // Get partner's auth_user_id
  const { data: partner, error: fetchError } = await supabase
    .from('partners')
    .select('auth_user_id')
    .eq('id', id)
    .single()

  if (fetchError || !partner) {
    return { error: 'Partner not found' }
  }

  // Update DB passcode hash
  const { error } = await supabase
    .from('partners')
    .update({ passcode_hash: passcodeHash })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  // Update Supabase Auth password if auth_user_id exists
  if (partner.auth_user_id) {
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      partner.auth_user_id,
      { password: passcode }
    )
    if (authError) {
      return { error: authError.message }
    }
  }

  revalidatePath(`/dashboard/partners/${id}`)
  return { passcode }
}
```

- [ ] Commit:

```bash
git add apps/admin/src/app/(dashboard)/dashboard/partners/actions.ts
git commit -m "feat(admin): resetPasscode now syncs Supabase Auth user password"
```

---

## Task 14: Type check + RLS policy for partners.auth_user_id

**Files:**
- Create: `supabase/migrations/20260401000001_partners_rls_auth_user_id.sql`

- [ ] Partners RLS currently uses `authenticated` role. The partner app needs to read its own row via `auth_user_id`. Create migration:

```sql
-- Allow partners to read their own row using auth_user_id
CREATE POLICY "Partners can read own profile"
  ON public.partners
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());
```

- [ ] Push migration:

```bash
supabase db push
```

- [ ] Run type checks on all apps:

```bash
cd /Users/sikanderahmed/Documents/dev_projects/safainow
pnpm --filter partner exec tsc --noEmit
pnpm --filter api exec tsc --noEmit 2>/dev/null || cd apps/api && npm run build:ts
pnpm --filter admin exec tsc --noEmit
```

Expected: zero errors on all three.

- [ ] Commit:

```bash
git add supabase/migrations/20260401000001_partners_rls_auth_user_id.sql
git commit -m "feat(db): add RLS policy for partners to read own profile via auth_user_id"
```

---

## Task 15: Final verification

- [ ] Start the API:

```bash
pnpm --filter api dev
```

- [ ] Start the partner app with cache cleared:

```bash
cd /Users/sikanderahmed/Documents/dev_projects/safainow/apps/partner
npx expo start --clear
```

- [ ] Open in Expo Go — verify:
  1. App loads (Urdu font visible, RTL layout)
  2. Login screen shows in Urdu
  3. Enter a valid partner phone + passcode → navigates to Jobs tab showing "کوئی کام نہیں"
  4. Kill and reopen app → session persists, goes straight to Jobs tab (not login)
  5. Enter wrong passcode → alert shows in Urdu
  6. Enter suspended partner → alert shows in Urdu

- [ ] Create a new partner in the admin dashboard → check Supabase Auth dashboard (Authentication → Users) — new user `{phone}@safainow.local` should appear.

- [ ] Update `tasks/todo.md` — mark all Sprint 3A tasks complete.

- [ ] Final commit:

```bash
git add tasks/todo.md
git commit -m "chore: mark Sprint 3A tasks complete in todo.md"
```

---

## Notes

- The DB column is `full_name` (confirmed from admin form). Task 10 uses `full_name` correctly.
- If font download URL is broken, download `NotoNastaliqUrdu-Regular.ttf` manually from fonts.google.com/specimen/Noto+Nastaliq+Urdu and place in `assets/fonts/`.
- The `expo-splash-screen` import in Task 7 — if it's not in partner app deps, run `npx expo install expo-splash-screen` from inside `apps/partner`.
