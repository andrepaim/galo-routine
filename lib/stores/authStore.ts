import { create } from 'zustand';
import * as Storage from '../utils/storage';
import type { UserRole, AuthState, RegisterFormData, Family } from '../types';
import {
  onAuthChange,
  registerParent,
  loginParent,
  signOut as firebaseSignOut,
  getFamilyDoc,
  verifyChildPin,
} from '../firebase/auth';

const ROLE_KEY = 'star_routine_role';
const FAMILY_ID_KEY = 'star_routine_family_id';

interface AuthStore extends AuthState {
  family: Family | null;
  register: (data: RegisterFormData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  checkChildPin: (pin: string) => Promise<boolean>;
  initAuth: () => () => void;
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

  register: async (data: RegisterFormData) => {
    const familyId = await registerParent(data);
    await Storage.setItem(ROLE_KEY, 'parent');
    await Storage.setItem(FAMILY_ID_KEY, familyId);
    set({
      familyId,
      role: 'parent',
      childName: data.childName,
      parentName: data.parentName,
    });
  },

  login: async (email: string, password: string) => {
    await loginParent(email, password);
    // Auth state listener will handle the rest
  },

  logout: async () => {
    await firebaseSignOut();
    await Storage.deleteItem(ROLE_KEY);
    await Storage.deleteItem(FAMILY_ID_KEY);
    set({
      uid: null,
      email: null,
      familyId: null,
      role: null,
      childName: null,
      parentName: null,
      isAuthenticated: false,
      family: null,
    });
  },

  setRole: async (role: UserRole) => {
    if (role) {
      await Storage.setItem(ROLE_KEY, role);
    } else {
      await Storage.deleteItem(ROLE_KEY);
    }
    set({ role });
  },

  checkChildPin: async (pin: string) => {
    const { familyId } = get();
    if (!familyId) return false;
    return verifyChildPin(familyId, pin);
  },

  initAuth: () => {
    // DEV MODE: Check for ?dev=child or ?dev=parent in URL to bypass Firebase auth
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const devMode = params.get('dev');
      if (devMode === 'child' || devMode === 'parent') {
        console.log('[DEV] Mocking auth state for role:', devMode);
        set({
          uid: 'dev-user-123',
          email: 'dev@test.com',
          familyId: 'dev-family-123',
          role: devMode,
          childName: 'Vitor',
          parentName: 'Andre',
          isAuthenticated: true,
          isLoading: false,
          family: {
            parentUid: 'dev-user-123',
            childPin: 'mock-hashed-pin',
            parentName: 'Andre',
            childName: 'Vitor',
            starBalance: 42,
            lifetimeStarsEarned: 150,
            currentStreak: 7,
            bestStreak: 14,
            settings: {
              rewardThresholdPercent: 80,
              penaltyThresholdPercent: 50,
              rewardDescription: 'Parabéns!',
              penaltyDescription: 'Tente mais amanhã',
              periodType: 'weekly',
              periodStartDay: 0,
              autoRollPeriods: true,
              onTimeBonusEnabled: true,
              onTimeBonusStars: 1,
              perfectDayBonusEnabled: true,
              perfectDayBonusStars: 3,
              earlyFinishBonusEnabled: false,
              earlyFinishBonusStars: 2,
              earlyFinishCutoff: '12:00',
              streakFreezeCost: 5,
              maxStreakFreezesPerPeriod: 1,
            } as any,
          },
        });
        return () => {}; // No-op unsubscribe for dev mode
      }
    }

    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        const storedRole = await Storage.getItem(ROLE_KEY);
        const familyId = user.uid;
        const family = await getFamilyDoc(familyId);

        set({
          uid: user.uid,
          email: user.email,
          familyId,
          role: (storedRole as UserRole) ?? 'parent',
          childName: family?.childName ?? null,
          parentName: family?.parentName ?? null,
          isAuthenticated: true,
          isLoading: false,
          family,
        });
      } else {
        set({
          uid: null,
          email: null,
          familyId: null,
          role: null,
          childName: null,
          parentName: null,
          isAuthenticated: false,
          isLoading: false,
          family: null,
        });
      }
    });
    return unsubscribe;
  },
}));
