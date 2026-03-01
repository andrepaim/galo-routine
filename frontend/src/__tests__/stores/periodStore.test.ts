import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api/db');
vi.mock('../../lib/utils/periodUtils');
vi.mock('../../lib/utils/starCalculations');

import { usePeriodStore } from '../../lib/stores/periodStore';
import { useCompletionStore } from '../../lib/stores/completionStore';
import {
  createPeriod,
  updatePeriod,
  subscribePeriods,
  getActivePeriod,
} from '../../lib/api/db';
import { buildPeriod } from '../../lib/utils/periodUtils';
import { determinePeriodOutcome } from '../../lib/utils/starCalculations';

const mockedCreatePeriod = vi.mocked(createPeriod);
const mockedUpdatePeriod = vi.mocked(updatePeriod);
const mockedGetActivePeriod = vi.mocked(getActivePeriod);
const mockedBuildPeriod = vi.mocked(buildPeriod);
const mockedDetermineOutcome = vi.mocked(determinePeriodOutcome);

const FAMILY_ID = 'test-family';

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

beforeEach(() => {
  vi.clearAllMocks();
  usePeriodStore.setState({ periods: [], activePeriod: null, isLoading: false, _ensureLock: false });
  useCompletionStore.setState({ completions: [], isLoading: false });
});

describe('periodStore', () => {
  describe('subscribe', () => {
    it('subscribes and finds active period', () => {
      const mockPeriod = {
        id: 'p1',
        status: 'active' as const,
        starBudget: 100,
        starsEarned: 0,
        starsPending: 0,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        thresholds: { rewardPercent: 80, penaltyPercent: 30, rewardDescription: '', penaltyDescription: '' },
      };
      vi.mocked(subscribePeriods).mockImplementation((fid: string, cb: Function) => {
        cb([mockPeriod]);
        return vi.fn();
      });
      usePeriodStore.getState().subscribe(FAMILY_ID);
      expect(usePeriodStore.getState().activePeriod).toBeDefined();
      expect(usePeriodStore.getState().activePeriod?.id).toBe('p1');
      expect(usePeriodStore.getState().isLoading).toBe(false);
    });

    it('sets activePeriod to null when no active period', () => {
      vi.mocked(subscribePeriods).mockImplementation((fid: string, cb: Function) => {
        cb([{ id: 'p1', status: 'completed' }]);
        return vi.fn();
      });
      usePeriodStore.getState().subscribe(FAMILY_ID);
      expect(usePeriodStore.getState().activePeriod).toBeNull();
    });
  });

  describe('ensureActivePeriod', () => {
    it('uses existing active period if found', async () => {
      const existing = { id: 'existing-p' } as any;
      mockedGetActivePeriod.mockResolvedValue(existing);
      await usePeriodStore.getState().ensureActivePeriod(FAMILY_ID, mockSettings, []);
      expect(usePeriodStore.getState().activePeriod?.id).toBe('existing-p');
      expect(mockedCreatePeriod).not.toHaveBeenCalled();
    });

    it('creates new period if none exists', async () => {
      mockedGetActivePeriod.mockResolvedValue(null);
      const newPeriod = {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        status: 'active' as const,
        starBudget: 50,
        starsEarned: 0,
        starsPending: 0,
        thresholds: { rewardPercent: 80, penaltyPercent: 30, rewardDescription: '', penaltyDescription: '' },
      };
      mockedBuildPeriod.mockReturnValue(newPeriod);
      mockedCreatePeriod.mockResolvedValue('new-period-id');
      await usePeriodStore.getState().ensureActivePeriod(FAMILY_ID, mockSettings, []);
      expect(mockedCreatePeriod).toHaveBeenCalledWith(FAMILY_ID, newPeriod);
      expect(usePeriodStore.getState().activePeriod?.id).toBe('new-period-id');
    });

    it('does not create duplicate when lock is active', async () => {
      usePeriodStore.setState({ _ensureLock: true });
      await usePeriodStore.getState().ensureActivePeriod(FAMILY_ID, mockSettings, []);
      expect(mockedGetActivePeriod).not.toHaveBeenCalled();
    });

    it('releases lock after error', async () => {
      mockedGetActivePeriod.mockRejectedValue(new Error('network'));
      await expect(usePeriodStore.getState().ensureActivePeriod(FAMILY_ID, mockSettings, [])).rejects.toThrow('network');
      expect(usePeriodStore.getState()._ensureLock).toBe(false);
    });
  });

  describe('completePeriod', () => {
    it('calculates outcome and updates period', async () => {
      usePeriodStore.setState({
        periods: [{
          id: 'p1',
          starBudget: 100,
          starsEarned: 0,
          starsPending: 0,
          status: 'active' as const,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          thresholds: { rewardPercent: 80, penaltyPercent: 30, rewardDescription: '', penaltyDescription: '' },
        }],
      });
      useCompletionStore.setState({
        completions: [
          { id: 'c1', taskId: 't1', taskName: 'T', taskStarValue: 50, status: 'approved', date: {} as any, completedAt: {} as any },
          { id: 'c2', taskId: 't2', taskName: 'T', taskStarValue: 10, status: 'pending', date: {} as any, completedAt: {} as any },
        ],
      });
      mockedDetermineOutcome.mockReturnValue('neutral');
      await usePeriodStore.getState().completePeriod(FAMILY_ID, 'p1');
      expect(mockedUpdatePeriod).toHaveBeenCalledWith(FAMILY_ID, 'p1', expect.objectContaining({
        status: 'completed',
        starsEarned: 50,
        starsPending: 0,
      }));
    });

    it('does nothing for non-existing period', async () => {
      usePeriodStore.setState({ periods: [] });
      await usePeriodStore.getState().completePeriod(FAMILY_ID, 'nonexistent');
      expect(mockedUpdatePeriod).not.toHaveBeenCalled();
    });
  });
});
