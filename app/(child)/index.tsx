import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeIn, 
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { ChildColors } from '../../constants';
import { useAuthStore, useCompletionStore, useRewardStore } from '../../lib/stores';
import { useTodayTasks } from '../../lib/hooks/useTodayTasks';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function ChildTodayScreen() {
  const router = useRouter();
  const childName = useAuthStore((s) => s.childName);
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const setRole = useAuthStore((s) => s.setRole);
  const { activePeriod } = useCurrentPeriod();
  const { todayTasks, isLoading } = useTodayTasks();
  const starBudget = useStarBudget();
  const markTaskDone = useCompletionStore((s) => s.markTaskDone);
  const rewards = useRewardStore((s) => s.rewards.filter(r => r.isActive));
  const redeemReward = useRewardStore((s) => s.redeemReward);

  const today = new Date();
  const starBalance = family?.starBalance || 0;
  
  // Animation values
  const starCounter = useSharedValue(starBalance);
  
  const animatedStarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starCounter.value > starBalance ? withSpring(1.2) : withSpring(1) }],
  }));

  const handleCompleteTask = async (task: typeof todayTasks[0]) => {
    if (!familyId || !activePeriod?.id) return;
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate star counter
    starCounter.value = starBalance + (task.starValue || 1);
    
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              Oi, {(childName || 'Vitor').split(' ')[0]}! ⚽
            </Text>
            <Text style={styles.dateText}>
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </Text>
            <Animated.View style={[styles.starBalance, animatedStarStyle]}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.starCount}>{starBalance}</Text>
            </Animated.View>
          </View>
          <TouchableOpacity 
            onPress={switchToParent} 
            style={styles.parentButton}
          >
            <Text style={styles.parentButtonText}>👨‍👩‍👦</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Today's Tasks */}
        <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Tarefas de Hoje</Text>
          
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{completedCount}/{totalTasks} tarefas</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }
                ]} 
              />
            </View>
          </View>

          {/* Task Cards */}
          <View style={styles.taskList}>
            {todayTasks.map((task, index) => {
              const isCompleted = task.completion?.status === 'approved' || task.completion?.status === 'pending';
              const isPending = task.completion?.status === 'pending';
              
              return (
                <Animated.View 
                  key={task.id} 
                  entering={FadeIn.delay(300 + index * 100).duration(400)}
                >
                  <Surface style={[
                    styles.taskCard,
                    isCompleted && styles.taskCardCompleted
                  ]} elevation={0}>
                    <TouchableOpacity
                      style={styles.taskContent}
                      onPress={() => !isCompleted && handleCompleteTask(task)}
                      disabled={isCompleted}
                    >
                      <View style={styles.taskLeft}>
                        <View style={[
                          styles.taskIcon,
                          isCompleted && styles.taskIconCompleted
                        ]}>
                          <Text style={styles.taskEmoji}>
                            {isCompleted ? '✅' : task.icon || '📝'}
                          </Text>
                        </View>
                        <View style={styles.taskInfo}>
                          <Text style={[
                            styles.taskName,
                            isCompleted && styles.taskNameCompleted
                          ]}>
                            {task.name}
                          </Text>
                          {isPending && (
                            <Text style={styles.taskStatus}>Aguardando aprovação</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.taskReward}>
                        <Text style={styles.starIcon}>⭐</Text>
                        <Text style={styles.starValue}>{task.starValue || 1}</Text>
                      </View>
                    </TouchableOpacity>
                  </Surface>
                </Animated.View>
              );
            })}
          </View>

          {totalTasks === 0 && (
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>Dia Livre!</Text>
              <Text style={styles.emptySubtitle}>
                Nenhuma tarefa para hoje. Aproveite!
              </Text>
            </Surface>
          )}
        </Animated.View>

        {/* My Rewards */}
        <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Meus Prêmios</Text>
          
          {rewards.length > 0 ? (
            <View style={styles.rewardList}>
              {rewards.map((reward, index) => {
                const canAfford = starBalance >= reward.starCost;
                const isAvailable = reward.availability === 'unlimited' || (reward.quantity ?? 0) > 0;
                
                return (
                  <Animated.View 
                    key={reward.id} 
                    entering={FadeIn.delay(500 + index * 100).duration(400)}
                  >
                    <Surface style={styles.rewardCard} elevation={0}>
                      <View style={styles.rewardContent}>
                        <View style={styles.rewardLeft}>
                          <View style={styles.rewardIcon}>
                            <Text style={styles.rewardEmoji}>{reward.icon}</Text>
                          </View>
                          <View style={styles.rewardInfo}>
                            <Text style={styles.rewardName}>{reward.name}</Text>
                            <View style={styles.rewardCost}>
                              <Text style={styles.starIcon}>⭐</Text>
                              <Text style={styles.rewardStarCost}>{reward.starCost}</Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.redeemButton,
                            (!canAfford || !isAvailable) && styles.redeemButtonDisabled
                          ]}
                          onPress={() => canAfford && isAvailable && handleRedeemReward(reward)}
                          disabled={!canAfford || !isAvailable}
                        >
                          <Text style={[
                            styles.redeemButtonText,
                            (!canAfford || !isAvailable) && styles.redeemButtonTextDisabled
                          ]}>
                            Resgatar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Surface>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyTitle}>Nenhum prêmio disponível</Text>
              <Text style={styles.emptySubtitle}>
                Seus pais ainda não criaram prêmios para você!
              </Text>
            </Surface>
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
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: ChildColors.textPrimary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  starBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChildColors.starGold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  starIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  starCount: {
    fontSize: 20,
    fontWeight: '800',
    color: ChildColors.galoBlack,
  },
  parentButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  parentButtonText: {
    fontSize: 28,
  },
  
  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    marginBottom: 16,
  },
  
  // Progress
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: ChildColors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ChildColors.starGold,
    borderRadius: 4,
  },
  
  // Tasks
  taskList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  taskCardCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22C55E',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  taskLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: ChildColors.galoDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskIconCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  taskEmoji: {
    fontSize: 24,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: ChildColors.textPrimary,
  },
  taskNameCompleted: {
    color: ChildColors.textSecondary,
  },
  taskStatus: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
  },
  taskReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChildColors.starGold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  starValue: {
    fontSize: 14,
    fontWeight: '700',
    color: ChildColors.galoBlack,
  },
  
  // Rewards
  rewardList: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rewardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: ChildColors.galoDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardEmoji: {
    fontSize: 24,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: ChildColors.textPrimary,
    marginBottom: 4,
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardStarCost: {
    fontSize: 14,
    fontWeight: '600',
    color: ChildColors.starGold,
  },
  redeemButton: {
    backgroundColor: ChildColors.starGold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: ChildColors.textMuted,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ChildColors.galoBlack,
  },
  redeemButtonTextDisabled: {
    color: ChildColors.textSecondary,
  },
  
  // Empty states
  emptyCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
});