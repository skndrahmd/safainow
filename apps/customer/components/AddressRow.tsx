import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ADDRESS_LABEL } from '@safainow/constants'

const LABEL_ICON: Record<string, string> = {
  [ADDRESS_LABEL.HOME]: 'home-outline',
  [ADDRESS_LABEL.WORK]: 'briefcase-outline',
  [ADDRESS_LABEL.PARENTS_HOUSE]: 'people-outline',
  [ADDRESS_LABEL.OTHER]: 'location-outline',
}

const LABEL_TEXT: Record<string, string> = {
  [ADDRESS_LABEL.HOME]: 'Home',
  [ADDRESS_LABEL.WORK]: 'Work',
  [ADDRESS_LABEL.PARENTS_HOUSE]: "Parents'",
  [ADDRESS_LABEL.OTHER]: 'Other',
}

interface AddressRowProps {
  id: string
  addressText: string
  label: string
  customLabel: string | null
  isDefault: boolean
  defaultLoading?: boolean
  onPress?: () => void
  onSetDefault?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function AddressRow({
  addressText,
  label,
  customLabel,
  isDefault,
  defaultLoading,
  onPress,
  onSetDefault,
  onEdit,
  onDelete,
}: AddressRowProps) {
  const iconName = LABEL_ICON[label] ?? 'location-outline'
  const labelText = customLabel || LABEL_TEXT[label] || 'Address'

  return (
    <View className="flex-row items-center border-b border-gray-100 py-4">
      {/* Star — set as default */}
      {onSetDefault && (
        <TouchableOpacity
          onPress={onSetDefault}
          disabled={defaultLoading || isDefault}
          hitSlop={8}
          className="mr-2 p-1"
        >
          {defaultLoading ? (
            <ActivityIndicator size="small" color="#f59e0b" />
          ) : (
            <Ionicons
              name={isDefault ? 'star' : 'star-outline'}
              size={20}
              color={isDefault ? '#f59e0b' : '#d1d5db'}
            />
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        className="flex-1 flex-row items-center"
      >
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons
            name={iconName as 'home-outline'}
            size={18}
            color="#374151"
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-gray-900">{labelText}</Text>
            {isDefault && (
              <View className="rounded-full bg-amber-100 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-amber-700">Default</Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={1}>
            {addressText}
          </Text>
        </View>
      </TouchableOpacity>

      {onEdit && (
        <TouchableOpacity onPress={onEdit} hitSlop={8} className="ml-2 p-1">
          <Ionicons name="create-outline" size={18} color="#6b7280" />
        </TouchableOpacity>
      )}
      {onDelete && (
        <TouchableOpacity onPress={onDelete} hitSlop={8} className="ml-2 p-1">
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      )}
    </View>
  )
}
