import { useEffect, useRef } from 'react';
import { useAuthStore, useTaskStore, usePeriodStore } from '../stores';
import { calculateGoalBudget } from '../utils/goalCalculations';
import { updatePeriod } from '../firebase/firestore';

export function useGoalBudgetSync() {
  const familyId = useAuthStore((s) => s.familyId);
  const tasks = useTaskStore((s) => s.tasks);
  const activePeriod = usePeriodStore((s) => s.activePeriod);
  const lastBudgetRef = useRef<number | null>(null);

  useEffect(() => {
    if (!familyId || !activePeriod?.id || familyId === 'dev-family-123') return;

    const startDate = activePeriod.startDate.toDate();
    const endDate = activePeriod.endDate.toDate();
    const newBudget = calculateGoalBudget(tasks, startDate, endDate);

    if (newBudget === lastBudgetRef.current || newBudget === activePeriod.goalBudget) {
      lastBudgetRef.current = newBudget;
      return;
    }

    lastBudgetRef.current = newBudget;
    updatePeriod(familyId, activePeriod.id, { goalBudget: newBudget }).catch((err) => {
      console.error('Failed to sync goal budget:', err);
    });
  }, [familyId, tasks, activePeriod?.id, activePeriod?.goalBudget]);
}
