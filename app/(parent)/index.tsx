import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ChildColors } from '../../constants';
import { useAuthStore, useCompletionStore, useTaskStore } from '../../lib/stores';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useTodayTasks } from '../../lib/hooks/useTodayTasks';
import { ApprovalCard } from '../../components/tasks/ApprovalCard';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

// Default tasks to create if none exist
const DEFAULT_TASKS = [
  { name: 'Escovar os dentes (manhã)', description: '', starValue: 1, icon: '🦷', recurrenceType: 'daily' as const, days: [], category: 'routine' },
  { name: 'Escovar os dentes (noite)', description: '', starValue: 1, icon: '🦷', recurrenceType: 'daily' as const, days: [], category: 'routine' },
  { name: 'Fazer lição de casa', description: '', starValue: 3, icon: '📚', recurrenceType: 'daily' as const, days: [], category: 'routine' },
  { name: 'Arrumar a cama', description: '', starValue: 1, icon: '🛏️', recurrenceType: 'daily' as const, days: [], category: 'routine' },
  { name: 'Ler 20 minutos', description: '', starValue: 2, icon: '📖', recurrenceType: 'daily' as const, days: [], category: 'routine' },
  { name: 'Guardar os brinquedos', description: '', starValue: 1, icon: '🧸', recurrenceType: 'daily' as const, days: [], category: 'routine' },
];

export default function ParentTodayScreen() {
  const router = useRouter();
  const [quickTaskName, setQuickTaskName] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  const childName = useAuthStore((s) => s.childName);
  const family = useAuthStore((s) => s.family);
  const familyId = useAuthStore((s) => s.familyId);
  const { activePeriod, isLoading: periodLoading } = useCurrentPeriod();
  const { todayTasks, isLoading: tasksLoading } = useTodayTasks();
  const { completions, approveCompletion, rejectCompletion } = useCompletionStore();
  const { addTask } = useTaskStore();

  // Get pending completions
  const pendingCompletions = completions.filter((c) => c.status === 'pending');
  
  // Calculate stats
  const completedCount = todayTasks.filter(t => t.completion?.status === 'approved').length;
  const totalTasks = todayTasks.length;
  const starBalance = family?.starBalance || 0;

  // Handle approvals
  const handleApprove = async (completionId: string) => {
    if (!familyId || !activePeriod?.id) return;
    await approveCompletion(familyId, activePeriod.id, completionId);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReject = async (completionId: string, reason: string) => {
    if (!familyId || !activePeriod?.id) return;
    await rejectCompletion(familyId, activePeriod.id, completionId, reason);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // Handle quick task creation
  const handleCreateQuickTask = async () => {
    if (!quickTaskName.trim() || !familyId || !activePeriod?.id) return;
    
    setIsCreatingTask(true);
    try {
      await addTask(familyId, {
        name: quickTaskName.trim(),
        description: '',
        starValue: 2,
        icon: '⚡',
        recurrenceType: 'once',
        days: [],
        category: 'bonus',
      });
      
      setQuickTaskName('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso!', `Tarefa "${quickTaskName.trim()}" criada com sucesso.`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a tarefa.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Initialize default tasks if none exist
  const initializeDefaultTasks = async () => {
    if (!familyId) return;
    
    Alert.alert(
      'Criar Tarefas Padrão',
      'Deseja criar algumas tarefas básicas para começar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Criar',
          onPress: async () => {
            try {
              for (const task of DEFAULT_TASKS) {
                await addTask(familyId, task);
              }
              Alert.alert('Sucesso!', 'Tarefas padrão criadas com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível criar as tarefas padrão.');
            }
          }
        }
      ]
    );
  };

  if (periodLoading || tasksLoading) {
    return <LoadingScreen variant="skeleton-dashboard" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Stats */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <View style={styles.statIcon}>
                  <Icon source="star" size={24} color={ChildColors.starGold} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{starBalance}</Text>
                  <Text style={styles.statLabel}>Estrelas de {childName || 'Vitor'}</Text>
                </View>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <View style={styles.statIcon}>
                  <Icon source="format-list-checks" size={24} color={ChildColors.starGold} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statNumber}>{completedCount}/{totalTasks}</Text>
                  <Text style={styles.statLabel}>Tarefas de hoje</Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        </Animated.View>

        {/* Pending Approvals */}
        {pendingCompletions.length > 0 && (
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>
              ⏳ Aguardando Aprovação ({pendingCompletions.length})
            </Text>
            <View style={styles.approvalsList}>
              {pendingCompletions.map((completion, index) => (
                <Animated.View 
                  key={completion.id} 
                  entering={FadeInLeft.delay(index * 100).duration(400)}
                >
                  <ApprovalCard
                    completion={completion}
                    onApprove={() => handleApprove(completion.id!)}
                    onReject={(reason) => handleReject(completion.id!, reason)}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Quick Add Task */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Tarefa Rápida</Text>
          <Card style={styles.quickAddCard}>
            <Card.Content style={styles.quickAddContent}>
              <View style={styles.quickAddInput}>
                <Icon source="plus-circle" size={20} color={ChildColors.starGold} />
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() => {
                    Alert.prompt(
                      'Nova Tarefa',
                      'Digite o nome da tarefa para hoje:',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Criar',
                          onPress: (text?: string) => {
                            if (text?.trim()) {
                              setQuickTaskName(text.trim());
                              handleCreateQuickTask();
                            }
                          }
                        }
                      ],
                      'plain-text',
                      quickTaskName
                    );
                  }}
                >
                  <Text style={styles.quickAddButtonText}>
                    Adicionar tarefa para hoje
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Empty State for Tasks */}
        {totalTasks === 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyEmoji}>📝</Text>
                <Text style={styles.emptyTitle}>Nenhuma tarefa criada</Text>
                <Text style={styles.emptySubtitle}>
                  Crie algumas tarefas para {childName || 'seu filho'} começar a ganhar estrelas!
                </Text>
                <Button
                  mode="contained"
                  onPress={initializeDefaultTasks}
                  style={styles.emptyButton}
                  buttonColor={ChildColors.starGold}
                  textColor={ChildColors.galoBlack}
                >
                  Criar Tarefas Padrão
                </Button>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Ações Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(parent)/manage')}
            >
              <Icon source="format-list-bulleted" size={32} color={ChildColors.starGold} />
              <Text style={styles.actionTitle}>Gerenciar Tarefas</Text>
              <Text style={styles.actionSubtitle}>Criar, editar e organizar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(parent)/manage')}
            >
              <Icon source="gift" size={32} color={ChildColors.starGold} />
              <Text style={styles.actionTitle}>Gerenciar Prêmios</Text>
              <Text style={styles.actionSubtitle}>Criar e editar recompensas</Text>
            </TouchableOpacity>
          </View>
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

  // Stats
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statIcon: {
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: ChildColors.textSecondary,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: 12,
  },

  // Approvals
  approvalsList: {
    gap: 12,
  },

  // Quick Add
  quickAddCard: {
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  quickAddContent: {
    padding: 16,
  },
  quickAddInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickAddButton: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ChildColors.starGold,
    borderStyle: 'dashed',
  },
  quickAddButtonText: {
    color: ChildColors.starGold,
    fontSize: 14,
    textAlign: 'center',
  },

  // Empty State
  emptyCard: {
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 8,
  },

  // Actions
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
});