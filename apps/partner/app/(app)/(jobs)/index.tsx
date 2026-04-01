import { View } from 'react-native'
import UrduText from '@/components/UrduText'

export default function JobsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <UrduText className="text-xl text-gray-400" style={{ fontSize: 20 }}>
        کوئی کام نہیں
      </UrduText>
    </View>
  )
}
