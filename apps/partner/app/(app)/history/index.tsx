import { View, Text } from 'react-native'

export default function HistoryScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text
        className="text-xl text-gray-400"
        style={{ fontFamily: 'NotoNastaliqUrdu' }}
      >
        کوئی تاریخ نہیں
      </Text>
    </View>
  )
}
