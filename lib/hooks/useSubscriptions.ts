import { useEffect } from 'react';
import { format } from 'date-fns';
import {
  useAuthStore,
  useTaskStore,
  usePeriodStore,
  useCompletionStore,
  useRewardStore,
  useGoalStore,
  useBadgeStore,
  useChampionshipStore,
} from '../stores';
import { subscribeToFamily } from '../firebase/firestore';

/**
 * Subscribe to all Firestore collections for the current family.
 * Should be called once in the root layout after auth is confirmed.
 */
export function useSubscriptions() {
  const familyId = useAuthStore((s) => s.familyId);
  const activePeriod = usePeriodStore((s) => s.activePeriod);
  const championship = useChampionshipStore((s) => s.championship);

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
          { id: 'task-1', name: 'Escovar os dentes', category: 'hygiene', goals: 2, startTime: '07:00', endTime: '07:15', recurrence: { type: 'daily' }, isActive: true, taskType: 'routine' },
          { id: 'task-2', name: 'Fazer lição de casa', category: 'school', goals: 3, startTime: '14:00', endTime: '15:00', recurrence: { type: 'daily' }, isActive: true, taskType: 'routine' },
          { id: 'task-3', name: 'Arrumar o quarto', category: 'chores', goals: 2, startTime: '08:00', endTime: '08:30', recurrence: { type: 'daily' }, isActive: true, taskType: 'routine' },
          { id: 'task-4', name: 'Ler um livro', category: 'study', goals: 3, startTime: '19:00', endTime: '19:30', recurrence: { type: 'daily' }, isActive: true, taskType: 'routine' },
          { id: 'task-5', name: 'Treinar futebol ⚽', category: 'exercise', goals: 4, startTime: '16:00', endTime: '17:00', recurrence: { type: 'specific_days', days: [1, 3, 5] }, isActive: true, taskType: 'routine' },
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
        goalBudget: 50,
        goalsEarned: 12,
        goalsPending: 3,
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
            taskGoalValue: 2,
            date: mockTimestamp(now), 
            status: 'approved', 
            goalsEarned: 2
          },
        ] as any,
        isLoading: false,
      });

      // Mock rewards
      useRewardStore.setState({
        rewards: [
          { id: 'reward-1', name: '30 min de videogame', goalCost: 10, icon: 'gamepad-variant' },
          { id: 'reward-2', name: 'Filme à noite', goalCost: 15, icon: 'movie' },
          { id: 'reward-3', name: 'Sorvete', goalCost: 8, icon: 'ice-cream' },
        ] as any,
        redemptions: [],
        isLoading: false,
      });

      // Mock goals
      useGoalStore.setState({
        goals: [
          { id: 'goal-1', name: 'Bicicleta nova', targetGoals: 500, currentGoals: 150, deadline: '2026-06-01' },
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

      // Mock championship
      useChampionshipStore.setState({
        championship: null,
        todayMatch: null,
        trophies: [],
        isLoading: false,
        isMatchLoading: false,
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
    unsubs.push(useChampionshipStore.getState().subscribeChampionship(familyId));
    unsubs.push(useChampionshipStore.getState().subscribeTrophies(familyId));

    return () => unsubs.forEach((u) => u());
  }, [familyId]);

  // Subscribe to completions when we have an active period
  useEffect(() => {
    if (!familyId || !activePeriod?.id) return;

    const unsub = useCompletionStore.getState().subscribe(familyId, activePeriod.id);
    return () => unsub();
  }, [familyId, activePeriod?.id]);

  // Subscribe to today's match when we have a championship
  useEffect(() => {
    if (!familyId || !championship?.id) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const unsub = useChampionshipStore.getState().subscribeTodayMatch(familyId, championship.id, today);
    return () => unsub();
  }, [familyId, championship?.id]);
}
