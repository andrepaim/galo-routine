import { useEffect } from 'react';
import {
  useAuthStore,
  useTaskStore,
  usePeriodStore,
  useCompletionStore,
  useRewardStore,
} from '../stores';
import { subscribeToFamily } from '../api/db';

/**
 * Subscribe to all data collections for the current family via SSE + REST API.
 * Should be called once in the root layout after auth is confirmed.
 */
export function useSubscriptions() {
  const familyId = useAuthStore((s) => s.familyId);
  const activePeriod = usePeriodStore((s) => s.activePeriod);

  useEffect(() => {
    if (!familyId) return;

    // DEV MODE: Set mock data instead of subscribing to real API
    if (familyId === 'dev-family-123') {
      console.log('[DEV] Setting up mock store data - familyId:', familyId);

      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - periodStart.getDay()); // Start of week
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);

      // Mock tasks
      useTaskStore.setState({
        tasks: [
          { id: 'task-1', name: 'Escovar os dentes', category: 'hygiene', starValue: 2, startTime: '07:00', endTime: '07:15', recurrence: { type: 'daily' }, isActive: true, description: '' },
          { id: 'task-2', name: 'Fazer lição de casa', category: 'school', starValue: 3, startTime: '14:00', endTime: '15:00', recurrence: { type: 'daily' }, isActive: true, description: '' },
          { id: 'task-3', name: 'Arrumar o quarto', category: 'chores', starValue: 2, startTime: '08:00', endTime: '08:30', recurrence: { type: 'daily' }, isActive: true, description: '' },
          { id: 'task-4', name: 'Ler um livro', category: 'study', starValue: 3, startTime: '19:00', endTime: '19:30', recurrence: { type: 'daily' }, isActive: true, description: '' },
          { id: 'task-5', name: 'Treinar futebol ⚽', category: 'exercise', starValue: 4, startTime: '16:00', endTime: '17:00', recurrence: { type: 'specific_days', days: [1, 3, 5] }, isActive: true, description: '' },
        ],
        isLoading: false,
      });

      // Mock periods — ISO strings instead of Timestamps
      const mockPeriod = {
        id: 'period-1',
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        status: 'active' as const,
        starBudget: 50,
        starsEarned: 12,
        starsPending: 3,
        thresholds: {
          rewardPercent: 80,
          penaltyPercent: 50,
          rewardDescription: 'Você é demais! 🏆',
          penaltyDescription: 'Vamos melhorar amanhã!',
        },
      };

      usePeriodStore.setState({
        periods: [mockPeriod],
        activePeriod: mockPeriod,
        isLoading: false,
      });

      // Mock completions
      useCompletionStore.setState({
        completions: [
          {
            id: 'comp-1',
            taskId: 'task-1',
            taskName: 'Escovar os dentes',
            taskStarValue: 2,
            date: now.toISOString(),
            completedAt: now.toISOString(),
            status: 'approved',
          },
        ],
        isLoading: false,
      });

      // Mock rewards
      useRewardStore.setState({
        rewards: [
          { id: 'reward-1', name: '30 min de videogame', starCost: 10, icon: 'gamepad-variant', description: '', isActive: true, availability: 'unlimited', requiresApproval: true },
          { id: 'reward-2', name: 'Filme à noite', starCost: 15, icon: 'movie', description: '', isActive: true, availability: 'unlimited', requiresApproval: true },
          { id: 'reward-3', name: 'Sorvete', starCost: 8, icon: 'ice-cream', description: '', isActive: true, availability: 'unlimited', requiresApproval: true },
        ],
        redemptions: [],
        isLoading: false,
      });

      return () => {}; // No-op cleanup for dev mode
    }

    const unsubs: (() => void)[] = [];

    // Subscribe to the family document for real-time balance/streak updates
    unsubs.push(subscribeToFamily(familyId, (family) => {
      if (family) {
        useAuthStore.setState({ family });
      }
    }));

    unsubs.push(useTaskStore.getState().subscribe(familyId));
    unsubs.push(usePeriodStore.getState().subscribe(familyId));
    unsubs.push(useRewardStore.getState().subscribeRewards(familyId));
    unsubs.push(useRewardStore.getState().subscribeRedemptions(familyId));
    return () => unsubs.forEach((u) => u());
  }, [familyId]);

  // Subscribe to completions when we have an active period (skip in dev mode)
  useEffect(() => {
    if (!familyId || !activePeriod?.id) return;
    if (familyId === 'dev-family-123') return; // Dev mode: completions already set by first effect

    const unsub = useCompletionStore.getState().subscribe(familyId, activePeriod.id);
    return () => unsub();
  }, [familyId, activePeriod?.id]);
}
