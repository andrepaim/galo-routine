import { useEffect, useRef } from 'react';
import { useAuthStore, useTaskStore, usePeriodStore } from '../stores';
import { calculateStarBudget } from '../utils/starCalculations';
import { updatePeriod } from '../firebase/firestore';

export function useStarBudgetSync() {
  const familyId = useAuthStore((s) => s.familyId);
  const tasks = useTaskStore((s) => s.tasks);
  const activePeriod = usePeriodStore((s) => s.activePeriod);
  const lastBudgetRef = useRef<number | null>(null);

  useEffect(() => {
    if (!familyId || !activePeriod?.id) return;

    const startDate = activePeriod.startDate.toDate();
    const endDate = activePeriod.endDate.toDate();
    const newBudget = calculateStarBudget(tasks, startDate, endDate);

    if (newBudget === lastBudgetRef.current || newBudget === activePeriod.starBudget) {
      lastBudgetRef.current = newBudget;
      return;
    }

    lastBudgetRef.current = newBudget;
    updatePeriod(familyId, activePeriod.id, { starBudget: newBudget }).catch((err) => {
      console.error('Failed to sync star budget:', err);
    });
  }, [familyId, tasks, activePeriod?.id, activePeriod?.starBudget]);
}
