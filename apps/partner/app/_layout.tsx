import '../global.css'
import { useEffect, useRef } from 'react'
import { I18nManager, Platform } from 'react-native'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { AuthProvider, useAuth } from '@/lib/auth'

// Force RTL before any component renders
I18nManager.allowRTL(true)
I18nManager.forceRTL(true)

SplashScreen.preventAutoHideAsync()

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

function RootLayoutNav() {
  const { session, isLoading } = useAuth()
  const responseListener = useRef<Notifications.EventSubscription | null>(null)
  const receivedListener = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    // Handle notification received while app is in foreground
    receivedListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, string>
      if (data?.type === 'JOB_OFFER' && data?.bookingId) {
        // Show alert and navigate to job offer screen
        router.push(`/job-offer/${data.bookingId}`)
      }
    })

    // Handle tap on notification (when app was in background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string>
        if (data?.type === 'JOB_OFFER' && data?.bookingId) {
          router.push(`/job-offer/${data.bookingId}`)
        }
      }
    )

    // Handle app opened from killed state via notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return
      const data = response.notification.request.content.data as Record<string, string>
      if (data?.type === 'JOB_OFFER' && data?.bookingId) {
        router.push(`/job-offer/${data.bookingId}`)
      }
    })

    return () => {
      receivedListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  if (isLoading) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="job-offer" />
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

  // Set up Android notification channel
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('job-offers', {
        name: 'Job Offers',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
      })
    }
  }, [])

  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
