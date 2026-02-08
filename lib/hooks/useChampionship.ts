import { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useChampionshipStore } from '../stores/championshipStore';
import { useAuthStore } from '../stores/authStore';
import type { Standing, Championship } from '../types/championship';
import { LeagueId, LEAGUE_CONFIG } from '../../constants/leagueConfig';

interface UseChampionshipReturn {
  championship: Championship | null;
  isLoading: boolean;
  standings: Standing[];
  userStanding: Standing | null;
  userPosition: number;
  leagueName: string;
  totalTeams: number;
  initializeIfNeeded: () => Promise<void>;
}

export function useChampionship(): UseChampionshipReturn {
  const { familyId, childName } = useAuthStore();
  const {
    championship,
    isLoading,
    subscribeChampionship,
    initializeChampionship,
    getUserStanding,
  } = useChampionshipStore();

  // Subscribe to active championship
  useEffect(() => {
    if (!familyId) return;
    const unsubscribe = subscribeChampionship(familyId);
    return unsubscribe;
  }, [familyId]);

  // Initialize championship if none exists
  const initializeIfNeeded = async () => {
    if (!familyId || !childName || championship) return;
    
    // Use familyId as childId since we only have one child per family
    await initializeChampionship(familyId, familyId, childName, 'D');
  };

  const standings = useMemo(() => {
    return championship?.standings || [];
  }, [championship]);

  const userStanding = getUserStanding();
  const userPosition = userStanding?.position || 0;

  const leagueName = championship 
    ? LEAGUE_CONFIG[championship.league as LeagueId]?.name || 'Série D'
    : 'Série D';

  const totalTeams = championship?.teams.length || 0;

  return {
    championship,
    isLoading,
    standings,
    userStanding,
    userPosition,
    leagueName,
    totalTeams,
    initializeIfNeeded,
  };
}
