import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ALL_BADGES } from '../../constants';
import { ChildColors, ChildSizes, TROPHY_EMOJI } from '../../constants/childTheme';
import { useBadgeStore } from '../../lib/stores';
import { BadgeGrid } from '../../components/badges/BadgeGrid';

export default function BadgesScreen() {
  const { earnedBadges } = useBadgeStore();
  const totalBadges = ALL_BADGES.length;
  const earnedCount = earnedBadges.length;
  const progressPercent = totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Card */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.trophyContainer}>
              <Text style={styles.trophyEmoji}>{TROPHY_EMOJI}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>Meus Troféus</Text>
              <Text style={styles.subtitle}>Conquistas desbloqueadas</Text>
            </View>
          </View>
          
          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso</Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressCount}>
              {earnedCount} de {totalBadges} conquistados
            </Text>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon source="shield-star" size={28} color={ChildColors.starGold} />
            <Text style={styles.statNumber}>{earnedCount}</Text>
            <Text style={styles.statLabel}>Conquistados</Text>
          </View>
          <View style={styles.statCard}>
            <Icon source="shield-outline" size={28} color={ChildColors.textMuted} />
            <Text style={styles.statNumber}>{totalBadges - earnedCount}</Text>
            <Text style={styles.statLabel}>Restantes</Text>
          </View>
          <View style={styles.statCard}>
            <Icon source="trophy" size={28} color={ChildColors.accentPurple} />
            <Text style={styles.statNumber}>{totalBadges}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </Animated.View>

        {/* Badges Section */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Todas as Conquistas</Text>
          <BadgeGrid earnedBadges={earnedBadges} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 20,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  trophyContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ChildColors.galoDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    marginTop: 2,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ChildColors.starGold,
  },
  progressBar: {
    height: 8,
    backgroundColor: ChildColors.galoDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ChildColors.starGold,
    borderRadius: 4,
  },
  progressCount: {
    fontSize: 13,
    color: ChildColors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: ChildColors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: 16,
  },
});
