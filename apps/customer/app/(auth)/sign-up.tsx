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
import * as Linking from 'expo-linking'
import { supabase } from '@/lib/supabase'

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')

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
        // Deep-link back into this app after email confirmation.
        // Prevents Supabase from falling back to the project's Site URL
        // (which is the admin dashboard).
        emailRedirectTo: Linking.createURL('/'),
      },
    })
    setLoading(false)

    if (error) {
      Alert.alert('Sign Up Failed', error.message)
      return
    }

    // Show the "check your email" screen
    setConfirmedEmail(email.trim())
  }

  // ── Success state ──────────────────────────────────────────────────
  if (confirmedEmail) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Text className="text-4xl">📧</Text>
        </View>
        <Text className="mb-3 text-center text-2xl font-bold text-gray-900">
          Check your email
        </Text>
        <Text className="mb-2 text-center text-base text-gray-500">
          We sent a confirmation link to:
        </Text>
        <Text className="mb-8 text-center text-base font-semibold text-gray-900">
          {confirmedEmail}
        </Text>
        <Text className="mb-10 text-center text-sm text-gray-400">
          Tap the link in the email to activate your account, then come back and sign in.
        </Text>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity className="w-full items-center rounded-xl bg-gray-900 py-4">
            <Text className="text-base font-semibold text-white">Go to Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    )
  }

  // ── Sign-up form ───────────────────────────────────────────────────
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
