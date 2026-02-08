import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Animated, {
  FadeInUp,
  FadeInLeft,
  ZoomIn,
} from 'react-native-reanimated';
import { ChildColors, ChildSizes, GALO_EMOJI } from '../../constants';
import { useAuthStore } from '../../lib/stores';
import { useChampionship } from '../../lib/hooks/useChampionship';
import { StandingsTable } from '../../components/championship/StandingsTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import type { LeagueId } from '../../constants/leagueConfig';
import { LEAGUE_CONFIG } from '../../constants/leagueConfig';

export default function ChildChampionshipScreen() {
  const familyId = useAuthStore((s) => s.familyId);
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

  if (!championship) {
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

  const league = championship.league as LeagueId;
  const leagueConfig = LEAGUE_CONFIG[league];
  const promotionSpots = leagueConfig.promotionSpots;
  const inPromotionZone = userPosition > 0 && userPosition <= promotionSpots && league !== 'A';
  const totalRounds = championship.fixtures.length > 0
    ? Math.max(...championship.fixtures.map(f => f.round))
    : 4;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* League Info Card */}
        <Animated.View entering={ZoomIn.duration(500)}>
          <Surface style={styles.leagueCard} elevation={0}>
            <Text style={styles.leagueEmoji}>🏟️</Text>
            <Text style={styles.leagueName}>{leagueName}</Text>
            <Text style={styles.leagueSubtitle}>
              Rodada {championship.currentRound} de {totalRounds}
            </Text>
          </Surface>
        </Animated.View>

        {/* User Position Card */}
        {userStanding && (
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
                <Text style={styles.positionNumber}>{userPosition}º</Text>
                <Text style={styles.positionTotal}>de {totalTeams}</Text>
              </View>
            </Surface>
          </Animated.View>
        )}

        {/* Stats Grid */}
        {userStanding && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.statsGrid}>
            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statNumber}>{userStanding.won}</Text>
              <Text style={styles.statLabel}>Vitórias</Text>
            </Surface>

            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>🤝</Text>
              <Text style={styles.statNumber}>{userStanding.drawn}</Text>
              <Text style={styles.statLabel}>Empates</Text>
            </Surface>

            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>❌</Text>
              <Text style={styles.statNumber}>{userStanding.lost}</Text>
              <Text style={styles.statLabel}>Derrotas</Text>
            </Surface>
          </Animated.View>
        )}

        {/* Goals & Points Row */}
        {userStanding && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.statsGrid}>
            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>⚽</Text>
              <Text style={styles.statNumber}>{userStanding.goalsFor}</Text>
              <Text style={styles.statLabel}>Gols Marcados</Text>
            </Surface>

            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statNumber}>{userStanding.points}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </Surface>

            <Surface style={styles.statCard} elevation={0}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={[
                styles.statNumber,
                userStanding.goalDifference > 0 && styles.positiveGD,
                userStanding.goalDifference < 0 && styles.negativeGD,
              ]}>
                {userStanding.goalDifference > 0 ? '+' : ''}{userStanding.goalDifference}
              </Text>
              <Text style={styles.statLabel}>Saldo de Gols</Text>
            </Surface>
          </Animated.View>
        )}

        {/* Mini Standings Table */}
        <Animated.View entering={FadeInLeft.delay(500).duration(400)}>
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>Classificação</Text>
            <View style={styles.tableContainer}>
              <StandingsTable
                standings={standings}
                league={league}
                userId={familyId || ''}
                currentRound={championship.currentRound}
                totalRounds={totalRounds}
              />
            </View>
          </View>
        </Animated.View>

        {/* Mascot Encouragement */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)}>
          <Surface style={styles.mascotCard} elevation={0}>
            <Text style={styles.mascotEmoji}>{GALO_EMOJI}</Text>
            <Text style={styles.mascotText}>
              {inPromotionZone
                ? 'Você está na zona de promoção! Continue assim, Campeão!'
                : userPosition <= Math.ceil(totalTeams / 2)
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
  tableContainer: {
    borderRadius: ChildSizes.cardRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
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
