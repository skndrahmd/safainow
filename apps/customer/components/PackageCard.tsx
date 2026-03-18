import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type PackageType = 'cleaning' | 'standalone' | 'custom'

interface PackageCardProps {
  id: string
  name: string
  description: string
  price: number
  type: PackageType
  inCart: boolean
  onViewDetail: () => void  // eye icon (pre-built) or chevron (custom) → detail/builder page
  onQuickAdd: () => void    // + button → add to cart (pre-built only)
  onRemove: () => void      // checkmark button → remove from cart
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
  inCart,
  onViewDetail,
  onQuickAdd,
  onRemove,
}: PackageCardProps) {
  const badge = TYPE_BADGE[type]

  return (
    <View
      className={`mb-3 rounded-2xl border p-5 shadow-sm ${
        inCart ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'
      }`}
    >
      {/* Badge + detail icon row */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className={`rounded-full px-3 py-1 ${badge.className}`}>
          <Text className="text-xs font-semibold text-white">{badge.label}</Text>
        </View>
        <TouchableOpacity
          onPress={onViewDetail}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="rounded-full p-1"
        >
          <Ionicons
            name={type === 'custom' ? 'chevron-forward' : 'eye-outline'}
            size={20}
            color="#6b7280"
          />
        </TouchableOpacity>
      </View>

      {/* Name */}
      <Text className="mb-1 text-lg font-bold text-gray-900">{name}</Text>

      {/* Description */}
      <Text className="mb-4 text-sm leading-5 text-gray-500" numberOfLines={2}>
        {description}
      </Text>

      {/* Price row — price left, + button or checkmark right */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900">
          {type === 'custom' ? 'Variable cost' : `Rs ${price.toLocaleString()}`}
        </Text>
        {type !== 'custom' &&
          (inCart ? (
            <TouchableOpacity
              onPress={onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="h-9 w-9 items-center justify-center rounded-full bg-green-600"
            >
              <Ionicons name="checkmark" size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onQuickAdd}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-900"
            >
              <Ionicons name="add" size={20} color="#ffffff" />
            </TouchableOpacity>
          ))}
      </View>
    </View>
  )
}
