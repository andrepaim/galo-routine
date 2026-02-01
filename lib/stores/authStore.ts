import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
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
    await SecureStore.setItemAsync(ROLE_KEY, 'parent');
    await SecureStore.setItemAsync(FAMILY_ID_KEY, familyId);
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
    await SecureStore.deleteItemAsync(ROLE_KEY);
    await SecureStore.deleteItemAsync(FAMILY_ID_KEY);
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
      await SecureStore.setItemAsync(ROLE_KEY, role);
    } else {
      await SecureStore.deleteItemAsync(ROLE_KEY);
    }
    set({ role });
  },

  checkChildPin: async (pin: string) => {
    const { familyId } = get();
    if (!familyId) return false;
    return verifyChildPin(familyId, pin);
  },

  initAuth: () => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        const storedRole = await SecureStore.getItemAsync(ROLE_KEY);
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
