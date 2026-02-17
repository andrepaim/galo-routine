import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Icon, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ChildColors } from '../../constants';
import { useAuthStore, useTaskStore, useRewardStore } from '../../lib/stores';
import { TaskCard } from '../../components/tasks/TaskCard';
import { RewardCard } from '../../components/rewards/RewardCard';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

const DEFAULT_REWARDS = [
  { name: '30min de videogame', description: '', starCost: 5, icon: '🎮', availability: 'unlimited' as const, requiresApproval: false },
  { name: 'Escolher o filme', description: '', starCost: 8, icon: '🎬', availability: 'unlimited' as const, requiresApproval: false },
  { name: 'Sorvete', description: '', starCost: 10, icon: '🍦', availability: 'unlimited' as const, requiresApproval: false },
  { name: 'Passeio especial', description: '', starCost: 20, icon: '🚗', availability: 'unlimited' as const, requiresApproval: true },
];

export default function ManageScreen() {
  const router = useRouter();
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [rewardsExpanded, setRewardsExpanded] = useState(true);
  
  const familyId = useAuthStore((s) => s.familyId);
  const childName = useAuthStore((s) => s.childName);
  const { tasks, isLoading: tasksLoading, subscribe: subscribeTasks } = useTaskStore();
  const { rewards, isLoading: rewardsLoading, subscribeRewards, addReward } = useRewardStore();

  useEffect(() => {
    if (!familyId) return;
    
    const unsubscribeTasks = subscribeTasks(familyId);
    const unsubscribeRewards = subscribeRewards(familyId);
    
    return () => {
      unsubscribeTasks();
      unsubscribeRewards();
    };
  }, [familyId, subscribeTasks, subscribeRewards]);

  const activeTasks = tasks.filter(t => t.isActive);
  const activeRewards = rewards.filter(r => r.isActive);

  const handleTaskEdit = (taskId: string) => {
    router.push(`/(parent)/tasks/${taskId}`);
  };

  const handleRewardEdit = (rewardId: string) => {
    router.push(`/(parent)/rewards/${rewardId}`);
  };

  const initializeDefaultRewards = async () => {
    if (!familyId) return;
    
    Alert.alert(
      'Criar Prêmios Padrão',
      `Deseja criar alguns prêmios básicos para ${childName || 'seu filho'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Criar',
          onPress: async () => {
            try {
              for (const reward of DEFAULT_REWARDS) {
                await addReward(familyId, reward);
              }
              Alert.alert('Sucesso!', 'Prêmios padrão criados com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível criar os prêmios padrão.');
            }
          }
        }
      ]
    );
  };

  if (tasksLoading || rewardsLoading) {
    return <LoadingScreen variant="skeleton-list" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Tasks Section */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setTasksExpanded(!tasksExpanded)}
          >
            <View style={styles.sectionTitleRow}>
              <Icon source="format-list-checks" size={24} color={ChildColors.starGold} />
              <Text style={styles.sectionTitle}>Tarefas ({activeTasks.length})</Text>
            </View>
            <Icon 
              source={tasksExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={ChildColors.textSecondary} 
            />
          </TouchableOpacity>

          {tasksExpanded && (
            <View style={styles.sectionContent}>
              <View style={styles.sectionActions}>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => router.push('/(parent)/tasks/new')}
                  style={styles.addButton}
                  buttonColor={ChildColors.starGold}
                  textColor={ChildColors.galoBlack}
                >
                  Nova Tarefa
                </Button>
                <Button
                  mode="outlined"
                  icon="format-list-bulleted"
                  onPress={() => router.push('/(parent)/tasks')}
                  style={styles.manageButton}
                  textColor={ChildColors.starGold}
                >
                  Gerenciar Todas
                </Button>
              </View>

              {activeTasks.length > 0 ? (
                <View style={styles.itemsList}>
                  {activeTasks.map((task, index) => (
                    <Animated.View
                      key={task.id}
                      entering={FadeInLeft.delay(index * 80).duration(400)}
                      style={styles.taskWrapper}
                    >
                      <TouchableOpacity onPress={() => handleTaskEdit(task.id!)}>
                        <TaskCard task={task} />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <Card style={styles.emptyCard}>
                  <Card.Content style={styles.emptyContent}>
                    <Text style={styles.emptyEmoji}>📝</Text>
                    <Text style={styles.emptyTitle}>Nenhuma tarefa ativa</Text>
                    <Text style={styles.emptySubtitle}>
                      Crie tarefas para {childName || 'seu filho'} começar a ganhar estrelas!
                    </Text>
                  </Card.Content>
                </Card>
              )}
            </View>
          )}
        </Animated.View>

        {/* Rewards Section */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setRewardsExpanded(!rewardsExpanded)}
          >
            <View style={styles.sectionTitleRow}>
              <Icon source="gift" size={24} color={ChildColors.starGold} />
              <Text style={styles.sectionTitle}>Prêmios ({activeRewards.length})</Text>
            </View>
            <Icon 
              source={rewardsExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={ChildColors.textSecondary} 
            />
          </TouchableOpacity>

          {rewardsExpanded && (
            <View style={styles.sectionContent}>
              <View style={styles.sectionActions}>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => router.push('/(parent)/rewards/new')}
                  style={styles.addButton}
                  buttonColor={ChildColors.starGold}
                  textColor={ChildColors.galoBlack}
                >
                  Novo Prêmio
                </Button>
                <Button
                  mode="outlined"
                  icon="gift-outline"
                  onPress={() => router.push('/(parent)/rewards')}
                  style={styles.manageButton}
                  textColor={ChildColors.starGold}
                >
                  Gerenciar Todos
                </Button>
              </View>

              {activeRewards.length > 0 ? (
                <View style={styles.itemsList}>
                  {activeRewards.map((reward, index) => (
                    <Animated.View
                      key={reward.id}
                      entering={FadeInLeft.delay(100 + index * 80).duration(400)}
                      style={styles.rewardWrapper}
                    >
                      <TouchableOpacity onPress={() => handleRewardEdit(reward.id!)}>
                        <RewardCard reward={reward} starBalance={0} />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <Card style={styles.emptyCard}>
                  <Card.Content style={styles.emptyContent}>
                    <Text style={styles.emptyEmoji}>🎁</Text>
                    <Text style={styles.emptyTitle}>Nenhum prêmio ativo</Text>
                    <Text style={styles.emptySubtitle}>
                      Crie prêmios para motivar {childName || 'seu filho'}!
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={initializeDefaultRewards}
                      style={styles.emptyButton}
                      textColor={ChildColors.starGold}
                    >
                      Criar Prêmios Padrão
                    </Button>
                  </Card.Content>
                </Card>
              )}
            </View>
          )}
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <Text style={styles.statsTitle}>📊 Resumo</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{activeTasks.length}</Text>
                  <Text style={styles.statLabel}>Tarefas Ativas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{activeRewards.length}</Text>
                  <Text style={styles.statLabel}>Prêmios Ativos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {activeTasks.reduce((sum, t) => sum + (t.starValue || 1), 0)}
                  </Text>
                  <Text style={styles.statLabel}>Estrelas/Dia</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ChildColors.galoBlack },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: ChildColors.cardBackground, borderRadius: 12, borderWidth: 1, borderColor: ChildColors.cardBorder },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: ChildColors.textPrimary },
  sectionContent: { marginTop: 12 },
  sectionActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  addButton: { flex: 1, borderRadius: 8 },
  manageButton: { flex: 1, borderRadius: 8, borderColor: ChildColors.starGold },
  itemsList: { gap: 12 },
  taskWrapper: {},
  rewardWrapper: {},
  emptyCard: { backgroundColor: ChildColors.cardBackground, borderWidth: 1, borderColor: ChildColors.cardBorder },
  emptyContent: { padding: 24, alignItems: 'center' },
  emptyEmoji: { fontSize: 32, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: ChildColors.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: ChildColors.textSecondary, textAlign: 'center', marginBottom: 16 },
  emptyButton: { borderColor: ChildColors.starGold },
  statsCard: { backgroundColor: ChildColors.cardBackground, borderWidth: 1, borderColor: ChildColors.cardBorder },
  statsContent: { padding: 16 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: ChildColors.textPrimary, marginBottom: 16, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: ChildColors.starGold },
  statLabel: { fontSize: 12, color: ChildColors.textSecondary, textAlign: 'center' },
});