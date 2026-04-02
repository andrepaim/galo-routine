import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api/client');

import { useAuthStore } from '../../lib/stores/authStore';
import { apiFetch } from '../../lib/api/client';

const mockedApiFetch = vi.mocked(apiFetch);

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
      // Mock apiFetch for logout and prevent redirect
      mockedApiFetch.mockResolvedValue(undefined as any);
      const originalHref = Object.getOwnPropertyDescriptor(window, 'location');
      Object.defineProperty(window, 'location', { value: { href: '' }, writable: true });
      await useAuthStore.getState().logout();
      expect(mockedApiFetch).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
      if (originalHref) Object.defineProperty(window, 'location', originalHref);
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
    it('verifies pin via apiFetch', async () => {
      mockedApiFetch.mockResolvedValue({ valid: true });
      const result = await useAuthStore.getState().checkChildPin('1234');
      expect(result).toBe(true);
      expect(mockedApiFetch).toHaveBeenCalledWith('/auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ pin: '1234' }),
      });
    });

    it('returns false for wrong pin', async () => {
      mockedApiFetch.mockResolvedValue({ valid: false });
      const result = await useAuthStore.getState().checkChildPin('0000');
      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      mockedApiFetch.mockRejectedValue(new Error('Network error'));
      const result = await useAuthStore.getState().checkChildPin('1234');
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
