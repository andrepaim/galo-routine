import { create } from 'zustand';
import type { Period, Task, FamilySettings } from '../types';
import {
  createPeriod,
  updatePeriod,
  subscribePeriods,
  getActivePeriod,
} from '../firebase/firestore';
import { buildPeriod } from '../utils/periodUtils';
import { determinePeriodOutcome } from '../utils/goalCalculations';
import { useCompletionStore } from './completionStore';

interface PeriodStore {
  periods: Period[];
  activePeriod: Period | null;
  isLoading: boolean;
  _ensureLock: boolean;
  subscribe: (familyId: string) => () => void;
  ensureActivePeriod: (familyId: string, settings: FamilySettings, tasks: Task[]) => Promise<void>;
  completePeriod: (familyId: string, periodId: string) => Promise<void>;
}

export const usePeriodStore = create<PeriodStore>((set, get) => ({
  periods: [],
  activePeriod: null,
  isLoading: true,
  _ensureLock: false,

  subscribe: (familyId: string) => {
    set({ isLoading: true });
    const unsubscribe = subscribePeriods(familyId, (periods) => {
      const active = periods.find((p) => p.status === 'active') ?? null;
      set({ periods, activePeriod: active, isLoading: false });
    });
    return unsubscribe;
  },

  ensureActivePeriod: async (familyId: string, settings: FamilySettings, tasks: Task[]) => {
    if (get()._ensureLock) return;
    set({ _ensureLock: true });
    try {
      const existing = await getActivePeriod(familyId);
      if (existing) {
        set({ activePeriod: existing });
        return;
      }
      const period = buildPeriod(settings, tasks);
      const id = await createPeriod(familyId, period);
      set({ activePeriod: { ...period, id } });
    } finally {
      set({ _ensureLock: false });
    }
  },

  completePeriod: async (familyId: string, periodId: string) => {
    const period = get().periods.find((p) => p.id === periodId);
    if (!period) return;

    const completions = useCompletionStore.getState().completions;
    const goalsEarned = completions
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + c.taskGoalValue, 0);

    const outcome = determinePeriodOutcome(
      goalsEarned,
      period.goalBudget,
      period.thresholds.rewardPercent,
      period.thresholds.penaltyPercent,
    );

    await updatePeriod(familyId, periodId, {
      status: 'completed',
      outcome,
      goalsEarned,
      goalsPending: 0,
    });
  },
}));
