import { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'
import UrduText from '@/components/UrduText'

const API_URL = process.env.EXPO_PUBLIC_API_URL!

async function registerExpoPushToken(accessToken: string): Promise<void> {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId

    if (!projectId) {
      console.warn('No EAS project ID found — push token skipped')
      return
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })

    await fetch(`${API_URL}/partners/me/expo-token`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ expoPushToken: tokenData.data }),
    })
  } catch (err) {
    // Non-critical — don't block login
    console.warn('Push token registration failed:', err)
  }
}

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

      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      // Register Expo push token (non-blocking)
      registerExpoPushToken(data.session.access_token)
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
        <UrduText className="text-3xl font-bold text-center mb-2" style={{ fontSize: 30 }}>
          صفائی ناؤ
        </UrduText>
        <UrduText className="text-lg text-gray-500 text-center mb-10" style={{ fontSize: 18 }}>
          پارٹنر لاگ ان
        </UrduText>

        <UrduText className="text-sm text-gray-600 mb-1 text-right" style={{ fontSize: 14 }}>
          فون نمبر
        </UrduText>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base text-right"
          placeholder="03001234567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <UrduText className="text-sm text-gray-600 mb-1 text-right" style={{ fontSize: 14 }}>
          پاس کوڈ
        </UrduText>
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
            <UrduText className="text-white text-lg font-semibold" style={{ fontSize: 18 }}>
              لاگ ان
            </UrduText>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
