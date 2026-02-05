/**
 * Cross-platform storage utility
 * Uses SecureStore on native, AsyncStorage on web
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Only import SecureStore on native platforms
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  // Dynamic import for native only
  SecureStore = require('expo-secure-store');
}

/**
 * Get an item from storage
 * Uses SecureStore on native (iOS/Android), AsyncStorage on web
 */
export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }
  return null;
}

/**
 * Set an item in storage
 * Uses SecureStore on native (iOS/Android), AsyncStorage on web
 */
export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
  }
}

/**
 * Delete an item from storage
 * Uses SecureStore on native (iOS/Android), AsyncStorage on web
 */
export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
  }
}
