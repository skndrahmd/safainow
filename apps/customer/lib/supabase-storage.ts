import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Hybrid storage adapter for Supabase auth.
 * expo-secure-store is limited to 2048 bytes per value.
 * Supabase PKCE session tokens can exceed this limit.
 * Solution: use SecureStore for small values, AsyncStorage as fallback.
 */
export const SupabaseStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    // Try SecureStore first
    try {
      const value = await SecureStore.getItemAsync(key)
      if (value !== null) return value
    } catch {
      // SecureStore failed — value was stored in AsyncStorage as fallback
    }
    return AsyncStorage.getItem(key)
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= 2000) {
      // Small enough for SecureStore (2000 not 2048 for safety margin)
      try {
        await SecureStore.setItemAsync(key, value)
        return
      } catch {
        // Fall through to AsyncStorage
      }
    }
    // Large value (e.g. PKCE session) — use AsyncStorage
    await AsyncStorage.setItem(key, value)
  },

  async removeItem(key: string): Promise<void> {
    // Remove from both — we don't know where it was stored
    await Promise.allSettled([
      SecureStore.deleteItemAsync(key),
      AsyncStorage.removeItem(key),
    ])
  },
}
