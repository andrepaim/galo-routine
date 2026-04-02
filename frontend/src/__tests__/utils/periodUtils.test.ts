import { describe, it, expect } from 'vitest';
import { calculatePeriodDates, formatPeriodRange, isPeriodCurrent, hasPeriodEnded, getRemainingDays } from '../../lib/utils/periodUtils';
import type { FamilySettings, Period } from '../../lib/types';

const baseSettings: FamilySettings = {
  rewardThresholdPercent: 80,
  penaltyThresholdPercent: 30,
  rewardDescription: 'Reward',
  penaltyDescription: 'Penalty',
  periodType: 'weekly',
  periodStartDay: 1, // Monday
  autoRollPeriods: true,
  onTimeBonusEnabled: false,
  onTimeBonusStars: 1,
  perfectDayBonusEnabled: false,
  perfectDayBonusStars: 3,
  earlyFinishBonusEnabled: false,
  earlyFinishBonusStars: 2,
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

function makePeriod(start: Date, end: Date, status: 'active' | 'completed' = 'active'): Period {
  return {
    id: 'p1',
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    status,
    starBudget: 100,
    starsEarned: 0,
    starsPending: 0,
    thresholds: { rewardPercent: 80, penaltyPercent: 30, rewardDescription: '', penaltyDescription: '' },
  };
}

describe('calculatePeriodDates', () => {
  it('calculates weekly period', () => {
    const settings = { ...baseSettings, periodType: 'weekly' as const };
    const { start, end } = calculatePeriodDates(settings, new Date('2026-01-07')); // Wednesday
    expect(start.getDay()).toBe(1); // Monday
    expect(end.getDay()).toBe(0); // Sunday
  });

  it('calculates monthly period', () => {
    const settings = { ...baseSettings, periodType: 'monthly' as const };
    const { start, end } = calculatePeriodDates(settings, new Date('2026-01-15'));
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(0); // January
    expect(end.getDate()).toBe(31);
  });

  it('calculates custom period (10 days)', () => {
    const settings = { ...baseSettings, periodType: 'custom' as const, customPeriodDays: 10 };
    const { start, end } = calculatePeriodDates(settings, new Date('2026-01-05'));
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(10); // 10 days, end is set to 23:59:59.999
  });

  it('calculates biweekly period', () => {
    const settings = { ...baseSettings, periodType: 'biweekly' as const };
    const { start, end } = calculatePeriodDates(settings, new Date('2026-01-07'));
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(14); // 2 weeks, end is set to 23:59:59.999
  });

  it('throws on unknown period type', () => {
    const settings = { ...baseSettings, periodType: 'invalid' as any };
    expect(() => calculatePeriodDates(settings)).toThrow('Unknown period type');
  });
});

describe('formatPeriodRange', () => {
  it('formats date range', () => {
    const period = makePeriod(new Date('2026-01-06'), new Date('2026-01-12'));
    const result = formatPeriodRange(period);
    expect(result).toContain('Jan');
  });
});

describe('isPeriodCurrent', () => {
  it('returns true when today is within the period', () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    const end = new Date(now);
    end.setDate(end.getDate() + 1);
    const period = makePeriod(start, end);
    expect(isPeriodCurrent(period)).toBe(true);
  });

  it('returns false when period is in the past', () => {
    const end = new Date();
    end.setDate(end.getDate() - 2);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const period = makePeriod(start, end);
    expect(isPeriodCurrent(period)).toBe(false);
  });
});

describe('hasPeriodEnded', () => {
  it('returns true for past period', () => {
    const end = new Date();
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const period = makePeriod(start, end);
    expect(hasPeriodEnded(period)).toBe(true);
  });

  it('returns false for future period', () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const period = makePeriod(start, end);
    expect(hasPeriodEnded(period)).toBe(false);
  });
});

describe('getRemainingDays', () => {
  it('returns 0 for past period', () => {
    const end = new Date();
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const period = makePeriod(start, end);
    expect(getRemainingDays(period)).toBe(0);
  });

  it('returns positive days for active period', () => {
    const start = new Date();
    start.setDate(start.getDate() - 3);
    const end = new Date();
    end.setDate(end.getDate() + 4);
    const period = makePeriod(start, end);
    expect(getRemainingDays(period)).toBeGreaterThan(0);
  });
});
