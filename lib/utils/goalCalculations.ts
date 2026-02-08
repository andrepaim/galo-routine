import type { Task, Period, GoalProgress } from '../types';
import { countTaskOccurrences } from './recurrence';

/**
 * Calculate the total goal budget for a period based on active tasks and their recurrence.
 */
export function calculateGoalBudget(tasks: Task[], startDate: Date, endDate: Date): number {
  return tasks
    .filter((t) => t.isActive)
    .reduce((total, task) => {
      const occurrences = countTaskOccurrences(task.recurrence, startDate, endDate);
      return total + task.goals * occurrences;
    }, 0);
}

/**
 * Determine the outcome of a period based on goal percentage.
 */
export function determinePeriodOutcome(
  goalsEarned: number,
  goalBudget: number,
  rewardPercent: number,
  penaltyPercent: number,
): 'reward' | 'neutral' | 'penalty' {
  if (goalBudget === 0) return 'neutral';
  const percent = (goalsEarned / goalBudget) * 100;
  if (percent >= rewardPercent) return 'reward';
  if (percent < penaltyPercent) return 'penalty';
  return 'neutral';
}

/**
 * Get goal progress data for UI display.
 */
export function getGoalProgress(period: Period): GoalProgress {
  // When there are no tasks (budget=0), treat as neutral zone
  if (period.goalBudget === 0) {
    return {
      earned: period.goalsEarned,
      pending: period.goalsPending,
      budget: 0,
      earnedPercent: 0,
      pendingPercent: 0,
      isRewardZone: false,
      isPenaltyZone: false,
      isNeutralZone: true,
    };
  }

  const earnedPercent = (period.goalsEarned / period.goalBudget) * 100;
  const pendingPercent = (period.goalsPending / period.goalBudget) * 100;

  return {
    earned: period.goalsEarned,
    pending: period.goalsPending,
    budget: period.goalBudget,
    earnedPercent,
    pendingPercent,
    isRewardZone: earnedPercent >= period.thresholds.rewardPercent,
    isPenaltyZone: earnedPercent < period.thresholds.penaltyPercent,
    isNeutralZone:
      earnedPercent >= period.thresholds.penaltyPercent &&
      earnedPercent < period.thresholds.rewardPercent,
  };
}
