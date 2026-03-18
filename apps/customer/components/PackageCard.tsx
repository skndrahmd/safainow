import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type PackageType = 'cleaning' | 'standalone' | 'custom'

interface PackageCardProps {
  id: string
  name: string
  description: string
  price: number
  type: PackageType
  onPress: () => void      // tap card body → package detail page
  onQuickAdd: () => void   // tap + button → add to cart (stay on screen)
}

const TYPE_BADGE: Record<PackageType, { label: string; className: string }> = {
  cleaning: { label: 'Cleaning', className: 'bg-gray-900' },
  standalone: { label: 'Standalone', className: 'bg-gray-600' },
  custom: { label: 'Build Your Own', className: 'bg-gray-400' },
}

export default function PackageCard({
  name,
  description,
  price,
  type,
  onPress,
  onQuickAdd,
}: PackageCardProps) {
  const badge = TYPE_BADGE[type]

  return (
    <TouchableOpacity
      className="mb-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Badge row */}
      <View className="mb-3">
        <View className={`self-start rounded-full px-3 py-1 ${badge.className}`}>
          <Text className="text-xs font-semibold text-white">{badge.label}</Text>
        </View>
      </View>

      {/* Name */}
      <Text className="mb-1 text-lg font-bold text-gray-900">{name}</Text>

      {/* Description */}
      <Text className="mb-4 text-sm leading-5 text-gray-500" numberOfLines={2}>
        {description}
      </Text>

      {/* Price row — price left, + button right (hidden for custom) */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900">Rs {price.toLocaleString()}</Text>
        {type !== 'custom' && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation()
              onQuickAdd()
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-9 w-9 items-center justify-center rounded-full bg-gray-900"
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}
