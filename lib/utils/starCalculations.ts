import type { Task, Period, StarProgress } from '../types';
import { countTaskOccurrences } from './recurrence';

/**
 * Calculate the total star budget for a period based on active tasks and their recurrence.
 */
export function calculateStarBudget(tasks: Task[], startDate: Date, endDate: Date): number {
  return tasks
    .filter((t) => t.isActive)
    .reduce((total, task) => {
      const occurrences = countTaskOccurrences(task.recurrence, startDate, endDate);
      return total + task.starValue * occurrences;
    }, 0);
}

/**
 * Determine the outcome of a period based on star percentage.
 */
export function determinePeriodOutcome(
  starsEarned: number,
  starBudget: number,
  rewardPercent: number,
  penaltyPercent: number,
): 'reward' | 'neutral' | 'penalty' {
  if (starBudget === 0) return 'neutral';
  const percent = (starsEarned / starBudget) * 100;
  if (percent >= rewardPercent) return 'reward';
  if (percent < penaltyPercent) return 'penalty';
  return 'neutral';
}

/**
 * Get star progress data for UI display.
 */
export function getStarProgress(period: Period): StarProgress {
  // When there are no tasks (budget=0), treat as neutral zone
  if (period.starBudget === 0) {
    return {
      earned: period.starsEarned,
      pending: period.starsPending,
      budget: 0,
      earnedPercent: 0,
      pendingPercent: 0,
      isRewardZone: false,
      isPenaltyZone: false,
      isNeutralZone: true,
    };
  }

  const earnedPercent = (period.starsEarned / period.starBudget) * 100;
  const pendingPercent = (period.starsPending / period.starBudget) * 100;

  return {
    earned: period.starsEarned,
    pending: period.starsPending,
    budget: period.starBudget,
    earnedPercent,
    pendingPercent,
    isRewardZone: earnedPercent >= period.thresholds.rewardPercent,
    isPenaltyZone: earnedPercent < period.thresholds.penaltyPercent,
    isNeutralZone:
      earnedPercent >= period.thresholds.penaltyPercent &&
      earnedPercent < period.thresholds.rewardPercent,
  };
}
