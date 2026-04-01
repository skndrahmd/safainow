import { View } from 'react-native'
import UrduText from '@/components/UrduText'

export default function EarningsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <UrduText className="text-xl text-gray-400" style={{ fontSize: 20 }}>
        کوئی کمائی نہیں
      </UrduText>
    </View>
  )
}
