import { useEffect } from 'react';
import { useAuthStore, usePeriodStore, useTaskStore } from '../stores';

export function useCurrentPeriod() {
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const tasks = useTaskStore((s) => s.tasks);
  const { activePeriod, isLoading, ensureActivePeriod } = usePeriodStore();

  useEffect(() => {
    if (!familyId || !family?.settings || tasks.length === 0) return;
    ensureActivePeriod(familyId, family.settings, tasks);
  }, [familyId, family?.settings, tasks.length]);

  return { activePeriod, isLoading };
}
