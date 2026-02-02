import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import { Colors, Layout } from '../../constants';
import { useAuthStore, usePeriodStore, useCompletionStore } from '../../lib/stores';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { StarCounter } from '../../components/stars/StarCounter';
import { PeriodSummary } from '../../components/periods/PeriodSummary';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { AnimatedPressable } from '../../components/ui/AnimatedPressable';

export default function ParentHomeScreen() {
  const router = useRouter();
  const parentName = useAuthStore((s) => s.parentName);
  const childName = useAuthStore((s) => s.childName);
  const { activePeriod, isLoading: periodLoading } = useCurrentPeriod();
  const starProgress = useStarBudget();
  const pendingCount = useCompletionStore((s) => s.getPendingCompletions().length);

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

        {/* Active Period */}
        {activePeriod && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Current Period
            </Text>
            <PeriodSummary period={activePeriod} />
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
    marginBottom: Layout.padding.lg,
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
  actionsRow: {
    flexDirection: 'row',
    gap: Layout.padding.md,
  },
  actionButton: {
    flex: 1,
  },
});
