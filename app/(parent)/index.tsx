import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ChildColors } from '../../constants';
import { useAuthStore, useCompletionStore } from '../../lib/stores';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useTodayTasks } from '../../lib/hooks/useTodayTasks';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function ParentTodayScreen() {
  const router = useRouter();
  
  const childName = useAuthStore((s) => s.childName);
  const family = useAuthStore((s) => s.family);
  const familyId = useAuthStore((s) => s.familyId);
  const { activePeriod } = useCurrentPeriod();
  const { todayTasks, isLoading } = useTodayTasks();
  const { completions, approveCompletion, rejectCompletion } = useCompletionStore();

  const pendingCompletions = completions.filter((c) => c.status === 'pending');
  const completedCount = todayTasks.filter(t => t.completion?.status === 'approved').length;
  const totalTasks = todayTasks.length;
  const starBalance = family?.starBalance || 0;

  const handleApprove = async (completionId: string) => {
    if (!familyId || !activePeriod?.id) return;
    await approveCompletion(familyId, activePeriod.id, completionId);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReject = async (completionId: string) => {
    if (!familyId || !activePeriod?.id) return;
    await rejectCompletion(familyId, activePeriod.id, completionId, 'Não aprovado');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  if (isLoading) {
    return <LoadingScreen variant="skeleton-dashboard" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.statsContainer}>
          <Surface style={styles.statCard} elevation={0}>
            <View style={styles.statContent}>
              <Text style={styles.statIcon}>⭐</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{starBalance}</Text>
                <Text style={styles.statLabel}>Estrelas de {childName || 'Vitor'}</Text>
              </View>
            </View>
          </Surface>
          
          <Surface style={styles.statCard} elevation={0}>
            <View style={styles.statContent}>
              <Text style={styles.statIcon}>📋</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{completedCount}/{totalTasks}</Text>
                <Text style={styles.statLabel}>Tarefas de hoje</Text>
              </View>
            </View>
          </Surface>
        </Animated.View>

        {/* Pending Approvals */}
        {pendingCompletions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>
              ⏳ Aguardando Aprovação ({pendingCompletions.length})
            </Text>
            
            {pendingCompletions.map((completion, index) => {
              const task = todayTasks.find(t => t.id === completion.taskId);
              if (!task) return null;
              
              return (
                <Animated.View 
                  key={completion.id} 
                  entering={FadeInDown.delay(200 + index * 100).duration(400)}
                >
                  <Surface style={styles.approvalCard} elevation={0}>
                    <View style={styles.approvalContent}>
                      <View style={styles.approvalLeft}>
                        <View style={styles.iconWrap}>
                          {task.icon && task.icon.length > 2 ? (
                            <Icon source={task.icon} size={28} color={ChildColors.starGold} />
                          ) : (
                            <Text style={styles.approvalIcon}>{task.icon || '📝'}</Text>
                          )}
                        </View>
                        <View style={styles.approvalInfo}>
                          <Text style={styles.approvalTaskName}>{task.name}</Text>
                          <Text style={styles.approvalReward}>⭐ {task.starValue || 1} estrelas</Text>
                          {completion.completedAt && (
                            <Text style={styles.approvalTime}>
                              {new Date(completion.completedAt.toDate()).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.approvalActions}>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleReject(completion.id!)}
                        >
                          <Text style={styles.rejectButtonText}>❌</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.approveButton}
                          onPress={() => handleApprove(completion.id!)}
                        >
                          <Text style={styles.approveButtonText}>✅</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Surface>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(parent)/tasks/new')}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionTitle}>Nova Tarefa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(parent)/rewards/new')}
            >
              <Text style={styles.actionIcon}>🎁</Text>
              <Text style={styles.actionTitle}>Novo Prêmio</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Today's Tasks */}
        {totalTasks > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Tarefas de Hoje</Text>
            
            {todayTasks.map((task) => {
              const isCompleted = task.completion?.status === 'approved';
              const isPending = task.completion?.status === 'pending';
              
              return (
                <Surface key={task.id} style={[
                  styles.taskCard,
                  isCompleted && styles.taskCardCompleted,
                  isPending && styles.taskCardPending
                ]} elevation={0}>
                  <View style={styles.taskContent}>
                    <View style={styles.iconWrap}>
                      {task.icon && task.icon.length > 2 ? (
                        <Icon source={task.icon} size={24} color={ChildColors.starGold} />
                      ) : (
                        <Text style={styles.taskIcon}>{task.icon || '📝'}</Text>
                      )}
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskName}>{task.name}</Text>
                      <Text style={styles.taskReward}>⭐ {task.starValue || 1}</Text>
                    </View>
                    <Text style={styles.taskStatus}>
                      {isCompleted ? '✅' : isPending ? '⏳' : '⚪'}
                    </Text>
                  </View>
                </Surface>
              );
            })}
          </Animated.View>
        )}

        {/* Empty State */}
        {totalTasks === 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>Nenhuma tarefa para hoje</Text>
              <Text style={styles.emptySubtitle}>
                Crie tarefas para {childName || 'seu filho'} começar a ganhar estrelas!
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/(parent)/manage')}
                style={styles.emptyButton}
                buttonColor={ChildColors.starGold}
                textColor={ChildColors.galoBlack}
              >
                Gerenciar Tarefas
              </Button>
            </Surface>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ChildColors.galoBlack },
  content: { padding: 16 },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: ChildColors.cardBackground, borderWidth: 1, borderColor: ChildColors.cardBorder, borderRadius: 12 },
  statContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  statIcon: { fontSize: 24, marginRight: 12 },
  statInfo: { flex: 1 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: ChildColors.textPrimary },
  statLabel: { fontSize: 12, color: ChildColors.textSecondary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: ChildColors.textPrimary, marginBottom: 12 },
  approvalCard: { backgroundColor: ChildColors.cardBackground, borderWidth: 1, borderColor: ChildColors.starGold, borderRadius: 12, marginBottom: 12 },
  approvalContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  approvalLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 36, height: 36, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 12 },
  approvalIcon: { fontSize: 24 },
  approvalInfo: { flex: 1 },
  approvalTaskName: { fontSize: 16, fontWeight: '600', color: ChildColors.textPrimary, marginBottom: 4 },
  approvalReward: { fontSize: 14, color: ChildColors.starGold, marginBottom: 2 },
  approvalTime: { fontSize: 12, color: ChildColors.textSecondary },
  approvalActions: { flexDirection: 'row', gap: 8 },
  approveButton: { backgroundColor: ChildColors.accentGreen, padding: 8, borderRadius: 20, minWidth: 40, alignItems: 'center' },
  approveButtonText: { fontSize: 18 },
  rejectButton: { backgroundColor: ChildColors.accentRed, padding: 8, borderRadius: 20, minWidth: 40, alignItems: 'center' },
  rejectButtonText: { fontSize: 18 },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: ChildColors.cardBackground, borderWidth: 1, borderColor: ChildColors.cardBorder, borderRadius: 12, padding: 16, alignItems: 'center' },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionTitle: { fontSize: 14, fontWeight: 'bold', color: ChildColors.textPrimary, textAlign: 'center' },
  taskCard: { backgroundColor: ChildColors.cardBackground, borderWidth: 1, borderColor: ChildColors.cardBorder, borderRadius: 12, marginBottom: 8 },
  taskCardCompleted: { borderColor: ChildColors.accentGreen, backgroundColor: ChildColors.accentGreenContainer },
  taskCardPending: { borderColor: ChildColors.starGold, backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  taskContent: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  taskIcon: { fontSize: 20, marginRight: 12 },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 14, fontWeight: '600', color: ChildColors.textPrimary },
  taskReward: { fontSize: 12, color: ChildColors.starGold, marginTop: 2 },
  taskStatus: { fontSize: 20 },
  emptyCard: { backgroundColor: ChildColors.cardBackground, borderWidth: 1, borderColor: ChildColors.cardBorder, borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: ChildColors.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: ChildColors.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyButton: { borderRadius: 8 },
});