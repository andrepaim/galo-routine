import { useEffect } from 'react';
import { useAuthStore, usePeriodStore, useTaskStore } from '../stores';

export function useCurrentPeriod() {
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const tasks = useTaskStore((s) => s.tasks);
  const activePeriod = usePeriodStore((s) => s.activePeriod);
  const isLoading = usePeriodStore((s) => s.isLoading);
  const ensureActivePeriod = usePeriodStore((s) => s.ensureActivePeriod);

  const periodType = family?.settings?.periodType;
  const periodStartDay = family?.settings?.periodStartDay;
  const rewardThreshold = family?.settings?.rewardThresholdPercent;

  useEffect(() => {
    if (!familyId || !family?.settings || tasks.length === 0) return;
    ensureActivePeriod(familyId, family.settings, tasks).catch((err) => {
      console.error('Failed to ensure active period:', err);
    });
  }, [familyId, periodType, periodStartDay, rewardThreshold, tasks.length]);

  return { activePeriod, isLoading };
}
