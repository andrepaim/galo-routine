import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useAuthStore } from '../../lib/stores/authStore';
import { usePeriodStore } from '../../lib/stores/periodStore';
import { useTaskStore } from '../../lib/stores/taskStore';
vi.mock('../../lib/api/db');

const mockSettings = {
  periodType: 'weekly' as const,
  periodStartDay: 1,
  rewardThresholdPercent: 80,
  penaltyThresholdPercent: 30,
  rewardDescription: 'Great!',
  penaltyDescription: 'Try harder!',
  autoRollPeriods: true,
  onTimeBonusEnabled: false,
  onTimeBonusStars: 0,
  perfectDayBonusEnabled: false,
  perfectDayBonusStars: 0,
  earlyFinishBonusEnabled: false,
  earlyFinishBonusStars: 0,
  earlyFinishCutoff: '20:00',
  streakFreezeCost: 10,
  maxStreakFreezesPerPeriod: 2,
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
};

const mockPeriod = {
  id: 'p1',
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  status: 'active' as const,
  starBudget: 100,
  starsEarned: 0,
  starsPending: 0,
  thresholds: { rewardPercent: 80, penaltyPercent: 30, rewardDescription: '', penaltyDescription: '' },
};

beforeEach(() => {
  useAuthStore.setState({ familyId: null, family: null, isLoading: false, isAuthenticated: false, uid: null, email: null, role: null, childName: null, parentName: null });
  usePeriodStore.setState({ periods: [], activePeriod: null, isLoading: false, _ensureLock: false });
  useTaskStore.setState({ tasks: [], isLoading: false });
});

describe('useCurrentPeriod', () => {
  it('returns null activePeriod when no family', () => {
    const { result } = renderHook(() => useCurrentPeriod());
    expect(result.current.activePeriod).toBeNull();
  });

  it('returns isLoading from period store', () => {
    usePeriodStore.setState({ isLoading: true });
    const { result } = renderHook(() => useCurrentPeriod());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns active period when set', () => {
    usePeriodStore.setState({ activePeriod: mockPeriod });
    const { result } = renderHook(() => useCurrentPeriod());
    expect(result.current.activePeriod).toBeDefined();
    expect(result.current.activePeriod?.id).toBe('p1');
  });

  it('returns null active period when no active period in store', () => {
    usePeriodStore.setState({ activePeriod: null, isLoading: false });
    const { result } = renderHook(() => useCurrentPeriod());
    expect(result.current.activePeriod).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
