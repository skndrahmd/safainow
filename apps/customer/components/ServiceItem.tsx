import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ServiceItemProps {
  name: string
  price: number
  selected: boolean
  onToggle: () => void
}

export default function ServiceItem({ name, price, selected, onToggle }: ServiceItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between px-4 py-4"
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View className="flex-1 flex-row items-center gap-3 pr-4">
        <View
          className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
            selected ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'
          }`}
        >
          {selected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
        </View>
        <Text className="flex-1 text-base text-gray-900">{name}</Text>
      </View>
      <Text className="text-sm font-medium text-gray-500">Rs {price.toLocaleString()}</Text>
    </TouchableOpacity>
  )
}
