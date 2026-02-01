import { useEffect } from 'react';
import { useAuthStore, useTaskStore, usePeriodStore, useCompletionStore } from '../stores';

/**
 * Subscribe to all Firestore collections for the current family.
 * Should be called once in the root layout after auth is confirmed.
 */
export function useSubscriptions() {
  const familyId = useAuthStore((s) => s.familyId);
  const activePeriod = usePeriodStore((s) => s.activePeriod);

  useEffect(() => {
    if (!familyId) return;

    const unsubs: (() => void)[] = [];
    unsubs.push(useTaskStore.getState().subscribe(familyId));
    unsubs.push(usePeriodStore.getState().subscribe(familyId));

    return () => unsubs.forEach((u) => u());
  }, [familyId]);

  // Subscribe to completions when we have an active period
  useEffect(() => {
    if (!familyId || !activePeriod?.id) return;

    const unsub = useCompletionStore.getState().subscribe(familyId, activePeriod.id);
    return () => unsub();
  }, [familyId, activePeriod?.id]);
}
