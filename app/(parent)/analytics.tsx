import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Icon, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { TASK_CATEGORIES, getCategoryById } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { useAuthStore, useCompletionStore, usePeriodStore, useTaskStore } from '../../lib/stores';
import { useGoalBudget } from '../../lib/hooks/useGoalBudget';
import { StreakDisplay } from '../../components/streaks/StreakDisplay';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function AnalyticsScreen() {
  const family = useAuthStore((s) => s.family);
  const { tasks } = useTaskStore();
  const { completions } = useCompletionStore();
  const { periods } = usePeriodStore();
  const starProgress = useGoalBudget();

  const completedPeriods = periods.filter((p) => p.status === 'completed');

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

  const overallRate = completions.length > 0
    ? completions.filter((c) => c.status === 'approved').length / completions.length
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInUp.duration(400)}>
          <Card style={styles.overviewCard}>
            <Card.Content style={styles.overviewContent}>
              <View style={styles.overviewStat}>
                <Text variant="headlineMedium" style={styles.overviewNumber}>
                  {Math.round(overallRate * 100)}%
                </Text>
                <Text variant="bodySmall" style={styles.overviewLabel}>
                  Taxa de Conclusão
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
                    Gols Marcados
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Por Categoria
          </Text>
          <Card style={styles.card}>
            <Card.Content style={styles.categoryList}>
              {categoryStats.map((stat) => {
                const cat = getCategoryById(stat.id);
                return (
                  <View key={stat.id} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <Icon source={cat?.icon ?? 'dots-horizontal'} size={20} color={cat?.color ?? ChildColors.textSecondary} />
                      <Text variant="bodyMedium" style={styles.categoryName}>
                        {cat?.name ?? 'Outros'}
                      </Text>
                    </View>
                    <View style={styles.categoryBar}>
                      <ProgressBar
                        progress={stat.rate}
                        color={cat?.color ?? ChildColors.starGold}
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
                  Sem dados ainda
                </Text>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Análise de Tarefas
          </Text>
          <Card style={styles.card}>
            <Card.Content>
              {taskStats.slice(0, 10).map((stat) => {
                const rate = stat.total > 0 ? stat.approved / stat.total : 0;
                return (
                  <View key={stat.name} style={styles.taskRow}>
                    <View style={styles.taskInfo}>
                      <Text variant="bodyMedium" numberOfLines={1} style={styles.taskName}>
                        {stat.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.taskMeta}>
                        {stat.approved}/{stat.total} concluídas
                      </Text>
                    </View>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.taskRate,
                        { color: rate >= 0.8 ? ChildColors.accentGreen : rate < 0.5 ? ChildColors.accentRed : ChildColors.starGold },
                      ]}
                    >
                      {Math.round(rate * 100)}%
                    </Text>
                  </View>
                );
              })}
              {taskStats.length === 0 && (
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Sem dados ainda
                </Text>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Histórico de Períodos
          </Text>
          {completedPeriods.slice(0, 5).map((period) => {
            const goalPercent = period.goalBudget > 0
              ? Math.round((period.goalsEarned / period.goalBudget) * 100)
              : 0;
            const outcomeColor =
              period.outcome === 'reward' ? ChildColors.accentGreen
              : period.outcome === 'penalty' ? ChildColors.accentRed
              : ChildColors.starGold;

            return (
              <Card key={period.id} style={styles.periodCard}>
                <Card.Content style={styles.periodContent}>
                  <View style={styles.periodInfo}>
                    <Text variant="bodyMedium" style={styles.periodDates}>
                      {format(period.startDate.toDate(), "d 'de' MMM", { locale: ptBR })} - {format(period.endDate.toDate(), "d 'de' MMM", { locale: ptBR })}
                    </Text>
                    <Text variant="bodySmall" style={styles.periodStars}>
                      {period.goalsEarned}/{period.goalBudget} gols ({goalPercent}%)
                    </Text>
                  </View>
                  <View style={[styles.outcomeBadge, { backgroundColor: outcomeColor + '20' }]}>
                    <Text variant="labelSmall" style={{ color: outcomeColor, fontWeight: 'bold' }}>
                      {period.outcome === 'reward' ? 'PRÊMIO' : period.outcome === 'penalty' ? 'PENALIDADE' : 'NEUTRO'}
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
                  Nenhum período concluído ainda
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
    backgroundColor: ChildColors.galoBlack,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  overviewCard: {
    backgroundColor: ChildColors.cardBackground,
    marginBottom: 24,
    borderRadius: ChildSizes.cardRadius,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontWeight: 'bold',
    color: ChildColors.starGold,
  },
  overviewLabel: {
    color: ChildColors.textSecondary,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: ChildColors.cardBackground,
    marginBottom: 24,
    borderRadius: ChildSizes.cardRadius,
  },
  categoryList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 120,
  },
  categoryName: {
    color: ChildColors.textPrimary,
    fontSize: 13,
  },
  categoryBar: {
    flex: 1,
  },
  progressBar: {
    borderRadius: 4,
    height: 6,
    backgroundColor: ChildColors.cardBorder,
  },
  categoryPercent: {
    width: 35,
    textAlign: 'right',
    color: ChildColors.textSecondary,
    fontWeight: 'bold',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ChildColors.cardBorder,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    color: ChildColors.textPrimary,
  },
  taskMeta: {
    color: ChildColors.textSecondary,
  },
  taskRate: {
    fontWeight: 'bold',
    width: 45,
    textAlign: 'right',
  },
  periodCard: {
    backgroundColor: ChildColors.cardBackground,
    marginBottom: 8,
    borderRadius: ChildSizes.cardRadius,
  },
  periodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodInfo: {
    flex: 1,
  },
  periodDates: {
    color: ChildColors.textPrimary,
  },
  periodStars: {
    color: ChildColors.textSecondary,
  },
  outcomeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyText: {
    color: ChildColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
