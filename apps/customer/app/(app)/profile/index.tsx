import { View, Text, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white">
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
