import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, FlatList } from 'react-native';
import { Text, Card, Button, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInLeft, FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { useAuthStore, useCompletionStore, useRewardStore } from '../../lib/stores';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { useTodayTasks } from '../../lib/hooks/useTodayTasks';
import { useChampionship, useMatch } from '../../lib/hooks';
import { StarCounter } from '../../components/stars/StarCounter';
import { PeriodSummary } from '../../components/periods/PeriodSummary';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { AnimatedPressable } from '../../components/ui/AnimatedPressable';
import { DayClosureModal } from '../../components/championship/DayClosureModal';
import { ApprovalCard } from '../../components/tasks/ApprovalCard';
import { EmptyState } from '../../components/ui/EmptyState';
import type { ChampionshipTask, MatchResult } from '../../lib/types/championship';

// Galo mascot
const GaloVolpi = require('../../assets/images/mascot/galo-volpi-white.png');

export default function ParentHomeScreen() {
  const router = useRouter();
  const parentName = useAuthStore((s) => s.parentName);
  const childName = useAuthStore((s) => s.childName);
  const family = useAuthStore((s) => s.family);
  const familyId = useAuthStore((s) => s.familyId);
  const { activePeriod, isLoading: periodLoading } = useCurrentPeriod();
  const starProgress = useStarBudget();
  const { completions, isLoading: completionsLoading, approveCompletion, rejectCompletion } = useCompletionStore();
  const pendingCompletions = completions.filter((c) => c.status === 'pending');
  const pendingCount = pendingCompletions.length;
  const pendingRedemptions = useRewardStore((s) => s.redemptions.filter((r) => r.status === 'pending').length);
  
  // Championship hooks
  const { championship, isLoading: champLoading } = useChampionship();
  const { match, opponentName, isOpen: isMatchOpen, closeDay } = useMatch();
  const { todayTasks } = useTodayTasks();
  
  // Day closure modal state
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [closureResult, setClosureResult] = useState<MatchResult | null>(null);
  const [isClosingDay, setIsClosingDay] = useState(false);

  // Convert today tasks to championship format
  const convertToChampionshipTasks = useCallback((): ChampionshipTask[] => {
    return todayTasks.map(task => ({
      id: task.id,
      name: task.name,
      goals: task.starValue || 1,
      taskType: (task.category === 'bonus' ? 'bonus' : 'routine') as 'routine' | 'bonus',
      completed: task.completion?.status === 'approved',
      completedAt: task.completion?.completedAt,
      scheduledDate: new Date().toISOString().split('T')[0],
    }));
  }, [todayTasks]);

  // Handle day closure
  const handleCloseDay = useCallback(async () => {
    // Confirm before closing
    Alert.alert(
      '⚽ Encerrar Partida',
      `Tem certeza que deseja encerrar a partida de hoje contra ${opponentName}?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClosingDay(true);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              
              const tasks = convertToChampionshipTasks();
              const result = await closeDay(tasks);
              
              // Calculate user goals from tasks
              const userGoals = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.goals, 0);
              const routineMissed = tasks.filter(t => !t.completed && t.taskType === 'routine').reduce((sum, t) => sum + t.goals, 0);
              
              // Get standing info
              const previousPosition = match?.result ? 1 : 1; // Will be updated by closeDay
              
              const matchResult: MatchResult = {
                userGoals,
                opponentGoals: routineMissed + Math.floor(Math.random() * 3), // Simulated
                opponentName,
                result: result.result,
                points: result.result === 'W' ? 3 : result.result === 'D' ? 1 : 0,
                previousPosition,
                newPosition: result.newPosition,
                positionChange: previousPosition - result.newPosition,
              };
              
              setClosureResult(matchResult);
              setShowClosureModal(true);
              
              await Haptics.notificationAsync(
                result.result === 'W' 
                  ? Haptics.NotificationFeedbackType.Success 
                  : Haptics.NotificationFeedbackType.Warning
              );
            } catch (error) {
              console.error('Error closing day:', error);
              Alert.alert('Erro', 'Não foi possível encerrar a partida. Tente novamente.');
            } finally {
              setIsClosingDay(false);
            }
          },
        },
      ]
    );
  }, [opponentName, closeDay, convertToChampionshipTasks, match]);

  // Handle view table after closure
  const handleViewTable = useCallback(() => {
    setShowClosureModal(false);
    router.push('/(child)/table');
  }, [router]);

  // Handle modal dismiss
  const handleDismissModal = useCallback(() => {
    setShowClosureModal(false);
  }, []);

  // Handle approvals
  const handleApprove = useCallback(async (completionId: string) => {
    if (!familyId || !activePeriod?.id) return;
    await approveCompletion(familyId, activePeriod.id, completionId);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [familyId, activePeriod?.id, approveCompletion]);

  const handleReject = useCallback(async (completionId: string, reason: string) => {
    if (!familyId || !activePeriod?.id) return;
    await rejectCompletion(familyId, activePeriod.id, completionId, reason);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [familyId, activePeriod?.id, rejectCompletion]);

  if (periodLoading) {
    return <LoadingScreen variant="skeleton-dashboard" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with mascot */}
        <Animated.View entering={FadeInLeft.duration(400)} style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.greeting}>
              Olá, {parentName || 'Pai/Mãe'}!
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Gerenciando a rotina de {childName || 'seu filho'}
            </Text>
          </View>
          <Image source={GaloVolpi} style={styles.headerMascot} resizeMode="contain" />
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
                <Icon source="clock-outline" size={32} color={ChildColors.starGold} />
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {pendingCount}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Pendentes
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
              <Icon source="star" size={28} color={ChildColors.starGold} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {family?.starBalance ?? 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Saldo de Estrelas
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, styles.statCardWrapper]}>
            <Card.Content style={styles.statContent}>
              <Icon source="fire" size={28} color={(family?.currentStreak ?? 0) > 0 ? ChildColors.accentRed : ChildColors.textMuted} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {family?.currentStreak ?? 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Dias Seguidos
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Pending Approvals Section */}
        {pendingCount > 0 && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                ⏳ Aguardando Aprovação ({pendingCount})
              </Text>
              {pendingCount > 2 && (
                <Button 
                  mode="text" 
                  onPress={() => router.push('/(parent)/approvals')}
                  textColor={ChildColors.starGold}
                  compact
                >
                  Ver Todas
                </Button>
              )}
            </View>
            <FlatList
              data={pendingCompletions.slice(0, 2)} // Show only first 2 on home screen
              keyExtractor={(item) => item.id!}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
                  <ApprovalCard
                    completion={item}
                    onApprove={() => handleApprove(item.id!)}
                    onReject={(reason) => handleReject(item.id!, reason)}
                  />
                </Animated.View>
              )}
              scrollEnabled={false}
              style={styles.approvalsList}
            />
          </Animated.View>
        )}

        {/* Active Period */}
        {activePeriod && (
          <Animated.View entering={FadeInUp.delay(250).duration(400)} style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Período Atual
            </Text>
            <PeriodSummary period={activePeriod} />
          </Animated.View>
        )}

        {/* Pending Redemptions */}
        {pendingRedemptions > 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <AnimatedPressable
              onPress={() => router.push('/(parent)/rewards/history')}
              haptic="light"
            >
              <Card style={styles.pendingRedemptionCard}>
                <Card.Content style={styles.pendingRedemptionContent}>
                  <Icon source="gift-outline" size={24} color={ChildColors.starGold} />
                  <Text variant="bodyMedium" style={styles.pendingRedemptionText}>
                    {pendingRedemptions} {pendingRedemptions === 1 ? 'resgate pendente' : 'resgates pendentes'}
                  </Text>
                  <Icon source="chevron-right" size={20} color={ChildColors.textSecondary} />
                </Card.Content>
              </Card>
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* Championship Day Closure */}
        {championship && isMatchOpen && (
          <Animated.View entering={FadeInUp.delay(320).duration(400)} style={styles.section}>
            <Card style={styles.matchCard}>
              <Card.Content style={styles.matchContent}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchEmoji}>⚽</Text>
                  <View style={styles.matchInfo}>
                    <Text variant="titleMedium" style={styles.matchTitle}>
                      Partida de Hoje
                    </Text>
                    <Text variant="bodyMedium" style={styles.matchOpponent}>
                      vs {opponentName}
                    </Text>
                  </View>
                  <View style={styles.matchStatusBadge}>
                    <Text style={styles.matchStatusText}>AO VIVO</Text>
                  </View>
                </View>
                <View style={styles.matchScorePreview}>
                  <Text style={styles.matchScoreLabel}>Placar atual:</Text>
                  <Text style={styles.matchScore}>
                    {todayTasks.filter(t => t.completion?.status === 'approved').reduce((sum, t) => sum + (t.starValue || 1), 0)} ⚽ ? 
                  </Text>
                </View>
                <Button
                  mode="contained"
                  icon="whistle"
                  onPress={handleCloseDay}
                  loading={isClosingDay}
                  disabled={isClosingDay}
                  style={styles.closeDayButton}
                  buttonColor="#E74C3C"
                  textColor="#FFFFFF"
                >
                  {isClosingDay ? 'Encerrando...' : 'Encerrar Partida'}
                </Button>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Ações Rápidas
          </Text>
          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => router.push('/(parent)/tasks/new')}
              style={styles.actionButton}
              buttonColor={ChildColors.starGold}
              textColor={ChildColors.galoBlack}
            >
              Nova Tarefa
            </Button>
            <Button
              mode="outlined"
              icon="chart-line"
              onPress={() => router.push('/(parent)/settings')}
              style={[styles.actionButton, styles.outlinedButton]}
              textColor={ChildColors.starGold}
            >
              Relatórios
            </Button>
          </View>
          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              icon="gift"
              onPress={() => router.push('/(parent)/rewards')}
              style={[styles.actionButton, styles.outlinedButton]}
              textColor={ChildColors.starGold}
            >
              Prêmios
            </Button>
            <Button
              mode="outlined"
              icon="cog"
              onPress={() => router.push('/(parent)/settings')}
              style={[styles.actionButton, styles.outlinedButton]}
              textColor={ChildColors.starGold}
            >
              Configurações
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
      {/* Day Closure Modal */}
      <DayClosureModal
        visible={showClosureModal}
        result={closureResult}
        userName={childName || 'Jogador'}
        onViewTable={handleViewTable}
        onDismiss={handleDismissModal}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  headerMascot: {
    width: 50,
    height: 80,
  },
  greeting: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  subtitle: {
    color: ChildColors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
    borderRadius: ChildSizes.cardRadius,
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  statLabel: {
    color: ChildColors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  approvalsList: {
    marginTop: 8,
  },
  pendingRedemptionCard: {
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 1,
    borderColor: ChildColors.starGold,
    borderRadius: ChildSizes.cardRadius,
    marginBottom: 16,
  },
  pendingRedemptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingRedemptionText: {
    flex: 1,
    color: ChildColors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  outlinedButton: {
    borderColor: ChildColors.starGold,
  },
  // Match/Championship styles
  matchCard: {
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 2,
    borderColor: '#E74C3C',
    borderRadius: ChildSizes.cardRadius,
  },
  matchContent: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  matchOpponent: {
    color: ChildColors.textSecondary,
  },
  matchStatusBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  matchScorePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  matchScoreLabel: {
    color: ChildColors.textSecondary,
    marginRight: 8,
  },
  matchScore: {
    color: ChildColors.starGold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeDayButton: {
    borderRadius: 12,
  },
});
