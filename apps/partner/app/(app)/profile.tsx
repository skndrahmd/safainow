import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import UrduText from '@/components/UrduText'

export default function ProfileScreen() {
  const { partner, signOut } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  async function handleLogout() {
    Alert.alert(
      'لاگ آؤٹ',
      'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟',
      [
        { text: 'نہیں', style: 'cancel' },
        {
          text: 'ہاں',
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/(auth)/login')
          },
        },
      ],
    )
  }

  if (!partner) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <View
      className="flex-1 bg-white px-4"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <UrduText className="text-2xl font-bold text-center mb-6" style={{ fontSize: 24 }}>
        پروفائل
      </UrduText>

      {/* Profile Card */}
      <View className="bg-gray-50 rounded-xl p-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <UrduText className="text-base text-gray-600" style={{ fontSize: 14 }}>
            نام
          </UrduText>
          <UrduText className="text-lg text-gray-900" style={{ fontSize: 18 }}>
            {partner.full_name}
          </UrduText>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <UrduText className="text-base text-gray-600" style={{ fontSize: 14 }}>
            فون نمبر
          </UrduText>
          <Text className="text-lg text-gray-900" style={{ fontSize: 18, writingDirection: 'ltr' }}>
            {partner.phone}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <UrduText className="text-base text-gray-600" style={{ fontSize: 14 }}>
            سی این سی
          </UrduText>
          <Text className="text-lg text-gray-900" style={{ fontSize: 18, writingDirection: 'ltr' }}>
            {partner.cnic_number || '-'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <UrduText className="text-base text-gray-600" style={{ fontSize: 14 }}>
            حیثیت
          </UrduText>
          <UrduText
            className="text-lg font-semibold"
            style={{
              fontSize: 16,
              color: partner.is_active ? '#16a34a' : '#dc2626',
            }}
          >
            {partner.is_active ? 'فعال' : 'معطل'}
          </UrduText>
        </View>
      </View>

      {/* Availability Card */}
      <View className="bg-blue-50 rounded-xl p-4 mb-6">
        <View className="flex-row justify-between items-center">
          <UrduText className="text-base text-gray-700" style={{ fontSize: 16 }}>
            دستیابی
          </UrduText>
          <UrduText
            className="text-base font-semibold"
            style={{
              fontSize: 16,
              color: partner.is_available ? '#16a34a' : '#dc2626',
            }}
          >
            {partner.is_available ? 'دست دستیہ ہے' : 'دست دستیہ نہیں'}
          </UrduText>
        </View>
        <UrduText className="text-sm text-gray-500 mt-1 text-right" style={{ fontSize: 12 }}>
          (ایڈمن کے ذریعے کنٹرول کیا جاتا ہے)
        </UrduText>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        className="bg-red-600 rounded-xl py-4 items-center mt-auto"
        onPress={handleLogout}
      >
        <UrduText className="text-white text-lg font-bold" style={{ fontSize: 18 }}>
          لاگ آؤٹ
        </UrduText>
      </TouchableOpacity>
    </View>
  )
}