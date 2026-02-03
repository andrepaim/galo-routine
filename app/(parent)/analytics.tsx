import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Icon, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays, startOfDay } from 'date-fns';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Layout, TASK_CATEGORIES, getCategoryById } from '../../constants';
import { useAuthStore, useCompletionStore, usePeriodStore, useTaskStore } from '../../lib/stores';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { StreakDisplay } from '../../components/streaks/StreakDisplay';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function AnalyticsScreen() {
  const family = useAuthStore((s) => s.family);
  const { tasks } = useTaskStore();
  const { completions } = useCompletionStore();
  const { periods } = usePeriodStore();
  const starProgress = useStarBudget();

  const completedPeriods = periods.filter((p) => p.status === 'completed');

  // Compute task completion rates
  const taskStats = useMemo(() => {
    const stats: Record<string, { name: string; total: number; approved: number; category?: string }> = {};
    for (const c of completions) {
      if (!stats[c.taskId]) {
        const task = tasks.find((t) => t.id === c.taskId);
        stats[c.taskId] = { name: c.taskName, total: 0, approved: 0, category: task?.category };
      }
      stats[c.taskId].total++;
      if (c.status === 'approved') stats[c.taskId].approved++;
    }
    return Object.values(stats).sort((a, b) => {
      const rateA = a.total > 0 ? a.approved / a.total : 0;
      const rateB = b.total > 0 ? b.approved / b.total : 0;
      return rateA - rateB;
    });
  }, [completions, tasks]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; approved: number }> = {};
    for (const c of completions) {
      const task = tasks.find((t) => t.id === c.taskId);
      const cat = task?.category ?? 'other';
      if (!stats[cat]) stats[cat] = { total: 0, approved: 0 };
      stats[cat].total++;
      if (c.status === 'approved') stats[cat].approved++;
    }
    return Object.entries(stats)
      .map(([id, data]) => ({ id, ...data, rate: data.total > 0 ? data.approved / data.total : 0 }))
      .sort((a, b) => b.rate - a.rate);
  }, [completions, tasks]);

  // Overall completion rate
  const overallRate = completions.length > 0
    ? completions.filter((c) => c.status === 'approved').length / completions.length
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Overview */}
        <Animated.View entering={FadeInUp.duration(400)}>
          <Card style={styles.overviewCard}>
            <Card.Content style={styles.overviewContent}>
              <View style={styles.overviewStat}>
                <Text variant="headlineMedium" style={styles.overviewNumber}>
                  {Math.round(overallRate * 100)}%
                </Text>
                <Text variant="bodySmall" style={styles.overviewLabel}>
                  Completion Rate
                </Text>
              </View>
              <View style={styles.overviewStat}>
                <StreakDisplay
                  currentStreak={family?.currentStreak ?? 0}
                  bestStreak={family?.bestStreak ?? 0}
                  compact
                />
              </View>
              {starProgress && (
                <View style={styles.overviewStat}>
                  <Text variant="headlineMedium" style={styles.overviewNumber}>
                    {Math.round(starProgress.earnedPercent)}%
                  </Text>
                  <Text variant="bodySmall" style={styles.overviewLabel}>
                    Stars Earned
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Category Breakdown */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Category Breakdown
          </Text>
          <Card style={styles.card}>
            <Card.Content style={styles.categoryList}>
              {categoryStats.map((stat) => {
                const cat = getCategoryById(stat.id);
                return (
                  <View key={stat.id} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <Icon source={cat?.icon ?? 'dots-horizontal'} size={20} color={cat?.color ?? Colors.textSecondary} />
                      <Text variant="bodyMedium" style={styles.categoryName}>
                        {cat?.name ?? 'Other'}
                      </Text>
                    </View>
                    <View style={styles.categoryBar}>
                      <ProgressBar
                        progress={stat.rate}
                        color={cat?.color ?? Colors.textSecondary}
                        style={styles.progressBar}
                      />
                    </View>
                    <Text variant="bodySmall" style={styles.categoryPercent}>
                      {Math.round(stat.rate * 100)}%
                    </Text>
                  </View>
                );
              })}
              {categoryStats.length === 0 && (
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No data yet
                </Text>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Task Analysis */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Task Analysis
          </Text>
          <Card style={styles.card}>
            <Card.Content>
              {taskStats.slice(0, 10).map((stat) => {
                const rate = stat.total > 0 ? stat.approved / stat.total : 0;
                const cat = getCategoryById(stat.category);
                return (
                  <View key={stat.name} style={styles.taskRow}>
                    <View style={styles.taskInfo}>
                      <Text variant="bodyMedium" numberOfLines={1} style={styles.taskName}>
                        {stat.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.taskMeta}>
                        {stat.approved}/{stat.total} completed
                      </Text>
                    </View>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.taskRate,
                        { color: rate >= 0.8 ? Colors.reward : rate < 0.5 ? Colors.penalty : Colors.neutral },
                      ]}
                    >
                      {Math.round(rate * 100)}%
                    </Text>
                  </View>
                );
              })}
              {taskStats.length === 0 && (
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No data yet
                </Text>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Period History */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Period History
          </Text>
          {completedPeriods.slice(0, 5).map((period) => {
            const starPercent = period.starBudget > 0
              ? Math.round((period.starsEarned / period.starBudget) * 100)
              : 0;
            const outcomeColor =
              period.outcome === 'reward' ? Colors.reward
              : period.outcome === 'penalty' ? Colors.penalty
              : Colors.neutral;

            return (
              <Card key={period.id} style={styles.periodCard}>
                <Card.Content style={styles.periodContent}>
                  <View style={styles.periodInfo}>
                    <Text variant="bodyMedium" style={styles.periodDates}>
                      {format(period.startDate.toDate(), 'MMM d')} - {format(period.endDate.toDate(), 'MMM d')}
                    </Text>
                    <Text variant="bodySmall" style={styles.periodStars}>
                      {period.starsEarned}/{period.starBudget} stars ({starPercent}%)
                    </Text>
                  </View>
                  <View style={[styles.outcomeBadge, { backgroundColor: outcomeColor + '20' }]}>
                    <Text variant="labelSmall" style={{ color: outcomeColor, fontWeight: 'bold' }}>
                      {period.outcome?.toUpperCase() ?? 'N/A'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })}
          {completedPeriods.length === 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No completed periods yet
                </Text>
              </Card.Content>
            </Card>
          )}
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
    paddingBottom: Layout.padding.xl * 2,
  },
  overviewCard: {
    backgroundColor: Colors.primaryContainer,
    marginBottom: Layout.padding.lg,
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  overviewLabel: {
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.padding.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    marginBottom: Layout.padding.lg,
  },
  categoryList: {
    gap: Layout.padding.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.xs,
    width: 120,
  },
  categoryName: {
    color: Colors.text,
    fontSize: 13,
  },
  categoryBar: {
    flex: 1,
  },
  progressBar: {
    borderRadius: 4,
    height: 6,
  },
  categoryPercent: {
    width: 35,
    textAlign: 'right',
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    color: Colors.text,
  },
  taskMeta: {
    color: Colors.textSecondary,
  },
  taskRate: {
    fontWeight: 'bold',
    width: 45,
    textAlign: 'right',
  },
  periodCard: {
    backgroundColor: Colors.surface,
    marginBottom: Layout.padding.sm,
  },
  periodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodInfo: {
    flex: 1,
  },
  periodDates: {
    color: Colors.text,
  },
  periodStars: {
    color: Colors.textSecondary,
  },
  outcomeBadge: {
    paddingHorizontal: Layout.padding.sm,
    paddingVertical: Layout.padding.xs,
    borderRadius: Layout.radius.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Layout.padding.md,
  },
});
