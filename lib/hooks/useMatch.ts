import { useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useChampionshipStore } from '../stores/championshipStore';
import { useAuthStore } from '../stores/authStore';
import type { Match, ChampionshipTask } from '../types/championship';
import { useTodayTasks } from './useTodayTasks';

interface UseMatchReturn {
  match: Match | null;
  isLoading: boolean;
  opponentName: string;
  opponentGoals: number;
  userGoals: number;
  isOpen: boolean;
  result: 'W' | 'D' | 'L' | null;
  initializeMatch: () => Promise<void>;
  closeDay: (tasks: ChampionshipTask[]) => Promise<{ result: 'W' | 'D' | 'L'; newPosition: number }>;
  updateGoals: (goals: number) => Promise<void>;
}

export function useMatch(): UseMatchReturn {
  const { familyId, uid } = useAuthStore();
  const {
    championship,
    todayMatch,
    isMatchLoading,
    subscribeTodayMatch,
    ensureTodayMatch,
    updateUserGoals,
    closeDay: storeCloseDay,
    getOpponentForToday,
  } = useChampionshipStore();

  const today = format(new Date(), 'yyyy-MM-dd');

  // Subscribe to today's match
  useEffect(() => {
    if (!familyId || !championship?.id) return;
    const unsubscribe = subscribeTodayMatch(familyId, championship.id, today);
    return unsubscribe;
  }, [familyId, championship?.id, today]);

  // Get opponent info from championship if match doesn't exist yet
  const opponentInfo = useMemo(() => {
    if (todayMatch) {
      return { name: todayMatch.opponentName, goals: todayMatch.opponentGoals };
    }
    const opponent = getOpponentForToday(today);
    return { name: opponent?.name || 'Adversário', goals: 0 };
  }, [todayMatch, today]);

  const initializeMatch = useCallback(async () => {
    if (!familyId || !championship?.id) return;
    await ensureTodayMatch(familyId, championship.id, today);
  }, [familyId, championship?.id, today]);

  const closeDay = useCallback(async (tasks: ChampionshipTask[]) => {
    if (!familyId || !championship?.id || !todayMatch?.id || !uid) {
      throw new Error('Missing required data to close day');
    }
    return storeCloseDay(familyId, championship.id, todayMatch.id, tasks, uid);
  }, [familyId, championship?.id, todayMatch?.id, uid]);

  const updateGoals = useCallback(async (goals: number) => {
    if (!familyId || !championship?.id || !todayMatch?.id) return;
    await updateUserGoals(familyId, championship.id, todayMatch.id, goals);
  }, [familyId, championship?.id, todayMatch?.id]);

  return {
    match: todayMatch,
    isLoading: isMatchLoading,
    opponentName: opponentInfo.name,
    opponentGoals: opponentInfo.goals,
    userGoals: todayMatch?.userGoals || 0,
    isOpen: todayMatch?.status === 'open',
    result: todayMatch?.result || null,
    initializeMatch,
    closeDay,
    updateGoals,
  };
}

// Hook to sync task completions with match goals
export function useMatchSync(): void {
  const { todayTasks } = useTodayTasks();
  const { match, updateGoals } = useMatch();
  const { championship } = useChampionshipStore();

  useEffect(() => {
    if (!match || match.status !== 'open' || !championship) return;

    // Calculate goals from completed tasks
    const completedGoals = todayTasks
      .filter(t => t.completion?.status === 'approved')
      .reduce((sum, t) => sum + (t.starValue || 1), 0);

    // Only update if different
    if (completedGoals !== match.userGoals) {
      updateGoals(completedGoals);
    }
  }, [todayTasks, match?.status, match?.userGoals]);
}
