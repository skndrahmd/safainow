import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type PackageType = 'cleaning' | 'standalone' | 'custom'

interface PackageCardProps {
  id: string
  name: string
  description: string
  price: number
  type: PackageType
  onPress: () => void       // tap card body → booking flow (Sprint 2D)
  onViewDetail: () => void  // tap eye icon → package detail page
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
  onViewDetail,
}: PackageCardProps) {
  const badge = TYPE_BADGE[type]

  return (
    <TouchableOpacity
      className="mb-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Badge + eye icon row */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className={`rounded-full px-3 py-1 ${badge.className}`}>
          <Text className="text-xs font-semibold text-white">{badge.label}</Text>
        </View>
        {/* Eye icon — separate touch target, does not bubble to card press */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation()
            onViewDetail()
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="rounded-full p-1"
        >
          <Ionicons name="eye-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Name */}
      <Text className="mb-1 text-lg font-bold text-gray-900">{name}</Text>

      {/* Description */}
      <Text className="mb-4 text-sm leading-5 text-gray-500" numberOfLines={2}>
        {description}
      </Text>

      {/* Price */}
      <Text className="text-base font-semibold text-gray-900">Rs {price.toLocaleString()}</Text>
    </TouchableOpacity>
  )
}
