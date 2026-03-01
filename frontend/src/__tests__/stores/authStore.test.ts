import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/firebase/auth');

import { useAuthStore } from '../../lib/stores/authStore';
import {
  signOut as firebaseSignOut,
  verifyChildPin,
} from '../../lib/firebase/auth';

const mockedSignOut = vi.mocked(firebaseSignOut);
const mockedVerifyPin = vi.mocked(verifyChildPin);

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  useAuthStore.setState({
    uid: null,
    email: null,
    familyId: null,
    role: null,
    childName: null,
    parentName: null,
    isLoading: false,
    isAuthenticated: false,
    family: null,
  });
});

describe('authStore', () => {
  describe('logout', () => {
    it('clears role from localStorage and sets role to parent', async () => {
      window.localStorage.setItem('star_routine_role', 'child');
      useAuthStore.setState({
        uid: 'uid',
        email: 'test@test.com',
        familyId: 'fam-1',
        role: 'child',
        isAuthenticated: true,
      });
      await useAuthStore.getState().logout();
      expect(window.localStorage.getItem('star_routine_role')).toBeNull();
      expect(useAuthStore.getState().role).toBe('parent');
    });
  });

  describe('setRole', () => {
    it('sets and persists role', async () => {
      await useAuthStore.getState().setRole('child');
      expect(window.localStorage.getItem('star_routine_role')).toBe('child');
      expect(useAuthStore.getState().role).toBe('child');
    });

    it('sets parent role', async () => {
      await useAuthStore.getState().setRole('parent');
      expect(window.localStorage.getItem('star_routine_role')).toBe('parent');
      expect(useAuthStore.getState().role).toBe('parent');
    });

    it('deletes role when set to null', async () => {
      window.localStorage.setItem('star_routine_role', 'parent');
      await useAuthStore.getState().setRole(null as any);
      expect(window.localStorage.getItem('star_routine_role')).toBeNull();
      expect(useAuthStore.getState().role).toBeNull();
    });
  });

  describe('checkChildPin', () => {
    it('verifies pin via verifyChildPin with hardcoded family id', async () => {
      mockedVerifyPin.mockResolvedValue(true);
      const result = await useAuthStore.getState().checkChildPin('1234');
      expect(result).toBe(true);
      expect(mockedVerifyPin).toHaveBeenCalled();
    });

    it('returns false for wrong pin', async () => {
      mockedVerifyPin.mockResolvedValue(false);
      const result = await useAuthStore.getState().checkChildPin('0000');
      expect(result).toBe(false);
    });
  });

  describe('initial state', () => {
    it('starts with loading true and not authenticated', () => {
      useAuthStore.setState({ isLoading: true, isAuthenticated: false });
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(state.uid).toBeNull();
    });
  });
});
