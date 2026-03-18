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

// Required: closes the browser session if app was opened via OAuth redirect
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
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
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
