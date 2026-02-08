import { useMemo } from 'react';
import { usePeriodStore, useCompletionStore } from '../stores';
import type { GoalProgress } from '../types';
import { getGoalProgress } from '../utils/goalCalculations';

export function useGoalBudget(): GoalProgress | null {
  const activePeriod = usePeriodStore((s) => s.activePeriod);
  const completions = useCompletionStore((s) => s.completions);

  return useMemo(() => {
    if (!activePeriod) return null;

    const goalsEarned = completions
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + c.taskGoalValue, 0);

    const goalsPending = completions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.taskGoalValue, 0);

    return getGoalProgress({ ...activePeriod, goalsEarned, goalsPending });
  }, [activePeriod, completions]);
}
