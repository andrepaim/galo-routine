import { useMemo } from 'react';
import { usePeriodStore, useCompletionStore } from '../stores';
import type { StarProgress } from '../types';
import { getStarProgress } from '../utils/starCalculations';

export function useStarBudget(): StarProgress | null {
  const activePeriod = usePeriodStore((s) => s.activePeriod);
  const completions = useCompletionStore((s) => s.completions);

  return useMemo(() => {
    if (!activePeriod) return null;

    const starsEarned = completions
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + c.taskStarValue, 0);

    const starsPending = completions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.taskStarValue, 0);

    return getStarProgress({ ...activePeriod, starsEarned, starsPending });
  }, [activePeriod, completions]);
}
