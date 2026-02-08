import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// We need to test storage.ts with different Platform.OS values
// We'll mock Platform directly

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('storage utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when Platform.OS is web', () => {
    beforeAll(() => {
      // @ts-ignore
      Platform.OS = 'web';
    });

    it('getItem should use AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-value');

      // Re-import to pick up platform mock
      jest.resetModules();
      const storage = require('../storage');

      const result = await storage.getItem('key');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('key');
    });

    it('setItem should use AsyncStorage', async () => {
      jest.resetModules();
      const storage = require('../storage');

      await storage.setItem('key', 'value');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('key', 'value');
    });

    it('deleteItem should use AsyncStorage', async () => {
      jest.resetModules();
      const storage = require('../storage');

      await storage.deleteItem('key');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('key');
    });
  });
});
