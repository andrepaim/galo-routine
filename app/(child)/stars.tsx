import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Animated, {
  FadeInUp,
  FadeInLeft,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { ChildColors, ChildSizes, GALO_EMOJI } from '../../constants';
import { useAuthStore } from '../../lib/stores';
import { useChampionship, useMatch } from '../../lib/hooks';
import { StandingsTable, LiveScoreboard } from '../../components/championship';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import type { LeagueId } from '../../constants/leagueConfig';
import { LEAGUE_CONFIG } from '../../constants/leagueConfig';
import type { Standing, Trophy } from '../../lib/types/championship';

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

// Mock trophies for dev mode
const mockTrophies: Trophy[] = [
  { id: '1', familyId: 'f1', childId: 'c1', type: 'championship', championshipId: 'ch1', league: 'D', earnedAt: null as any, title: 'Campeão Série D - Janeiro 2026' },
];
const mockWeeklyTrophies = [true, true, false, false];

export default function ChildChampionshipScreen() {
  const familyId = useAuthStore((s) => s.familyId);
  const childName = useAuthStore((s) => s.childName);
  const {
    championship,
    isLoading,
    standings,
    userStanding,
    userPosition,
    leagueName,
    totalTeams,
    initializeIfNeeded,
  } = useChampionship();

  const {
    match,
    opponentName,
    opponentGoals,
    isOpen: isMatchOpen,
  } = useMatch();

  // Initialize championship on first load if needed
  React.useEffect(() => {
    if (!isLoading && !championship && familyId) {
      initializeIfNeeded();
    }
  }, [isLoading, championship, familyId]);

  // Skip loading in dev mode
  const isDevMode = typeof window !== 'undefined' && window.location.search.includes('dev=');
  if (isLoading && !isDevMode) {
    return <LoadingScreen message="Carregando campeonato..." />;
  }

  if (!championship && !isDevMode) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="trophy-variant"
          title="Sem Campeonato Ativo"
          description="Nenhum campeonato em andamento. Complete tarefas para iniciar um novo campeonato!"
        />
      </View>
    );
  }

  const league: LeagueId = championship?.league as LeagueId || 'D';
  const leagueConfig = LEAGUE_CONFIG[league];
  const promotionSpots = leagueConfig.promotionSpots;
  const inPromotionZone = userPosition > 0 && userPosition <= promotionSpots && league !== 'A';
  const totalRounds = championship?.fixtures?.length
    ? Math.max(...championship.fixtures.map(f => f.round))
    : 4;

  // Data for standings — use real if available, mock for dev
  const displayStandings = standings.length > 0 ? standings : (isDevMode ? mockStandings : []);
  const userId = championship?.childId || (isDevMode ? 'vitor' : familyId || '');
  const currentRound = championship?.currentRound || (isDevMode ? 2 : 1);

  // Mock values for live scoreboard in dev mode
  const displayOpponentName = opponentName !== 'Adversário' ? opponentName : (isDevMode ? 'Palmeiras' : opponentName);
  const displayOpponentGoals = match ? opponentGoals : (isDevMode ? 2 : 0);
  const displayIsLive = match ? isMatchOpen : (isDevMode ? true : false);

  // Trophies — TODO: connect to real store when available
  const trophies = isDevMode ? mockTrophies : [];
  const weeklyTrophies = isDevMode ? mockWeeklyTrophies : [];

  // Mock stats for trophies section
  const stats = {
    totalWins: userStanding?.won ?? (isDevMode ? 23 : 0),
    totalGoals: userStanding?.goalsFor ?? (isDevMode ? 87 : 0),
    bestGoleada: isDevMode ? '7 x 1' : '-',
    currentLeague: leagueName || (isDevMode ? 'Série D' : '-'),
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Match — only when match is active today */}
        {(displayIsLive || isDevMode) && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <LiveScoreboard
              userName={childName || 'Vitor'}
              userGoals={userStanding?.goalsFor ?? 0}
              opponentName={displayOpponentName}
              opponentGoals={displayOpponentGoals}
              isLive={displayIsLive}
            />
          </Animated.View>
        )}

        {/* League Info Card */}
        <Animated.View entering={ZoomIn.duration(500)}>
          <Surface style={styles.leagueCard} elevation={0}>
            <Text style={styles.leagueEmoji}>🏟️</Text>
            <Text style={styles.leagueName}>{leagueName || 'Série D'}</Text>
            <Text style={styles.leagueSubtitle}>
              Rodada {currentRound} de {totalRounds}
            </Text>
          </Surface>
        </Animated.View>

        {/* User Position Card */}
        {(userStanding || isDevMode) && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Surface style={[
              styles.positionCard,
              inPromotionZone && styles.positionCardPromotion,
            ]} elevation={0}>
              <View style={styles.positionHeader}>
                <Text style={styles.positionLabel}>Sua Posição</Text>
                {inPromotionZone && (
                  <View style={styles.promotionBadge}>
                    <Text style={styles.promotionBadgeText}>Zona de Promoção</Text>
                  </View>
                )}
              </View>
              <View style={styles.positionRow}>
                <Text style={styles.positionNumber}>{userPosition || 1}º</Text>
                <Text style={styles.positionTotal}>de {totalTeams || 8}</Text>
              </View>
            </Surface>
          </Animated.View>
        )}

        {/* Stats Grid */}
        {(userStanding || isDevMode) && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.statsGrid}>
            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statNumber}>{userStanding?.won ?? 4}</Text>
              <Text style={styles.statLabel}>Vitórias</Text>
            </Surface>

            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>🤝</Text>
              <Text style={styles.statNumber}>{userStanding?.drawn ?? 1}</Text>
              <Text style={styles.statLabel}>Empates</Text>
            </Surface>

            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>❌</Text>
              <Text style={styles.statNumber}>{userStanding?.lost ?? 0}</Text>
              <Text style={styles.statLabel}>Derrotas</Text>
            </Surface>
          </Animated.View>
        )}

        {/* Goals & Points Row */}
        {(userStanding || isDevMode) && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.statsGrid}>
            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>⚽</Text>
              <Text style={styles.statNumber}>{userStanding?.goalsFor ?? 18}</Text>
              <Text style={styles.statLabel}>Gols Marcados</Text>
            </Surface>

            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statNumber}>{userStanding?.points ?? 13}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </Surface>

            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={[
                styles.statNumber,
                (userStanding?.goalDifference ?? 12) > 0 && styles.positiveGD,
                (userStanding?.goalDifference ?? 12) < 0 && styles.negativeGD,
              ]}>
                {(userStanding?.goalDifference ?? 12) > 0 ? '+' : ''}{userStanding?.goalDifference ?? 12}
              </Text>
              <Text style={styles.statLabel}>Saldo de Gols</Text>
            </Surface>
          </Animated.View>
        )}

        {/* Full Standings Table */}
        {displayStandings.length > 0 && (
          <Animated.View entering={FadeInLeft.delay(500).duration(400)}>
            <View style={styles.tableSection}>
              <Text style={styles.sectionTitle}>Classificação</Text>
              <View style={styles.tableContainer}>
                <StandingsTable
                  standings={displayStandings}
                  league={league}
                  userId={userId}
                  currentRound={currentRound}
                  totalRounds={totalRounds}
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Trophies Section */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)}>
          <Text style={styles.sectionTitle}>Troféus</Text>

          {/* Championship Titles */}
          {trophies.filter(t => t.type === 'championship').length > 0 ? (
            trophies.filter(t => t.type === 'championship').map((trophy) => (
              <Surface key={trophy.id} style={styles.trophyCard} elevation={0}>
                <View style={styles.trophyIcon}>
                  <Text style={styles.trophyEmoji}>🏆</Text>
                </View>
                <View style={styles.trophyInfo}>
                  <Text style={styles.trophyTitle}>{trophy.title}</Text>
                  <Text style={styles.trophySubtitle}>{trophy.league}</Text>
                </View>
              </Surface>
            ))
          ) : (
            <Surface style={styles.emptyTrophyCard} elevation={0}>
              <Text style={styles.emptyTrophyEmoji}>🎯</Text>
              <Text style={styles.emptyTrophyText}>Seu primeiro título está a caminho!</Text>
              <Text style={styles.emptyTrophySubtext}>Termine no topo da tabela no fim do mês</Text>
            </Surface>
          )}

          {/* Weekly Trophies */}
          <Text style={styles.subSectionTitle}>Troféus Semanais</Text>
          <View style={styles.weeklyRow}>
            {[1, 2, 3, 4].map((week) => {
              const hasWon = weeklyTrophies[week - 1];
              return (
                <View key={week} style={styles.weeklyItem}>
                  <View style={[styles.weeklyTrophy, hasWon && styles.weeklyTrophyWon]}>
                    <Text style={styles.weeklyEmoji}>{hasWon ? '🏆' : '⬜'}</Text>
                  </View>
                  <Text style={styles.weeklyLabel}>Sem. {week}</Text>
                </View>
              );
            })}
          </View>

          {/* Stats Card */}
          <Surface style={styles.trophyStatsCard} elevation={0}>
            <View style={styles.trophyStatRow}>
              <Text style={styles.trophyStatLabel}>⚽ Vitórias</Text>
              <Text style={styles.trophyStatValue}>{stats.totalWins}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.trophyStatRow}>
              <Text style={styles.trophyStatLabel}>🥅 Gols marcados</Text>
              <Text style={styles.trophyStatValue}>{stats.totalGoals}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.trophyStatRow}>
              <Text style={styles.trophyStatLabel}>🏟️ Liga atual</Text>
              <Text style={styles.trophyStatValue}>{stats.currentLeague}</Text>
            </View>
          </Surface>
        </Animated.View>

        {/* Mascot Encouragement */}
        <Animated.View entering={FadeInUp.delay(700).duration(400)}>
          <Surface style={styles.mascotCard} elevation={0}>
            <Text style={styles.mascotEmoji}>{GALO_EMOJI}</Text>
            <Text style={styles.mascotText}>
              {inPromotionZone
                ? 'Você está na zona de promoção! Continue assim, Campeão!'
                : (userPosition || 1) <= Math.ceil((totalTeams || 8) / 2)
                  ? 'Boa posição! Falta pouco para a zona de promoção!'
                  : 'Vamos subir na tabela! Complete suas tarefas!'}
            </Text>
          </Surface>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // League Card
  leagueCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: ChildSizes.cardPadding,
    alignItems: 'center',
    marginBottom: ChildSizes.sectionGap,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
  },
  leagueEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  leagueName: {
    fontSize: 28,
    fontWeight: '900',
    color: ChildColors.starGold,
  },
  leagueSubtitle: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    marginTop: 4,
  },
  // Position Card
  positionCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: ChildSizes.cardPadding,
    marginBottom: ChildSizes.sectionGap,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  positionCardPromotion: {
    borderColor: '#2ECC71',
    borderWidth: 2,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionLabel: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    fontWeight: '600',
  },
  promotionBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promotionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2ECC71',
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  positionNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: ChildColors.starGold,
  },
  positionTotal: {
    fontSize: 24,
    fontWeight: '600',
    color: ChildColors.textSecondary,
    marginLeft: 8,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: ChildSizes.itemGap,
  },
  statCard: {
    flex: 1,
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: ChildColors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: ChildColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  positiveGD: {
    color: '#2ECC71',
  },
  negativeGD: {
    color: '#E74C3C',
  },
  // Table Section
  tableSection: {
    marginBottom: ChildSizes.sectionGap,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ChildColors.textSecondary,
    marginBottom: 12,
    marginTop: 16,
  },
  tableContainer: {
    borderRadius: ChildSizes.cardRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  // Trophy Section
  trophyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
  },
  trophyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ChildColors.galoBlack,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trophyEmoji: {
    fontSize: 32,
  },
  trophyInfo: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    marginBottom: 4,
  },
  trophySubtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  emptyTrophyCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
    marginBottom: 8,
  },
  emptyTrophyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTrophyText: {
    fontSize: 16,
    fontWeight: '600',
    color: ChildColors.textPrimary,
    marginBottom: 4,
  },
  emptyTrophySubtext: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  // Weekly Trophies
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weeklyItem: {
    alignItems: 'center',
  },
  weeklyTrophy: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ChildColors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: ChildColors.cardBorder,
  },
  weeklyTrophyWon: {
    borderColor: ChildColors.starGold,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  weeklyEmoji: {
    fontSize: 28,
  },
  weeklyLabel: {
    fontSize: 12,
    color: ChildColors.textSecondary,
  },
  // Trophy Stats
  trophyStatsCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
    marginBottom: ChildSizes.sectionGap,
  },
  trophyStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  trophyStatLabel: {
    fontSize: 16,
    color: ChildColors.textPrimary,
  },
  trophyStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.starGold,
  },
  divider: {
    height: 1,
    backgroundColor: ChildColors.cardBorder,
  },
  // Mascot Card
  mascotCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
    marginTop: 8,
  },
  mascotEmoji: {
    fontSize: 48,
  },
  mascotText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: ChildColors.starGold,
    lineHeight: 22,
  },
});
