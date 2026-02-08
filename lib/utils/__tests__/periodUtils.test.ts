import { calculatePeriodDates, formatPeriodRange, isPeriodCurrent, hasPeriodEnded, getRemainingDays, isToday } from '../periodUtils';
import type { FamilySettings, Period } from '../../types';
import { Timestamp } from 'firebase/firestore';

const makeSettings = (overrides: Partial<FamilySettings> = {}): FamilySettings => ({
  rewardThresholdPercent: 80,
  penaltyThresholdPercent: 50,
  rewardDescription: 'Great!',
  penaltyDescription: 'Try harder!',
  periodType: 'weekly',
  periodStartDay: 1, // Monday
  autoRollPeriods: true,
  onTimeBonusEnabled: true,
  onTimeBonusGoals: 1,
  perfectDayBonusEnabled: true,
  perfectDayBonusGoals: 3,
  earlyFinishBonusEnabled: false,
  earlyFinishBonusGoals: 2,
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
  ...overrides,
});

const makePeriod = (startDate: Date, endDate: Date): Period => ({
  startDate: Timestamp.fromDate(startDate),
  endDate: Timestamp.fromDate(endDate),
  status: 'active',
  goalBudget: 100,
  goalsEarned: 50,
  goalsPending: 10,
  thresholds: {
    rewardPercent: 80,
    penaltyPercent: 50,
    rewardDescription: 'Great!',
    penaltyDescription: 'Try harder!',
  },
});

describe('periodUtils', () => {
  describe('calculatePeriodDates', () => {
    it('should calculate weekly period starting on Monday', () => {
      // 2026-01-07 is a Wednesday
      const settings = makeSettings({ periodType: 'weekly', periodStartDay: 1 });
      const { start, end } = calculatePeriodDates(settings, new Date(2026, 0, 7));
      // Start should be Monday Jan 5
      expect(start.getDate()).toBe(5);
      expect(start.getMonth()).toBe(0);
      // End should be Sunday Jan 11
      expect(end.getDate()).toBe(11);
      expect(end.getMonth()).toBe(0);
    });

    it('should calculate weekly period starting on Sunday', () => {
      const settings = makeSettings({ periodType: 'weekly', periodStartDay: 0 });
      // 2026-01-07 Wednesday - week starting Sunday would be Jan 4
      const { start, end } = calculatePeriodDates(settings, new Date(2026, 0, 7));
      expect(start.getDay()).toBe(0); // Sunday
      expect(end.getDay()).toBe(6);   // Saturday
    });

    it('should calculate monthly period', () => {
      const settings = makeSettings({ periodType: 'monthly' });
      const { start, end } = calculatePeriodDates(settings, new Date(2026, 1, 15)); // Feb 15
      expect(start.getDate()).toBe(1);
      expect(start.getMonth()).toBe(1);
      expect(end.getDate()).toBe(28);
      expect(end.getMonth()).toBe(1);
    });

    it('should calculate biweekly period', () => {
      const settings = makeSettings({ periodType: 'biweekly', periodStartDay: 1 });
      const { start, end } = calculatePeriodDates(settings, new Date(2026, 0, 7));
      // Start on Monday, end 13 days later (Sunday of 2nd week)
      expect(start.getDay()).toBe(1); // Monday
      const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(13); // 2 weeks - 1 day
    });

    it('should calculate custom period', () => {
      const settings = makeSettings({ periodType: 'custom', customPeriodDays: 10 });
      const refDate = new Date(2026, 0, 5);
      const { start, end } = calculatePeriodDates(settings, refDate);
      expect(start.getDate()).toBe(5);
      const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(9); // 10 days - 1
    });

    it('should default custom period to 7 days when customPeriodDays is not set', () => {
      const settings = makeSettings({ periodType: 'custom' });
      delete (settings as any).customPeriodDays;
      const refDate = new Date(2026, 0, 5);
      const { start, end } = calculatePeriodDates(settings, refDate);
      const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(6); // 7 days - 1
    });

    it('should throw for unknown period type', () => {
      const settings = makeSettings({ periodType: 'invalid' as any });
      expect(() => calculatePeriodDates(settings)).toThrow('Unknown period type');
    });
  });

  describe('formatPeriodRange', () => {
    it('should format a period range', () => {
      const period = makePeriod(new Date(2026, 0, 5), new Date(2026, 0, 11));
      const result = formatPeriodRange(period);
      expect(result).toContain('Jan 5');
      expect(result).toContain('Jan 11');
      expect(result).toContain('2026');
    });
  });

  describe('isPeriodCurrent', () => {
    it('should return true when now is within the period', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 86400000); // yesterday
      const end = new Date(now.getTime() + 86400000);   // tomorrow
      const period = makePeriod(start, end);
      expect(isPeriodCurrent(period)).toBe(true);
    });

    it('should return false when period is in the past', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 172800000); // 2 days ago
      const end = new Date(now.getTime() - 86400000);     // 1 day ago
      const period = makePeriod(start, end);
      expect(isPeriodCurrent(period)).toBe(false);
    });

    it('should return false when period is in the future', () => {
      const now = new Date();
      const start = new Date(now.getTime() + 86400000);  // tomorrow
      const end = new Date(now.getTime() + 172800000);    // 2 days from now
      const period = makePeriod(start, end);
      expect(isPeriodCurrent(period)).toBe(false);
    });
  });

  describe('hasPeriodEnded', () => {
    it('should return true when end date is in the past', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 172800000);
      const end = new Date(now.getTime() - 86400000);
      const period = makePeriod(start, end);
      expect(hasPeriodEnded(period)).toBe(true);
    });

    it('should return false when end date is in the future', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 86400000);
      const end = new Date(now.getTime() + 86400000);
      const period = makePeriod(start, end);
      expect(hasPeriodEnded(period)).toBe(false);
    });
  });

  describe('getRemainingDays', () => {
    it('should return 0 when period has ended', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 172800000);
      const end = new Date(now.getTime() - 86400000);
      const period = makePeriod(start, end);
      expect(getRemainingDays(period)).toBe(0);
    });

    it('should return positive number when period is active', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 86400000);
      const end = new Date(now.getTime() + 3 * 86400000); // 3 days from now
      const period = makePeriod(start, end);
      const remaining = getRemainingDays(period);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(4);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });
});
