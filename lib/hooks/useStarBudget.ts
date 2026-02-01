import { useMemo } from 'react';
import { usePeriodStore } from '../stores';
import type { StarProgress } from '../types';
import { getStarProgress } from '../utils/starCalculations';

export function useStarBudget(): StarProgress | null {
  const activePeriod = usePeriodStore((s) => s.activePeriod);

  return useMemo(() => {
    if (!activePeriod) return null;
    return getStarProgress(activePeriod);
  }, [activePeriod]);
}
