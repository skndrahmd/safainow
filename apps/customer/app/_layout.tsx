import '../global.css'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/lib/auth'
import { BookingFlowProvider } from '@/context/booking-flow'

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
    <SafeAreaProvider>
      <AuthProvider>
        <BookingFlowProvider>
          <RootLayoutNav />
        </BookingFlowProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
