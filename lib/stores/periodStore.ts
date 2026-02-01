import { create } from 'zustand';
import type { Period, Task, FamilySettings } from '../types';
import {
  createPeriod,
  updatePeriod,
  subscribePeriods,
  getActivePeriod,
} from '../firebase/firestore';
import { buildPeriod } from '../utils/periodUtils';
import { determinePeriodOutcome } from '../utils/starCalculations';

interface PeriodStore {
  periods: Period[];
  activePeriod: Period | null;
  isLoading: boolean;
  subscribe: (familyId: string) => () => void;
  ensureActivePeriod: (familyId: string, settings: FamilySettings, tasks: Task[]) => Promise<void>;
  completePeriod: (familyId: string, periodId: string) => Promise<void>;
}

export const usePeriodStore = create<PeriodStore>((set, get) => ({
  periods: [],
  activePeriod: null,
  isLoading: true,

  subscribe: (familyId: string) => {
    set({ isLoading: true });
    const unsubscribe = subscribePeriods(familyId, (periods) => {
      const active = periods.find((p) => p.status === 'active') ?? null;
      set({ periods, activePeriod: active, isLoading: false });
    });
    return unsubscribe;
  },

  ensureActivePeriod: async (familyId: string, settings: FamilySettings, tasks: Task[]) => {
    const existing = await getActivePeriod(familyId);
    if (existing) {
      set({ activePeriod: existing });
      return;
    }
    const period = buildPeriod(settings, tasks);
    const id = await createPeriod(familyId, period);
    set({ activePeriod: { ...period, id } });
  },

  completePeriod: async (familyId: string, periodId: string) => {
    const period = get().periods.find((p) => p.id === periodId);
    if (!period) return;

    const outcome = determinePeriodOutcome(
      period.starsEarned,
      period.starBudget,
      period.thresholds.rewardPercent,
      period.thresholds.penaltyPercent,
    );

    await updatePeriod(familyId, periodId, {
      status: 'completed',
      outcome,
    });
  },
}));
