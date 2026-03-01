import { useEffect, useRef } from 'react';
import { useAuthStore, useTaskStore, usePeriodStore } from '../stores';
import { calculateStarBudget } from '../utils/starCalculations';
import { updatePeriod } from '../api/db';

export function useStarBudgetSync() {
  const familyId = useAuthStore((s) => s.familyId);
  const tasks = useTaskStore((s) => s.tasks);
  const activePeriod = usePeriodStore((s) => s.activePeriod);
  const lastBudgetRef = useRef<number | null>(null);

  useEffect(() => {
    if (!familyId || !activePeriod?.id) return;

    // Parse ISO strings to Date objects
    const startDate = new Date(activePeriod.startDate as string);
    const endDate = new Date(activePeriod.endDate as string);
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
