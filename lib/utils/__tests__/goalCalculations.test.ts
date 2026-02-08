import { calculateGoalBudget, determinePeriodOutcome, getGoalProgress } from '../goalCalculations';
import type { Task, Period } from '../../types';
import { Timestamp } from 'firebase/firestore';

describe('goalCalculations', () => {
  describe('calculateGoalBudget', () => {
    const makeDailyTask = (goals: number, isActive = true): Task => ({
      name: 'Task',
      description: '',
      goals,
      taskType: 'routine' as const,
      isActive,
      recurrence: { type: 'daily' },
    });

    it('should calculate budget for daily tasks over 7 days', () => {
      const tasks = [makeDailyTask(1), makeDailyTask(2)];
      // 7 days: Jan 5 (Mon) to Jan 11 (Sun)
      const budget = calculateGoalBudget(tasks, new Date(2026, 0, 5), new Date(2026, 0, 11));
      // (1+2) * 7 = 21
      expect(budget).toBe(21);
    });

    it('should ignore inactive tasks', () => {
      const tasks = [makeDailyTask(3, true), makeDailyTask(5, false)];
      const budget = calculateGoalBudget(tasks, new Date(2026, 0, 5), new Date(2026, 0, 11));
      expect(budget).toBe(21); // 3 * 7
    });

    it('should handle specific_days recurrence', () => {
      const tasks: Task[] = [{
        name: 'Weekend Task',
        description: '',
        goals: 2,
        taskType: 'routine' as const,
        isActive: true,
        recurrence: { type: 'specific_days', days: [6] }, // Saturday only
      }];
      // Jan 5 (Mon) to Jan 11 (Sun) => 1 Saturday
      const budget = calculateGoalBudget(tasks, new Date(2026, 0, 5), new Date(2026, 0, 11));
      expect(budget).toBe(2);
    });

    it('should count once recurrence as 1', () => {
      const tasks: Task[] = [{
        name: 'One-time Task',
        description: '',
        goals: 5,
        taskType: 'routine' as const,
        isActive: true,
        recurrence: { type: 'once' },
      }];
      const budget = calculateGoalBudget(tasks, new Date(2026, 0, 5), new Date(2026, 0, 11));
      expect(budget).toBe(5);
    });

    it('should return 0 for empty task list', () => {
      const budget = calculateGoalBudget([], new Date(2026, 0, 5), new Date(2026, 0, 11));
      expect(budget).toBe(0);
    });

    it('should handle mixed recurrence types', () => {
      const tasks: Task[] = [
        makeDailyTask(1),
        {
          name: 'MWF Task',
          description: '',
          goals: 2,
          taskType: 'routine' as const,
          isActive: true,
          recurrence: { type: 'specific_days', days: [1, 3, 5] },
        },
        {
          name: 'Once Task',
          description: '',
          goals: 3,
          taskType: 'routine' as const,
          isActive: true,
          recurrence: { type: 'once' },
        },
      ];
      // Jan 5 (Mon) to Jan 11 (Sun): daily=7, MWF=3, once=1
      // 1*7 + 2*3 + 3*1 = 7 + 6 + 3 = 16
      const budget = calculateGoalBudget(tasks, new Date(2026, 0, 5), new Date(2026, 0, 11));
      expect(budget).toBe(16);
    });
  });

  describe('determinePeriodOutcome', () => {
    it('should return neutral when budget is 0', () => {
      expect(determinePeriodOutcome(10, 0, 80, 50)).toBe('neutral');
    });

    it('should return reward when percentage meets threshold', () => {
      // 80/100 = 80% >= 80%
      expect(determinePeriodOutcome(80, 100, 80, 50)).toBe('reward');
    });

    it('should return reward when percentage exceeds threshold', () => {
      expect(determinePeriodOutcome(95, 100, 80, 50)).toBe('reward');
    });

    it('should return penalty when percentage is below penalty threshold', () => {
      // 40/100 = 40% < 50%
      expect(determinePeriodOutcome(40, 100, 80, 50)).toBe('penalty');
    });

    it('should return neutral when percentage is between penalty and reward thresholds', () => {
      // 60/100 = 60%, between 50% and 80%
      expect(determinePeriodOutcome(60, 100, 80, 50)).toBe('neutral');
    });

    it('should return penalty for 0 earned stars with non-zero budget', () => {
      expect(determinePeriodOutcome(0, 100, 80, 50)).toBe('penalty');
    });

    it('should return reward for 100% earned', () => {
      expect(determinePeriodOutcome(100, 100, 80, 50)).toBe('reward');
    });

    it('should handle boundary at penalty threshold', () => {
      // Exactly 50% should be neutral (>= penalty, < reward)
      expect(determinePeriodOutcome(50, 100, 80, 50)).toBe('neutral');
    });

    it('should handle boundary just below penalty threshold', () => {
      expect(determinePeriodOutcome(49, 100, 80, 50)).toBe('penalty');
    });
  });

  describe('getGoalProgress', () => {
    const makePeriod = (overrides: Partial<Period> = {}): Period => ({
      startDate: Timestamp.fromDate(new Date(2026, 0, 5)),
      endDate: Timestamp.fromDate(new Date(2026, 0, 11)),
      status: 'active',
      goalBudget: 100,
      goalsEarned: 60,
      goalsPending: 10,
      thresholds: {
        rewardPercent: 80,
        penaltyPercent: 50,
        rewardDescription: 'Great!',
        penaltyDescription: 'Try harder!',
      },
      ...overrides,
    });

    it('should calculate earned and pending percentages', () => {
      const progress = getGoalProgress(makePeriod());
      expect(progress.earnedPercent).toBe(60);
      expect(progress.pendingPercent).toBe(10);
    });

    it('should set isNeutralZone when between thresholds', () => {
      const progress = getGoalProgress(makePeriod({ goalsEarned: 60 }));
      expect(progress.isNeutralZone).toBe(true);
      expect(progress.isRewardZone).toBe(false);
      expect(progress.isPenaltyZone).toBe(false);
    });

    it('should set isRewardZone when earned meets reward threshold', () => {
      const progress = getGoalProgress(makePeriod({ goalsEarned: 80 }));
      expect(progress.isRewardZone).toBe(true);
      expect(progress.isNeutralZone).toBe(false);
      expect(progress.isPenaltyZone).toBe(false);
    });

    it('should set isPenaltyZone when earned is below penalty threshold', () => {
      const progress = getGoalProgress(makePeriod({ goalsEarned: 40 }));
      expect(progress.isPenaltyZone).toBe(true);
      expect(progress.isRewardZone).toBe(false);
      expect(progress.isNeutralZone).toBe(false);
    });

    it('should handle zero budget period', () => {
      const progress = getGoalProgress(makePeriod({ goalBudget: 0 }));
      expect(progress.budget).toBe(0);
      expect(progress.earnedPercent).toBe(0);
      expect(progress.pendingPercent).toBe(0);
      expect(progress.isNeutralZone).toBe(true);
      expect(progress.isRewardZone).toBe(false);
      expect(progress.isPenaltyZone).toBe(false);
    });

    it('should return correct earned and pending values', () => {
      const progress = getGoalProgress(makePeriod({ goalsEarned: 42, goalsPending: 8 }));
      expect(progress.earned).toBe(42);
      expect(progress.pending).toBe(8);
      expect(progress.budget).toBe(100);
    });
  });
});
