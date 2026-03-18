# Sprint 2B: Customer App Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up expo-router v4 navigation, update the Supabase client to use a secure storage adapter, and build working sign-in + sign-up screens with an auth guard so the app redirects correctly based on session state.

**Architecture:** expo-router v4 file-based routing with a `Stack.Protected` auth guard in the root layout. AuthProvider wraps the app and exposes `session` + `isLoading`. Auth screens live in `app/(auth)/`, the main app (tabs) in `app/(app)/`. Google OAuth uses expo-web-browser + supabase.auth.signInWithOAuth with `skipBrowserRedirect: true`.

**Tech Stack:** expo-router v4, expo-secure-store, @react-native-async-storage/async-storage, expo-web-browser, expo-auth-session, @expo/vector-icons, @supabase/supabase-js v2, NativeWind v5

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `apps/customer/package.json` | Modify | Change `"main"` to `"expo-router/entry"` |
| `apps/customer/app.json` | Modify | Add scheme, expo-router plugin, typedRoutes |
| `apps/customer/tsconfig.json` | Modify | Add `@/*` path alias |
| `apps/customer/lib/supabase-storage.ts` | Create | Hybrid SecureStore/AsyncStorage adapter |
| `apps/customer/lib/supabase.ts` | Modify | Use new adapter, add AppState listener |
| `apps/customer/lib/auth.tsx` | Create | AuthProvider + useAuth hook |
| `apps/customer/app/_layout.tsx` | Create | Root layout: AuthProvider + Stack.Protected guard |
| `apps/customer/app/(auth)/_layout.tsx` | Create | Stack layout for auth screens |
| `apps/customer/app/(auth)/sign-in.tsx` | Create | Sign-in screen (email/password + Google) |
| `apps/customer/app/(auth)/sign-up.tsx` | Create | Sign-up screen (name, email, password) |
| `apps/customer/app/(app)/_layout.tsx` | Create | Tab bar: Home, Bookings, Profile |
| `apps/customer/app/(app)/(home)/_layout.tsx` | Create | Stack layout for home tab |
| `apps/customer/app/(app)/(home)/index.tsx` | Create | Home tab stub (replaced in Sprint 2C) |
| `apps/customer/app/(app)/bookings/index.tsx` | Create | Bookings tab stub (replaced in Sprint 2E) |
| `apps/customer/app/(app)/profile/index.tsx` | Create | Profile tab stub (replaced in Sprint 2F) |

---

## Chunk 1: Install Dependencies + Config

### Task 1: Install expo-router and auth packages

- [ ] **Step 1: Install expo-router and its peer dependencies**

Run from the monorepo root (pnpm filter runs npx expo install inside the app):

```bash
cd /Users/sikanderahmed/Documents/dev_projects/safainow/apps/customer
npx expo install expo-router react-native-screens expo-linking expo-constants expo-status-bar
```

Expected: packages added to `apps/customer/package.json`, no errors.

- [ ] **Step 2: Install secure storage packages**

```bash
npx expo install expo-secure-store @react-native-async-storage/async-storage
```

- [ ] **Step 3: Install Google OAuth packages**

```bash
npx expo install expo-web-browser expo-auth-session
```

- [ ] **Step 4: Install icons (if not already present)**

```bash
npx expo install @expo/vector-icons
```

- [ ] **Step 5: Return to monorepo root and install all workspace deps**

```bash
cd /Users/sikanderahmed/Documents/dev_projects/safainow
pnpm install
```

---

### Task 2: Update package.json main entry

**Files:**
- Modify: `apps/customer/package.json`

- [ ] **Step 1: Change the `"main"` field**

Open `apps/customer/package.json` and change:
```json
"main": "index.ts"
```
to:
```json
"main": "expo-router/entry"
```

The old `index.ts` (registerRootComponent) and `App.tsx` are no longer used once expo-router takes over. They can be deleted after verifying the app boots.

---

### Task 3: Update app.json

**Files:**
- Modify: `apps/customer/app.json`

- [ ] **Step 1: Add scheme, expo-router plugin, typedRoutes, and location/image permissions**

Replace the entire `app.json` with:

```json
{
  "expo": {
    "name": "customer",
    "slug": "customer",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "scheme": "safainow-customer",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "SafaiNow needs your location to find nearby cleaners.",
        "NSPhotoLibraryUsageDescription": "SafaiNow needs access to your photos to upload a profile picture."
      }
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false,
      "permissions": [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.READ_MEDIA_IMAGES"
      ]
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

---

### Task 4: Update tsconfig.json with path alias

**Files:**
- Modify: `apps/customer/tsconfig.json`

- [ ] **Step 1: Add `@/*` alias and include expo-router types**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "nativewind-env.d.ts",
    ".expo/types/**/*.d.ts"
  ]
}
```

---

## Chunk 2: Supabase Client Update

### Task 5: Create hybrid storage adapter

**Files:**
- Create: `apps/customer/lib/supabase-storage.ts`

expo-secure-store has a 2048-byte value limit. Supabase PKCE session objects can exceed this. This adapter stores small values in SecureStore and falls back to AsyncStorage for large values.

- [ ] **Step 1: Write the adapter**

```typescript
// apps/customer/lib/supabase-storage.ts
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Hybrid storage adapter for Supabase auth.
 * expo-secure-store is limited to 2048 bytes per value.
 * Supabase PKCE session tokens can exceed this limit.
 * Solution: use SecureStore for small values, AsyncStorage as fallback.
 */
export const SupabaseStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    // Try SecureStore first
    try {
      const value = await SecureStore.getItemAsync(key)
      if (value !== null) return value
    } catch {
      // SecureStore failed (value was stored in AsyncStorage as fallback)
    }
    // Fall back to AsyncStorage
    return AsyncStorage.getItem(key)
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= 2000) {
      // Small enough for SecureStore (using 2000 not 2048 for safety margin)
      try {
        await SecureStore.setItemAsync(key, value)
        return
      } catch {
        // Fall through to AsyncStorage
      }
    }
    // Large value (e.g. PKCE session) — use AsyncStorage
    await AsyncStorage.setItem(key, value)
  },

  async removeItem(key: string): Promise<void> {
    // Remove from both — we don't know where it was stored
    await Promise.allSettled([
      SecureStore.deleteItemAsync(key),
      AsyncStorage.removeItem(key),
    ])
  },
}
```

---

### Task 6: Update Supabase client

**Files:**
- Modify: `apps/customer/lib/supabase.ts`

- [ ] **Step 1: Replace the file with the updated client**

```typescript
// apps/customer/lib/supabase.ts
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
    detectSessionInUrl: false, // CRITICAL: window.location does not exist in React Native
  },
})

// Pause/resume token auto-refresh when app goes to background/foreground.
// This prevents unnecessary network requests while the app is backgrounded.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
```

---

## Chunk 3: Auth Provider + Navigation

### Task 7: Create AuthProvider

**Files:**
- Create: `apps/customer/lib/auth.tsx`

- [ ] **Step 1: Write the auth context**

```typescript
// apps/customer/lib/auth.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextValue {
  session: Session | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load the existing session from storage on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Keep session in sync whenever auth state changes
    // (sign in, sign out, token refresh, OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
```

---

### Task 8: Create root layout

**Files:**
- Create: `apps/customer/app/_layout.tsx`

Uses expo-router v4's `Stack.Protected` to gate routes by auth state. This is the recommended v4 pattern — cleaner than imperative `router.replace()` in useEffect.

- [ ] **Step 1: Write the root layout**

```typescript
// apps/customer/app/_layout.tsx
import '../global.css'
import { Stack } from 'expo-router'
import { AuthProvider, useAuth } from '@/lib/auth'

function RootLayoutNav() {
  const { session, isLoading } = useAuth()

  // Render nothing while auth state is loading to avoid
  // "navigation before mount" errors. Splash screen stays visible.
  if (isLoading) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Authenticated routes — only accessible when logged in */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      {/* Unauthenticated routes — only accessible when logged out */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Booking flow — modal stack, accessible when logged in */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="booking" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}
```

---

### Task 9: Create auth stack layout

**Files:**
- Create: `apps/customer/app/(auth)/_layout.tsx`

- [ ] **Step 1: Write the layout**

```typescript
// apps/customer/app/(auth)/_layout.tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

---

### Task 10: Create sign-in screen

**Files:**
- Create: `apps/customer/app/(auth)/sign-in.tsx`

- [ ] **Step 1: Write the sign-in screen**

```typescript
// apps/customer/app/(auth)/sign-in.tsx
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Link } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { supabase } from '@/lib/supabase'

// Required: closes the browser session if opened via OAuth redirect
WebBrowser.maybeCompleteAuthSession()

export default function SignInScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) Alert.alert('Sign In Failed', error.message)
    // On success: onAuthStateChange in AuthProvider updates session →
    // Stack.Protected redirects to (app) automatically
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      const redirectTo = AuthSession.makeRedirectUri({ scheme: 'safainow-customer' })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // CRITICAL: prevent Supabase opening browser itself
        },
      })

      if (error || !data.url) {
        Alert.alert('Google Sign In Failed', error?.message ?? 'Could not get OAuth URL')
        return
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        // Supabase returns tokens in hash fragment (#) for implicit flow
        const params = new URLSearchParams(
          url.hash ? url.hash.substring(1) : url.search.substring(1)
        )
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (access_token && refresh_token) {
          // Small delay prevents a known setSession hang in supabase-js
          setTimeout(async () => {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })
            if (sessionError) Alert.alert('Error', sessionError.message)
          }, 0)
        }
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-900">SafaiNow</Text>
          <Text className="mt-2 text-base text-gray-500">Sign in to your account</Text>
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Email</Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        {/* Password */}
        <View className="mb-6">
          <Text className="mb-1 text-sm font-medium text-gray-700">Password</Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          className="mb-4 items-center rounded-xl bg-gray-900 py-4"
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="mb-4 flex-row items-center gap-3">
          <View className="flex-1 border-t border-gray-200" />
          <Text className="text-sm text-gray-400">or</Text>
          <View className="flex-1 border-t border-gray-200" />
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          className="mb-8 items-center rounded-xl border border-gray-200 bg-white py-4"
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#374151" />
          ) : (
            <Text className="text-base font-medium text-gray-700">Continue with Google</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View className="flex-row justify-center">
          <Text className="text-sm text-gray-500">Don't have an account? </Text>
          <Link href="/(auth)/sign-up">
            <Text className="text-sm font-semibold text-gray-900">Sign Up</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
```

---

### Task 11: Create sign-up screen

**Files:**
- Create: `apps/customer/app/(auth)/sign-up.tsx`

- [ ] **Step 1: Write the sign-up screen**

```typescript
// apps/customer/app/(auth)/sign-up.tsx
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name.')
      return
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })
    setLoading(false)

    if (error) {
      Alert.alert('Sign Up Failed', error.message)
      return
    }

    // Supabase triggers the customer auto-creation trigger (Sprint 2A).
    // onAuthStateChange fires → AuthProvider updates session →
    // Stack.Protected redirects to (app) automatically.
    Alert.alert('Welcome!', 'Your account has been created.')
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-900">Create Account</Text>
          <Text className="mt-2 text-base text-gray-500">Join SafaiNow today</Text>
        </View>

        {/* Full Name */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Full Name</Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
            placeholder="Ali Hassan"
            placeholderTextColor="#9ca3af"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Email</Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        {/* Password */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Password</Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
            placeholder="Min. 6 characters"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        {/* Confirm Password */}
        <View className="mb-6">
          <Text className="mb-1 text-sm font-medium text-gray-700">Confirm Password</Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
            placeholder="Re-enter your password"
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          className="mb-8 items-center rounded-xl bg-gray-900 py-4"
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View className="flex-row justify-center">
          <Text className="text-sm text-gray-500">Already have an account? </Text>
          <Link href="/(auth)/sign-in">
            <Text className="text-sm font-semibold text-gray-900">Sign In</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
```

---

## Chunk 4: Tab Layout + Stub Screens

### Task 12: Create app tabs layout

**Files:**
- Create: `apps/customer/app/(app)/_layout.tsx`

- [ ] **Step 1: Write the tab bar**

```typescript
// apps/customer/app/(app)/_layout.tsx
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopColor: '#f3f4f6',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
```

---

### Task 13: Create home stack layout + stub

**Files:**
- Create: `apps/customer/app/(app)/(home)/_layout.tsx`
- Create: `apps/customer/app/(app)/(home)/index.tsx`

- [ ] **Step 1: Write the home stack layout**

```typescript
// apps/customer/app/(app)/(home)/_layout.tsx
import { Stack } from 'expo-router'

export default function HomeLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 2: Write the home stub screen**

```typescript
// apps/customer/app/(app)/(home)/index.tsx
import { View, Text } from 'react-native'

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-gray-900">Home</Text>
      <Text className="mt-1 text-sm text-gray-400">Packages coming in Sprint 2C</Text>
    </View>
  )
}
```

---

### Task 14: Create bookings + profile stub screens

**Files:**
- Create: `apps/customer/app/(app)/bookings/index.tsx`
- Create: `apps/customer/app/(app)/profile/index.tsx`

- [ ] **Step 1: Write the bookings stub**

```typescript
// apps/customer/app/(app)/bookings/index.tsx
import { View, Text } from 'react-native'

export default function BookingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-gray-900">Bookings</Text>
      <Text className="mt-1 text-sm text-gray-400">Coming in Sprint 2E</Text>
    </View>
  )
}
```

- [ ] **Step 2: Write the profile stub**

```typescript
// apps/customer/app/(app)/profile/index.tsx
import { View, Text, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white gap-4">
      <Text className="text-lg font-semibold text-gray-900">Profile</Text>
      <Text className="text-sm text-gray-400">Coming in Sprint 2F</Text>
      <TouchableOpacity
        className="rounded-xl bg-gray-900 px-6 py-3"
        onPress={() => supabase.auth.signOut()}
      >
        <Text className="text-sm font-semibold text-white">Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}
```

The sign-out button here is intentional — it lets us manually test the auth guard during Sprint 2B verification.

---

## Chunk 5: Verify

### Task 15: TypeScript check + manual verification

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/sikanderahmed/Documents/dev_projects/safainow
pnpm --filter customer exec tsc --noEmit
```

Expected: no errors. Fix any type errors before proceeding.

- [ ] **Step 2: Start the app**

```bash
pnpm --filter customer dev
```

Scan the QR code with Expo Go or run on a simulator.

- [ ] **Step 3: Verify auth flow**

1. App opens → sign-in screen shown (not logged in)
2. Tap "Sign Up" → sign-up screen
3. Create a new account → redirected to Home tab (Stack.Protected fires)
4. Check Supabase dashboard → new row in `auth.users` AND `customers` table (trigger from Sprint 2A)
5. Tap "Sign Out" on Profile tab → redirected back to sign-in screen
6. Sign in with the account just created → redirected to Home tab

- [ ] **Step 4: Commit**

```bash
git add apps/customer/
git commit -m "$(cat <<'EOF'
feat(customer): Sprint 2B — expo-router v4, auth screens, tab navigation

- expo-router v4 with Stack.Protected auth guard
- Hybrid SecureStore/AsyncStorage adapter for Supabase (2048-byte fix)
- AuthProvider with session persistence and AppState refresh listener
- Sign-in screen: email/password + Google OAuth
- Sign-up screen: name, email, password
- Tab bar: Home, Bookings, Profile (stubs for 2C–2F)
- app.json: scheme, permissions, expo-router plugin, typedRoutes
- tsconfig: @/* path alias

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Verification Checklist

- [ ] `pnpm --filter customer exec tsc --noEmit` → clean
- [ ] App launches without crashing
- [ ] Sign-up creates user in Supabase → `auth.users` + `customers` rows both exist
- [ ] Auth guard redirects unauthenticated users to sign-in
- [ ] Auth guard redirects authenticated users to home tab
- [ ] Sign-out works and redirects back to sign-in
- [ ] Tab bar shows Home / Bookings / Profile with icons
