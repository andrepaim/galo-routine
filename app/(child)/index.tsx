import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Text, Surface, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ChildColors } from '../../constants';
import { useAuthStore, useCompletionStore, useRewardStore } from '../../lib/stores';
import { useTodayTasks } from '../../lib/hooks/useTodayTasks';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function ChildTodayScreen() {
  const router = useRouter();
  const childName = useAuthStore((s) => s.childName);
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const setRole = useAuthStore((s) => s.setRole);
  const { activePeriod } = useCurrentPeriod();
  const { todayTasks, isLoading } = useTodayTasks();
  const markTaskDone = useCompletionStore((s) => s.markTaskDone);
  const allRewards = useRewardStore((s) => s.rewards);
  const redeemReward = useRewardStore((s) => s.redeemReward);
  const rewards = React.useMemo(() => allRewards.filter(r => r.isActive), [allRewards]);

  const starBalance = family?.starBalance || 0;

  const handleCompleteTask = async (task: typeof todayTasks[0]) => {
    if (!familyId || !activePeriod?.id) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markTaskDone(familyId, activePeriod.id, task);
  };

  const handleRedeemReward = async (reward: typeof rewards[0]) => {
    if (!familyId || starBalance < reward.starCost) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await redeemReward(familyId, reward);
  };

  const switchToParent = async () => {
    await setRole('parent');
    router.replace('/(parent)');
  };

  if (isLoading) {
    return <LoadingScreen variant="skeleton-list" />;
  }

  const completedCount = todayTasks.filter(t => 
    t.completion?.status === 'approved' || t.completion?.status === 'pending'
  ).length;
  const totalTasks = todayTasks.length;

  const TaskCard = ({ item }: { item: typeof todayTasks[0] }) => {
    const isCompleted = item.completion?.status === 'approved' || item.completion?.status === 'pending';
    
    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <Surface style={[styles.taskCard, isCompleted && styles.taskCardCompleted]} elevation={0}>
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => !isCompleted && handleCompleteTask(item)}
            disabled={isCompleted}
          >
            <View style={styles.iconWrap}>
              {isCompleted ? (
                <Text style={styles.iconEmoji}>✅</Text>
              ) : item.icon && item.icon.length > 2 ? (
                <Icon source={item.icon} size={28} color={ChildColors.starGold} />
              ) : (
                <Text style={styles.iconEmoji}>{item.icon || '📝'}</Text>
              )}
            </View>
            <Text style={[styles.taskName, isCompleted && styles.taskNameCompleted]} numberOfLines={2}>{item.name}</Text>
            <View style={styles.points}>
              <Text style={styles.pointsText}>⭐ {item.starValue || 1}</Text>
            </View>
          </TouchableOpacity>
        </Surface>
      </Animated.View>
    );
  };

  const RewardCard = ({ item }: { item: typeof rewards[0] }) => {
    const canAfford = starBalance >= item.starCost;
    
    return (
      <Animated.View entering={FadeInDown.duration(400)}>
        <Surface style={styles.rewardCard} elevation={0}>
          <View style={styles.cardContent}>
            <View style={styles.iconWrap}>
              {item.icon && item.icon.length > 2 ? (
                <Icon source={item.icon} size={28} color={ChildColors.starGold} />
              ) : (
                <Text style={styles.iconEmoji}>{item.icon || '🎁'}</Text>
              )}
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.cost}>⭐ {item.starCost}</Text>
            </View>
            <TouchableOpacity
              style={[styles.redeemButton, !canAfford && styles.redeemButtonDisabled]}
              onPress={() => canAfford && handleRedeemReward(item)}
              disabled={!canAfford}
            >
              <Text style={[styles.redeemButtonText, !canAfford && styles.redeemButtonTextDisabled]}>
                Resgatar
              </Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Oi, {(childName || 'Vitor').split(' ')[0]}! ⚽</Text>
            <Text style={styles.date}>
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </Text>
            <View style={styles.balance}>
              <Text style={styles.balanceText}>⭐ {starBalance}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={switchToParent} style={styles.parentBtn}>
            <Text style={styles.parentBtnText}>👨‍👩‍👦</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tasks */}
        <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Tarefas de Hoje</Text>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{completedCount}/{totalTasks} tarefas</Text>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { 
                  width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` 
                }]} 
              />
            </View>
          </View>

          <FlatList
            data={todayTasks}
            renderItem={TaskCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <Surface style={styles.emptyCard} elevation={0}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyTitle}>Dia Livre!</Text>
                <Text style={styles.emptyText}>Nenhuma tarefa para hoje. Aproveite!</Text>
              </Surface>
            )}
          />
        </Animated.View>

        {/* Rewards */}
        <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Meus Prêmios</Text>
          
          <FlatList
            data={rewards}
            renderItem={RewardCard}
            keyExtractor={(item) => item.id!}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <Surface style={styles.emptyCard} elevation={0}>
                <Text style={styles.emptyEmoji}>🎁</Text>
                <Text style={styles.emptyTitle}>Nenhum prêmio disponível</Text>
                <Text style={styles.emptyText}>Seus pais ainda não criaram prêmios!</Text>
              </Surface>
            )}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ChildColors.galoBlack },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: '800', color: ChildColors.textPrimary, marginBottom: 4 },
  date: { fontSize: 14, color: ChildColors.textSecondary, textTransform: 'capitalize', marginBottom: 12 },
  balance: { backgroundColor: ChildColors.starGold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  balanceText: { fontSize: 20, fontWeight: '800', color: ChildColors.galoBlack },
  parentBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  parentBtnText: { fontSize: 28 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: ChildColors.textPrimary, marginBottom: 16 },
  progressContainer: { marginBottom: 16 },
  progressText: { fontSize: 14, color: ChildColors.textSecondary, marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: ChildColors.cardBorder, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: ChildColors.starGold, borderRadius: 4 },
  separator: { height: 12 },
  taskCard: { backgroundColor: ChildColors.cardBackground, borderRadius: 12, borderWidth: 1, borderColor: ChildColors.cardBorder },
  taskCardCompleted: { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22C55E' },
  rewardCard: { backgroundColor: ChildColors.cardBackground, borderRadius: 12, borderWidth: 1, borderColor: ChildColors.cardBorder },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconWrap: { width: 36, height: 36, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 12 },
  iconEmoji: { fontSize: 24 },
  taskName: { flex: 1, fontSize: 16, fontWeight: '600', color: ChildColors.textPrimary },
  taskNameCompleted: { color: ChildColors.textSecondary },
  rewardName: { fontSize: 16, fontWeight: '600', color: ChildColors.textPrimary, marginBottom: 4 },
  points: { backgroundColor: ChildColors.starGold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pointsText: { fontSize: 14, fontWeight: '700', color: ChildColors.galoBlack },
  rewardInfo: { flex: 1 },
  cost: { fontSize: 14, fontWeight: '600', color: ChildColors.starGold, marginTop: 4 },
  redeemButton: { backgroundColor: ChildColors.starGold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  redeemButtonDisabled: { backgroundColor: ChildColors.textMuted },
  redeemButtonText: { fontSize: 14, fontWeight: '700', color: ChildColors.galoBlack },
  redeemButtonTextDisabled: { color: ChildColors.textSecondary },
  emptyCard: { backgroundColor: ChildColors.cardBackground, borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: ChildColors.cardBorder },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: ChildColors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: ChildColors.textSecondary, textAlign: 'center' },
});