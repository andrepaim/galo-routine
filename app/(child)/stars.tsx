import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import Animated, { 
  FadeInUp, 
  FadeInLeft,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { ChildColors, ChildSizes, STAR_EMOJI, TROPHY_EMOJI, GALO_EMOJI } from '../../constants';
import { useAuthStore, usePeriodStore } from '../../lib/stores';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { getRemainingDays } from '../../lib/utils/periodUtils';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function ChildStarsScreen() {
  const family = useAuthStore((s) => s.family);
  const { activePeriod, isLoading } = useCurrentPeriod();
  const starProgress = useStarBudget();

  // Animated star pulse
  const starPulse = useSharedValue(1);
  React.useEffect(() => {
    starPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starPulse.value }],
  }));

  // Skip loading in dev mode
  const isDevMode = typeof window !== 'undefined' && window.location.search.includes('dev=');
  if (isLoading && !isDevMode) {
    return <LoadingScreen message="Carregando estrelas..." />;
  }

  const lifetimeStars = family?.lifetimeStarsEarned ?? 0;
  const starBalance = family?.starBalance ?? 0;
  const currentStreak = family?.currentStreak ?? 0;
  const bestStreak = family?.bestStreak ?? 0;

  if (!activePeriod || !starProgress) {
    return (
      <View style={styles.container}>
        <Surface style={styles.emptyCard} elevation={0}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyTitle}>Sem Estrelas Ainda</Text>
          <Text style={styles.emptySubtitle}>
            Complete tarefas para ganhar estrelas!
          </Text>
        </Surface>
      </View>
    );
  }

  const remaining = getRemainingDays(activePeriod);
  const rewardStars = Math.ceil(
    (activePeriod.thresholds.rewardPercent / 100) * activePeriod.starBudget,
  );
  const starsToReward = Math.max(0, rewardStars - starProgress.earned);
  const progressPercent = Math.min(starProgress.earnedPercent, 100);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Star Display */}
        <Animated.View entering={ZoomIn.duration(500)} style={styles.heroSection}>
          <Text style={styles.heroLabel}>Estrelas Esta Semana</Text>
          <View style={styles.heroRow}>
            <Animated.Text style={[styles.heroEmoji, starStyle]}>
              {STAR_EMOJI}
            </Animated.Text>
            <Text style={styles.heroNumber}>{starProgress.earned}</Text>
            <Text style={styles.heroTotal}>/ {activePeriod.starBudget}</Text>
          </View>
          <Text style={styles.heroSubtext}>
            {remaining} {remaining === 1 ? 'dia restante' : 'dias restantes'}
          </Text>
        </Animated.View>

        {/* Progress Ring */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Surface style={styles.progressCard} elevation={0}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progresso</Text>
              <Text style={[
                styles.progressPercent,
                progressPercent >= 80 ? styles.percentGood : 
                progressPercent >= 50 ? styles.percentOk : styles.percentLow
              ]}>
                {Math.round(progressPercent)}%
              </Text>
            </View>
            <ProgressBar
              progress={progressPercent / 100}
              color={
                progressPercent >= 80 ? ChildColors.statusApproved :
                progressPercent >= 50 ? ChildColors.starGold : ChildColors.statusRejected
              }
              style={styles.progressBarBig}
            />
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelLeft}>0%</Text>
              <View style={styles.progressThreshold}>
                <Text style={styles.progressThresholdText}>
                  {activePeriod.thresholds.rewardPercent}% 🏆
                </Text>
              </View>
              <Text style={styles.progressLabelRight}>100%</Text>
            </View>
          </Surface>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.statsGrid}>
          <Surface style={styles.statCard} elevation={0}>
            <Text style={styles.statEmoji}>{STAR_EMOJI}</Text>
            <Text style={styles.statNumber}>{starBalance}</Text>
            <Text style={styles.statLabel}>Para Gastar</Text>
          </Surface>
          
          <Surface style={styles.statCard} elevation={0}>
            <Text style={styles.statEmoji}>💎</Text>
            <Text style={styles.statNumber}>{lifetimeStars}</Text>
            <Text style={styles.statLabel}>Total Ganhas</Text>
          </Surface>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.statsGrid}>
          <Surface style={styles.statCard} elevation={0}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Dias Seguidos</Text>
          </Surface>
          
          <Surface style={styles.statCard} elevation={0}>
            <Text style={styles.statEmoji}>{TROPHY_EMOJI}</Text>
            <Text style={styles.statNumber}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Recorde</Text>
          </Surface>
        </Animated.View>

        {/* Zones */}
        <Animated.View entering={FadeInLeft.delay(500).duration(400)}>
          <Text style={styles.zonesTitle}>Zonas de Meta</Text>
          
          {/* Reward Zone */}
          <Surface style={[styles.zoneCard, styles.zoneReward]} elevation={0}>
            <View style={styles.zoneHeader}>
              <Text style={styles.zoneEmoji}>🏆</Text>
              <Text style={styles.zoneTitle}>Zona de Prêmio</Text>
              <Text style={styles.zonePercent}>{activePeriod.thresholds.rewardPercent}%+</Text>
            </View>
            <Text style={styles.zoneDescription}>
              {starProgress.isRewardZone
                ? `Você conseguiu! ${activePeriod.thresholds.rewardDescription}`
                : `Faltam ${starsToReward} estrelas`}
            </Text>
          </Surface>

          {/* Penalty Zone */}
          <Surface style={[styles.zoneCard, styles.zonePenalty]} elevation={0}>
            <View style={styles.zoneHeader}>
              <Text style={styles.zoneEmoji}>⚠️</Text>
              <Text style={styles.zoneTitle}>Zona de Atenção</Text>
              <Text style={styles.zonePercent}>&lt;{activePeriod.thresholds.penaltyPercent}%</Text>
            </View>
            <Text style={styles.zoneDescription}>
              {starProgress.isPenaltyZone
                ? activePeriod.thresholds.penaltyDescription
                : 'Continue assim para ficar longe dessa zona!'}
            </Text>
          </Surface>
        </Animated.View>

        {/* Mascot encouragement */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)}>
          <Surface style={styles.mascotCard} elevation={0}>
            <Text style={styles.mascotEmoji}>{GALO_EMOJI}</Text>
            <Text style={styles.mascotText}>
              {starProgress.isRewardZone 
                ? 'Você é craque! Continue assim, Campeão!' 
                : starProgress.earnedPercent >= 50
                  ? 'Tá indo bem! Falta pouco pro prêmio!'
                  : 'Vamos lá! Você consegue!'}
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
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: ChildSizes.sectionGap,
  },
  heroLabel: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    marginBottom: 8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroEmoji: {
    fontSize: 48,
    marginRight: 8,
  },
  heroNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: ChildColors.starGold,
  },
  heroTotal: {
    fontSize: 32,
    fontWeight: '600',
    color: ChildColors.textSecondary,
    marginLeft: 8,
  },
  heroSubtext: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    marginTop: 8,
  },
  // Progress Card
  progressCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: ChildSizes.cardPadding,
    marginBottom: ChildSizes.sectionGap,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: '800',
  },
  percentGood: { color: ChildColors.statusApproved },
  percentOk: { color: ChildColors.starGold },
  percentLow: { color: ChildColors.statusRejected },
  progressBarBig: {
    height: 16,
    borderRadius: 8,
    backgroundColor: ChildColors.cardBorder,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressLabelLeft: {
    fontSize: 12,
    color: ChildColors.textMuted,
  },
  progressLabelRight: {
    fontSize: 12,
    color: ChildColors.textMuted,
  },
  progressThreshold: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressThresholdText: {
    fontSize: 12,
    color: ChildColors.statusApproved,
    fontWeight: '600',
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
    fontSize: 28,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: ChildColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: ChildColors.textSecondary,
    marginTop: 4,
  },
  // Zones
  zonesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  zoneCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  zoneReward: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderColor: ChildColors.statusApproved,
  },
  zonePenalty: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderColor: ChildColors.statusRejected,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    flex: 1,
  },
  zonePercent: {
    fontSize: 14,
    fontWeight: '600',
    color: ChildColors.textSecondary,
  },
  zoneDescription: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    lineHeight: 20,
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
  // Empty State
  emptyCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 40,
    margin: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: ChildColors.starGold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
});
