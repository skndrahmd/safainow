import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const SupabaseStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key)
      if (value !== null) return value
    } catch {
      // Fall through to AsyncStorage
    }
    return AsyncStorage.getItem(key)
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= 2000) {
      try {
        await SecureStore.setItemAsync(key, value)
        return
      } catch {
        // Fall through to AsyncStorage
      }
    }
    await AsyncStorage.setItem(key, value)
  },

  async removeItem(key: string): Promise<void> {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(key),
      AsyncStorage.removeItem(key),
    ])
  },
}
