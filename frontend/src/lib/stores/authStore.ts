import { create } from 'zustand';
import type { UserRole, AuthState, Family } from '../types';
import { verifyChildPin } from '../firebase/auth';
import { apiFetch } from '../api/client';
import { getSSE } from '../api/sse';

const ROLE_KEY = 'star_routine_role';
const FAMILY_ID = 'EXmCPl8hrnOYDzrPewHoXlGa5762';

interface AuthStore extends AuthState {
  family: Family | null;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  checkChildPin: (pin: string) => Promise<boolean>;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  uid: null,
  email: null,
  familyId: null,
  role: null,
  childName: null,
  parentName: null,
  isLoading: true,
  isAuthenticated: false,
  family: null,

  logout: async () => {
    localStorage.removeItem(ROLE_KEY);
    set({ role: 'child' });
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
    return verifyChildPin(FAMILY_ID, pin);
  },

  initAuth: () => {
    // DEV MODE: Check for ?dev=child or ?dev=parent in URL
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
              taskReminderLeadMinutes: 5,
              morningNotificationTime: '07:00',
              quietHoursStart: '21:00',
              quietHoursEnd: '07:00',
              notificationsEnabled: {
                taskStarting: true,
                morningSummary: true,
                streakReminder: true,
                taskApproved: true,
                goalMilestone: true,
                pendingApprovals: true,
                periodEnding: true,
                streakAtRisk: true,
              },
            },
          },
        });
        return () => {};
      }
    }

    // Single-family app: always authenticated, always parent by default
    const storedRole = (localStorage.getItem(ROLE_KEY) as UserRole) ?? 'child';

    apiFetch<Family>('/family')
      .then((family) => {
        set({
          uid: 'local',
          email: null,
          familyId: FAMILY_ID,
          role: storedRole,
          childName: family?.childName ?? null,
          parentName: family?.parentName ?? null,
          isAuthenticated: true,
          isLoading: false,
          family,
        });
      })
      .catch(() => {
        // API not yet ready — still mark as authenticated
        set({
          uid: 'local',
          familyId: FAMILY_ID,
          role: storedRole,
          email: null,
          childName: null,
          parentName: null,
          isAuthenticated: true,
          isLoading: false,
          family: null,
        });
      });

    // Subscribe to family updates via SSE
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
    return () => es.removeEventListener('message', handler);
  },
}));
