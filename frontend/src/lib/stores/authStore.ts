import { create } from 'zustand';
import type { UserRole, AuthState, Family } from '../types';
import { apiFetch } from '../api/client';
import { getSSE } from '../api/sse';

const ROLE_KEY = 'star_routine_role';

interface GoogleUser {
  userId: string;
  email: string;
  name: string;
  picture: string;
  familyId: string | null;
}

interface AuthStore extends AuthState {
  family: Family | null;
  googleUser: GoogleUser | null;
  needsOnboarding: boolean;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  checkChildPin: (pin: string) => Promise<boolean>;
  initAuth: () => () => void;
  createFamily: (parentName: string, childName: string, childPin: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  uid: null,
  email: null,
  familyId: null,
  role: null,
  childName: null,
  parentName: null,
  isLoading: true,
  isAuthenticated: false,
  family: null,
  googleUser: null,
  needsOnboarding: false,

  logout: async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/';
  },

  setRole: async (role: UserRole) => {
    if (role) {
      localStorage.setItem(ROLE_KEY, role);
    } else {
      localStorage.removeItem(ROLE_KEY);
    }
    set({ role });
  },

  checkChildPin: async (pin: string) => {
    try {
      const { valid } = await apiFetch<{ valid: boolean }>('/auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      return valid;
    } catch {
      return false;
    }
  },

  createFamily: async (parentName: string, childName: string, childPin: string) => {
    const family = await apiFetch<Family>('/family', {
      method: 'POST',
      body: JSON.stringify({ parentName, childName, childPin }),
    });
    const gUser = get().googleUser;
    set({
      family,
      familyId: gUser?.familyId ?? null,
      parentName: family.parentName,
      childName: family.childName,
      needsOnboarding: false,
      uid: gUser?.userId ?? 'local',
    });
  },

  initAuth: () => {
    const storedRole = (localStorage.getItem(ROLE_KEY) as UserRole) ?? 'child';

    // Safety timeout — never stay stuck on loading screen
    const timeout = setTimeout(() => {
      const { isLoading } = useAuthStore.getState();
      if (isLoading) {
        console.warn('[auth] initAuth timed out, forcing isLoading=false');
        set({ isAuthenticated: false, isLoading: false });
      }
    }, 5000);

    // Check if logged in via Google
    apiFetch<GoogleUser>('/auth/me')
      .then(async (gUser) => {
        set({ googleUser: gUser, email: gUser.email, uid: gUser.userId });

        if (!gUser.familyId) {
          set({ isAuthenticated: true, isLoading: false, needsOnboarding: true, role: 'parent' });
          return;
        }

        try {
          const family = await apiFetch<Family>('/family');
          set({
            isAuthenticated: true,
            isLoading: false,
            familyId: gUser.familyId,
            role: storedRole,
            childName: family?.childName ?? null,
            parentName: family?.parentName ?? null,
            family,
            needsOnboarding: false,
          });
        } catch {
          set({ isAuthenticated: true, isLoading: false, familyId: gUser.familyId, role: storedRole });
        }

        // Only subscribe to SSE when authenticated
        const es = getSSE();
        const handler = (e: MessageEvent) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'invalidate' && msg.collection === 'family') {
              apiFetch<Family>('/family').then((family) => {
                useAuthStore.setState({ family });
              });
            }
          } catch { /* ignore */ }
        };
        es.addEventListener('message', handler);
        cleanup = () => es.removeEventListener('message', handler);
      })
      .catch(() => {
        // Not logged in — show login page
        set({ isAuthenticated: false, isLoading: false });
      })
      .finally(() => clearTimeout(timeout));

    let cleanup = () => {};
    return () => cleanup();
  },
}));
