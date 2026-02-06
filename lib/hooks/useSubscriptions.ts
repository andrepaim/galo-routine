import { useEffect } from 'react';
import {
  useAuthStore,
  useTaskStore,
  usePeriodStore,
  useCompletionStore,
  useRewardStore,
  useGoalStore,
  useBadgeStore,
} from '../stores';
import { subscribeToFamily } from '../firebase/firestore';

/**
 * Subscribe to all Firestore collections for the current family.
 * Should be called once in the root layout after auth is confirmed.
 */
export function useSubscriptions() {
  const familyId = useAuthStore((s) => s.familyId);
  const activePeriod = usePeriodStore((s) => s.activePeriod);

  useEffect(() => {
    if (!familyId) return;

    // DEV MODE: Set mock data instead of subscribing to Firestore
    if (familyId === 'dev-family-123') {
      console.log('[DEV] Setting up mock store data - familyId:', familyId);
      
      // Force immediate state update
      setTimeout(() => {
        console.log('[DEV] Delayed mock setup executing');
      }, 0);
      
      // Mock tasks - need isActive: true for them to show!
      useTaskStore.setState({
        tasks: [
          { id: 'task-1', name: 'Escovar os dentes', category: 'hygiene', starValue: 2, startTime: '07:00', endTime: '07:15', recurrence: { type: 'daily' }, isActive: true },
          { id: 'task-2', name: 'Fazer lição de casa', category: 'school', starValue: 3, startTime: '14:00', endTime: '15:00', recurrence: { type: 'daily' }, isActive: true },
          { id: 'task-3', name: 'Arrumar o quarto', category: 'chores', starValue: 2, startTime: '08:00', endTime: '08:30', recurrence: { type: 'daily' }, isActive: true },
          { id: 'task-4', name: 'Ler um livro', category: 'study', starValue: 3, startTime: '19:00', endTime: '19:30', recurrence: { type: 'daily' }, isActive: true },
          { id: 'task-5', name: 'Treinar futebol ⚽', category: 'exercise', starValue: 4, startTime: '16:00', endTime: '17:00', recurrence: { type: 'specific_days', days: [1, 3, 5] }, isActive: true },
        ] as any,
        isLoading: false,
      });

      // Mock periods - need toDate() methods to mimic Firestore Timestamps
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - periodStart.getDay()); // Start of week
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      
      // Create mock Timestamp-like objects
      const mockTimestamp = (date: Date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      });

      const mockPeriod = {
        id: 'period-1',
        startDate: mockTimestamp(periodStart),
        endDate: mockTimestamp(periodEnd),
        status: 'active',
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
        periods: [mockPeriod] as any,
        activePeriod: mockPeriod as any,
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
            date: mockTimestamp(now), 
            status: 'approved', 
            starsEarned: 2 
          },
        ] as any,
        isLoading: false,
      });

      // Mock rewards
      useRewardStore.setState({
        rewards: [
          { id: 'reward-1', name: '30 min de videogame', starCost: 10, icon: 'gamepad-variant' },
          { id: 'reward-2', name: 'Filme à noite', starCost: 15, icon: 'movie' },
          { id: 'reward-3', name: 'Sorvete', starCost: 8, icon: 'ice-cream' },
        ] as any,
        redemptions: [],
        isLoading: false,
      });

      // Mock goals
      useGoalStore.setState({
        goals: [
          { id: 'goal-1', name: 'Bicicleta nova', targetStars: 500, currentStars: 150, deadline: '2026-06-01' },
        ] as any,
        isLoading: false,
      });

      // Mock badges
      useBadgeStore.setState({
        earnedBadges: [
          { id: 'badge-1', badgeId: 'first_star', earnedAt: now.toISOString() },
        ] as any,
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
    unsubs.push(useGoalStore.getState().subscribe(familyId));
    unsubs.push(useBadgeStore.getState().subscribe(familyId));

    return () => unsubs.forEach((u) => u());
  }, [familyId]);

  // Subscribe to completions when we have an active period
  useEffect(() => {
    if (!familyId || !activePeriod?.id) return;

    const unsub = useCompletionStore.getState().subscribe(familyId, activePeriod.id);
    return () => unsub();
  }, [familyId, activePeriod?.id]);
}
