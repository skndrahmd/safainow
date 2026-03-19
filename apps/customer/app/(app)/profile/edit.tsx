import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function EditProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!session?.user.id) return
    supabase
      .from('customers')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name)
          setPhone(data.phone ?? '')
          setAvatarUrl(data.profile_picture_url)
        }
        setLoading(false)
      })
  }, [session?.user.id])

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })

    if (result.canceled || !result.assets[0].base64) return

    const asset = result.assets[0]
    setUploading(true)
    try {
      const fileExt = asset.uri.split('.').pop() ?? 'jpg'
      const filePath = `${session!.user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('customer-avatars')
        .upload(filePath, decode(asset.base64!), {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('customer-avatars')
        .getPublicUrl(filePath)

      // Append cache-buster so the image refreshes
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
    } catch {
      Alert.alert('Error', 'Could not upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const canSave = fullName.trim().length >= 2

  const handleSave = async () => {
    if (!session?.user.id) return
    setSaving(true)
    const { error } = await supabase
      .from('customers')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        profile_picture_url: avatarUrl,
      })
      .eq('id', session.user.id)
    setSaving(false)
    if (error) {
      Alert.alert('Error', 'Could not update profile.')
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
        <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <TouchableOpacity onPress={pickImage} disabled={uploading} className="mb-6 items-center">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-24 w-24 rounded-full" />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="person" size={40} color="#9ca3af" />
            </View>
          )}
          <View className="mt-2 flex-row items-center gap-1">
            {uploading ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={16} color="#6b7280" />
                <Text className="text-sm font-medium text-gray-500">Change Photo</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Full name */}
        <Text className="mb-2 text-sm font-semibold text-gray-700">Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          placeholderTextColor="#9ca3af"
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
        />

        {/* Phone */}
        <Text className="mb-2 mt-5 text-sm font-semibold text-gray-700">Phone Number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="03XX-XXXXXXX"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
        />

        {/* Email (read-only) */}
        <Text className="mb-2 mt-5 text-sm font-semibold text-gray-700">Email</Text>
        <View className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <Text className="text-base text-gray-400">{session?.user.email ?? ''}</Text>
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Save footer */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 pb-8 pt-4">
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${canSave ? 'bg-gray-900' : 'bg-gray-200'}`}
          disabled={!canSave || saving || uploading}
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
