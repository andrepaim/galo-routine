import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import { Colors, Layout } from '../../constants';
import { useAuthStore, usePeriodStore, useCompletionStore, useRewardStore } from '../../lib/stores';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { StarCounter } from '../../components/stars/StarCounter';
import { StreakDisplay } from '../../components/streaks/StreakDisplay';
import { PeriodSummary } from '../../components/periods/PeriodSummary';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { AnimatedPressable } from '../../components/ui/AnimatedPressable';

export default function ParentHomeScreen() {
  const router = useRouter();
  const parentName = useAuthStore((s) => s.parentName);
  const childName = useAuthStore((s) => s.childName);
  const family = useAuthStore((s) => s.family);
  const { activePeriod, isLoading: periodLoading } = useCurrentPeriod();
  const starProgress = useStarBudget();
  const pendingCount = useCompletionStore((s) => s.getPendingCompletions().length);
  const pendingRedemptions = useRewardStore((s) => s.redemptions.filter((r) => r.status === 'pending').length);

  if (periodLoading) {
    return <LoadingScreen variant="skeleton-dashboard" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInLeft.duration(400)}>
          <Text variant="headlineSmall" style={styles.greeting}>
            Hello, {parentName || 'Parent'}!
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Managing {childName || 'your child'}'s routine
          </Text>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.statsRow}>
          <AnimatedPressable
            onPress={() => router.push('/(parent)/approvals')}
            haptic="light"
            style={styles.statCardWrapper}
          >
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon source="clock-outline" size={32} color={Colors.neutral} />
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {pendingCount}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Pending
                </Text>
              </Card.Content>
            </Card>
          </AnimatedPressable>

          <Card style={[styles.statCard, styles.statCardWrapper]}>
            <Card.Content style={styles.statContent}>
              {starProgress && (
                <StarCounter
                  earned={starProgress.earned}
                  budget={starProgress.budget}
                  pending={starProgress.pending}
                />
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Star Balance & Streak */}
        <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.statsRow}>
          <Card style={[styles.statCard, styles.statCardWrapper]}>
            <Card.Content style={styles.statContent}>
              <Icon source="star" size={28} color={Colors.starFilled} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {family?.starBalance ?? 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Star Balance
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, styles.statCardWrapper]}>
            <Card.Content style={styles.statContent}>
              <Icon source="fire" size={28} color={(family?.currentStreak ?? 0) > 0 ? Colors.streak : Colors.textLight} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {family?.currentStreak ?? 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Day Streak
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Active Period */}
        {activePeriod && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Current Period
            </Text>
            <PeriodSummary period={activePeriod} />
          </Animated.View>
        )}

        {/* Pending Redemptions */}
        {pendingRedemptions > 0 && (
          <Animated.View entering={FadeInUp.delay(250).duration(400)}>
            <AnimatedPressable
              onPress={() => router.push('/(parent)/rewards/history')}
              haptic="light"
            >
              <Card style={styles.pendingRedemptionCard}>
                <Card.Content style={styles.pendingRedemptionContent}>
                  <Icon source="gift-outline" size={24} color={Colors.neutral} />
                  <Text variant="bodyMedium" style={styles.pendingRedemptionText}>
                    {pendingRedemptions} pending {pendingRedemptions === 1 ? 'redemption' : 'redemptions'} to review
                  </Text>
                  <Icon source="chevron-right" size={20} color={Colors.textSecondary} />
                </Card.Content>
              </Card>
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => router.push('/(parent)/tasks/new')}
              style={styles.actionButton}
            >
              New Task
            </Button>
            <Button
              mode="outlined"
              icon="check-decagram"
              onPress={() => router.push('/(parent)/approvals')}
              style={styles.actionButton}
            >
              Review ({pendingCount})
            </Button>
          </View>
          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              icon="gift"
              onPress={() => router.push('/(parent)/rewards')}
              style={styles.actionButton}
            >
              Rewards
            </Button>
            <Button
              mode="outlined"
              icon="chart-line"
              onPress={() => router.push('/(parent)/analytics')}
              style={styles.actionButton}
            >
              Analytics
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Layout.padding.md,
  },
  greeting: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: Layout.padding.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Layout.padding.md,
    marginBottom: Layout.padding.md,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    backgroundColor: Colors.surface,
    elevation: Layout.elevation.low,
  },
  statContent: {
    alignItems: 'center',
    padding: Layout.padding.md,
  },
  statNumber: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Layout.padding.lg,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.padding.sm,
  },
  pendingRedemptionCard: {
    backgroundColor: Colors.neutralContainer,
    marginBottom: Layout.padding.md,
  },
  pendingRedemptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  pendingRedemptionText: {
    flex: 1,
    color: Colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Layout.padding.md,
    marginBottom: Layout.padding.sm,
  },
  actionButton: {
    flex: 1,
  },
});
