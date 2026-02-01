import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Icon, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout } from '../../constants';
import { usePeriodStore } from '../../lib/stores';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { StarBudgetRing } from '../../components/stars/StarBudgetRing';
import { getRemainingDays } from '../../lib/utils/periodUtils';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function ChildStarsScreen() {
  const { activePeriod, isLoading } = useCurrentPeriod();
  const starProgress = useStarBudget();

  if (isLoading) {
    return <LoadingScreen message="Loading stars..." />;
  }

  if (!activePeriod || !starProgress) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          icon="star-off"
          title="No Stars Yet"
          description="Complete tasks to earn stars!"
        />
      </SafeAreaView>
    );
  }

  const remaining = getRemainingDays(activePeriod);
  const rewardStars = Math.ceil(
    (activePeriod.thresholds.rewardPercent / 100) * activePeriod.starBudget,
  );
  const penaltyStars = Math.ceil(
    (activePeriod.thresholds.penaltyPercent / 100) * activePeriod.starBudget,
  );
  const starsToReward = Math.max(0, rewardStars - starProgress.earned);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.ringContainer}>
          <StarBudgetRing progress={starProgress} size={240} strokeWidth={20} />
        </View>

        <Text variant="titleMedium" style={styles.daysLeft}>
          {remaining} {remaining === 1 ? 'day' : 'days'} left
        </Text>

        {/* Threshold Zones */}
        <Card style={[styles.zoneCard, styles.rewardZone]}>
          <Card.Content style={styles.zoneContent}>
            <Icon source="trophy" size={28} color={Colors.reward} />
            <View style={styles.zoneText}>
              <Text variant="titleSmall" style={{ color: Colors.reward }}>
                Reward Zone ({activePeriod.thresholds.rewardPercent}%+)
              </Text>
              <Text variant="bodySmall" style={styles.zoneDescription}>
                {starProgress.isRewardZone
                  ? 'You made it! ' + activePeriod.thresholds.rewardDescription
                  : `${starsToReward} more stars needed`}
              </Text>
              <ProgressBar
                progress={Math.min(starProgress.earnedPercent / activePeriod.thresholds.rewardPercent, 1)}
                color={Colors.reward}
                style={styles.progressBar}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.zoneCard, styles.neutralZone]}>
          <Card.Content style={styles.zoneContent}>
            <Icon source="minus-circle" size={28} color={Colors.neutral} />
            <View style={styles.zoneText}>
              <Text variant="titleSmall" style={{ color: Colors.neutral }}>
                Neutral Zone ({activePeriod.thresholds.penaltyPercent}%-{activePeriod.thresholds.rewardPercent}%)
              </Text>
              <Text variant="bodySmall" style={styles.zoneDescription}>
                {starProgress.isNeutralZone
                  ? 'Keep going! You can reach the reward zone!'
                  : starProgress.isRewardZone
                    ? 'You\'ve passed this zone!'
                    : 'Keep trying!'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.zoneCard, styles.penaltyZone]}>
          <Card.Content style={styles.zoneContent}>
            <Icon source="alert-circle" size={28} color={Colors.penalty} />
            <View style={styles.zoneText}>
              <Text variant="titleSmall" style={{ color: Colors.penalty }}>
                Penalty Zone (below {activePeriod.thresholds.penaltyPercent}%)
              </Text>
              <Text variant="bodySmall" style={styles.zoneDescription}>
                {starProgress.isPenaltyZone
                  ? activePeriod.thresholds.penaltyDescription
                  : 'You\'re above the penalty zone!'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Star breakdown */}
        <Card style={styles.breakdownCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.breakdownTitle}>
              Star Breakdown
            </Text>
            <View style={styles.breakdownRow}>
              <Text variant="bodyMedium">Stars Earned</Text>
              <Text variant="titleMedium" style={{ color: Colors.reward }}>
                {starProgress.earned}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text variant="bodyMedium">Stars Pending</Text>
              <Text variant="titleMedium" style={{ color: Colors.neutral }}>
                {starProgress.pending}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text variant="bodyMedium">Stars Remaining</Text>
              <Text variant="titleMedium" style={{ color: Colors.textSecondary }}>
                {Math.max(0, starProgress.budget - starProgress.earned - starProgress.pending)}
              </Text>
            </View>
            <View style={[styles.breakdownRow, styles.totalRow]}>
              <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                Total Budget
              </Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {starProgress.budget}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondaryContainer,
  },
  content: {
    padding: Layout.padding.md,
    paddingBottom: Layout.padding.xl * 2,
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: Layout.padding.lg,
  },
  daysLeft: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Layout.padding.lg,
  },
  zoneCard: {
    marginVertical: Layout.padding.xs,
  },
  zoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  zoneText: {
    flex: 1,
  },
  zoneDescription: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rewardZone: {
    backgroundColor: Colors.rewardContainer,
  },
  neutralZone: {
    backgroundColor: Colors.neutralContainer,
  },
  penaltyZone: {
    backgroundColor: Colors.penaltyContainer,
  },
  progressBar: {
    marginTop: Layout.padding.sm,
    borderRadius: 4,
    height: 6,
  },
  breakdownCard: {
    marginTop: Layout.padding.lg,
    backgroundColor: Colors.surface,
  },
  breakdownTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.padding.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.padding.sm,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginTop: Layout.padding.sm,
    paddingTop: Layout.padding.md,
  },
});
