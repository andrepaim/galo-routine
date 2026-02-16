import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { StandingsTable } from '../../components/championship';
import { ChildColors } from '../../constants';
import { Standing } from '../../lib/types/championship';
import { useChampionship } from '../../lib/hooks';
import { useAuthStore } from '../../lib/stores';
import { LeagueId } from '../../constants/leagueConfig';

// Mock standings for dev mode
const mockStandings: Standing[] = [
  { teamId: 'vitor', teamName: 'Vitor', isUser: true, played: 5, won: 4, drawn: 1, lost: 0, goalsFor: 18, goalsAgainst: 6, goalDifference: 12, points: 13, position: 1 },
  { teamId: 'palmeiras', teamName: 'Palmeiras', isUser: false, played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 12, goalsAgainst: 8, goalDifference: 4, points: 10, position: 2 },
  { teamId: 'flamengo', teamName: 'Flamengo', isUser: false, played: 5, won: 3, drawn: 0, lost: 2, goalsFor: 10, goalsAgainst: 9, goalDifference: 1, points: 9, position: 3 },
  { teamId: 'santos', teamName: 'Santos', isUser: false, played: 5, won: 2, drawn: 2, lost: 1, goalsFor: 8, goalsAgainst: 7, goalDifference: 1, points: 8, position: 4 },
  { teamId: 'corinthians', teamName: 'Corinthians', isUser: false, played: 5, won: 2, drawn: 1, lost: 2, goalsFor: 9, goalsAgainst: 10, goalDifference: -1, points: 7, position: 5 },
  { teamId: 'sao-paulo', teamName: 'São Paulo', isUser: false, played: 5, won: 1, drawn: 2, lost: 2, goalsFor: 7, goalsAgainst: 8, goalDifference: -1, points: 5, position: 6 },
  { teamId: 'fluminense', teamName: 'Fluminense', isUser: false, played: 5, won: 1, drawn: 1, lost: 3, goalsFor: 6, goalsAgainst: 11, goalDifference: -5, points: 4, position: 7 },
  { teamId: 'botafogo', teamName: 'Botafogo', isUser: false, played: 5, won: 0, drawn: 2, lost: 3, goalsFor: 5, goalsAgainst: 16, goalDifference: -11, points: 2, position: 8 },
];

export default function TableScreen() {
  const { championship, standings, isLoading } = useChampionship();
  const familyId = useAuthStore((s) => s.familyId);
  
  // Check if in dev mode
  const isDevMode = typeof window !== 'undefined' && window.location.search.includes('dev=');
  
  // Use real data if available, otherwise fall back to mock in dev mode
  const displayStandings = standings.length > 0 ? standings : (isDevMode ? mockStandings : []);
  const league: LeagueId = championship?.league || 'D';
  const userId = championship?.childId || (isDevMode ? 'vitor' : familyId || '');
  const currentRound = championship?.currentRound || (isDevMode ? 2 : 1);
  
  if (!isDevMode && isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Carregando tabela...</Text>
      </View>
    );
  }
  
  if (!isDevMode && displayStandings.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyEmoji}>🏆</Text>
        <Text style={styles.emptyText}>Nenhum campeonato ativo</Text>
        <Text style={styles.emptySubtext}>O campeonato começará em breve!</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StandingsTable
        standings={displayStandings}
        league={league}
        userId={userId}
        currentRound={currentRound}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: ChildColors.textSecondary,
    fontSize: 16,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: ChildColors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    color: ChildColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
