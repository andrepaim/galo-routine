import { describe, it, expect } from 'vitest';
import { calculateStarBudget, determinePeriodOutcome, getStarProgress } from '../../lib/utils/starCalculations';
import type { Task, Period } from '../../lib/types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Test Task',
    description: 'desc',
    starValue: 2,
    isActive: true,
    recurrence: { type: 'daily' },
    ...overrides,
  };
}

function makePeriod(overrides: Partial<Period> = {}): Period {
  return {
    id: 'period-1',
    startDate: '2026-01-06T00:00:00.000Z',
    endDate: '2026-01-12T00:00:00.000Z',
    status: 'active',
    starBudget: 100,
    starsEarned: 50,
    starsPending: 10,
    thresholds: {
      rewardPercent: 80,
      penaltyPercent: 30,
      rewardDescription: 'Reward!',
      penaltyDescription: 'Penalty!',
    },
    ...overrides,
  };
}

describe('calculateStarBudget', () => {
  it('returns 0 for no tasks', () => {
    const result = calculateStarBudget([], new Date('2026-01-06'), new Date('2026-01-12'));
    expect(result).toBe(0);
  });

  it('calculates budget for a daily task over 7 days', () => {
    const tasks = [makeTask({ starValue: 3 })];
    const result = calculateStarBudget(tasks, new Date('2026-01-06'), new Date('2026-01-12'));
    expect(result).toBe(21); // 3 stars * 7 days
  });

  it('ignores inactive tasks', () => {
    const tasks = [makeTask({ isActive: false, starValue: 5 })];
    const result = calculateStarBudget(tasks, new Date('2026-01-06'), new Date('2026-01-12'));
    expect(result).toBe(0);
  });

  it('sums multiple tasks correctly', () => {
    const tasks = [
      makeTask({ starValue: 2 }),
      makeTask({ id: 'task-2', starValue: 3 }),
    ];
    const result = calculateStarBudget(tasks, new Date('2026-01-06'), new Date('2026-01-12'));
    expect(result).toBe(35); // (2 + 3) * 7
  });

  it('handles specific_days recurrence', () => {
    // Mon, Wed, Fri = 3 days in a Mon-Sun week (2026-01-05 = Monday)
    const tasks = [makeTask({ starValue: 2, recurrence: { type: 'specific_days', days: [1, 3, 5] } })];
    const result = calculateStarBudget(tasks, new Date('2026-01-05'), new Date('2026-01-11'));
    expect(result).toBe(6); // 2 * 3
  });

  it('handles once recurrence (counts as 1)', () => {
    const tasks = [makeTask({ starValue: 5, recurrence: { type: 'once' } })];
    const result = calculateStarBudget(tasks, new Date('2026-01-06'), new Date('2026-01-12'));
    expect(result).toBe(5); // 5 * 1
  });
});

describe('determinePeriodOutcome', () => {
  it('returns neutral when budget is 0', () => {
    expect(determinePeriodOutcome(10, 0, 80, 30)).toBe('neutral');
  });

  it('returns reward when earned >= rewardPercent', () => {
    expect(determinePeriodOutcome(80, 100, 80, 30)).toBe('reward');
    expect(determinePeriodOutcome(100, 100, 80, 30)).toBe('reward');
  });

  it('returns penalty when earned < penaltyPercent', () => {
    expect(determinePeriodOutcome(20, 100, 80, 30)).toBe('penalty');
    expect(determinePeriodOutcome(0, 100, 80, 30)).toBe('penalty');
  });

  it('returns neutral when between penalty and reward', () => {
    expect(determinePeriodOutcome(50, 100, 80, 30)).toBe('neutral');
  });

  it('returns neutral at exact penalty boundary', () => {
    expect(determinePeriodOutcome(30, 100, 80, 30)).toBe('neutral');
  });
});

describe('getStarProgress', () => {
  it('returns zero state when budget is 0', () => {
    const period = makePeriod({ starBudget: 0 });
    const result = getStarProgress(period);
    expect(result.earnedPercent).toBe(0);
    expect(result.pendingPercent).toBe(0);
    expect(result.isNeutralZone).toBe(true);
    expect(result.isRewardZone).toBe(false);
    expect(result.isPenaltyZone).toBe(false);
  });

  it('calculates percentages correctly', () => {
    const period = makePeriod({ starsEarned: 40, starsPending: 20, starBudget: 100 });
    const result = getStarProgress(period);
    expect(result.earnedPercent).toBe(40);
    expect(result.pendingPercent).toBe(20);
  });

  it('detects reward zone', () => {
    const period = makePeriod({ starsEarned: 85, starBudget: 100 });
    const result = getStarProgress(period);
    expect(result.isRewardZone).toBe(true);
    expect(result.isNeutralZone).toBe(false);
    expect(result.isPenaltyZone).toBe(false);
  });

  it('detects penalty zone', () => {
    const period = makePeriod({ starsEarned: 10, starBudget: 100 });
    const result = getStarProgress(period);
    expect(result.isPenaltyZone).toBe(true);
    expect(result.isRewardZone).toBe(false);
    expect(result.isNeutralZone).toBe(false);
  });

  it('detects neutral zone', () => {
    const period = makePeriod({ starsEarned: 50, starBudget: 100 });
    const result = getStarProgress(period);
    expect(result.isNeutralZone).toBe(true);
    expect(result.isRewardZone).toBe(false);
    expect(result.isPenaltyZone).toBe(false);
  });

  it('returns correct earned/pending/budget values', () => {
    const period = makePeriod({ starsEarned: 25, starsPending: 5, starBudget: 50 });
    const result = getStarProgress(period);
    expect(result.earned).toBe(25);
    expect(result.pending).toBe(5);
    expect(result.budget).toBe(50);
  });
});
